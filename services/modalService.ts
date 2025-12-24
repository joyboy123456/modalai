import type { GeneratedImage, AspectRatioOption } from "../types"
import { generateUUID } from "./utils"

// API 端点 - 直接调用 Modal
const MODAL_ENDPOINTS = {
  generate: "https://joyboyjoyboy488-53207--z-image-service-zimageservice-generate.modal.run",
  upscale: "https://joyboyjoyboy488-53207--z-image-service-zimageservice-upscale.modal.run",
  decompose: "https://joyboyjoyboy488-53207--z-image-service-layeredservice-decompose.modal.run",
}

export const getModalEndpoint = (): string => {
  return MODAL_ENDPOINTS.generate
}

export const saveModalEndpoint = (endpoint: string) => {
  // 保留接口兼容性，但不再使用
}

const getBaseDimensions = (ratio: AspectRatioOption) => {
  switch (ratio) {
    case "16:9":
      return { width: 1024, height: 576 }
    case "4:3":
      return { width: 1024, height: 768 }
    case "3:2":
      return { width: 960, height: 640 }
    case "9:16":
      return { width: 576, height: 1024 }
    case "3:4":
      return { width: 768, height: 1024 }
    case "2:3":
      return { width: 640, height: 960 }
    case "1:1":
    default:
      return { width: 1024, height: 1024 }
  }
}

const getDimensions = (ratio: AspectRatioOption, enableHD: boolean) => {
  const base = getBaseDimensions(ratio)
  if (enableHD) {
    return {
      width: Math.round(base.width * 2),
      height: Math.round(base.height * 2),
    }
  }
  return base
}

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatioOption,
  seed?: number,
  steps = 9,
  enableHD = false,
): Promise<GeneratedImage> => {
  const endpoint = getModalEndpoint()
  const { width, height } = getDimensions(aspectRatio, enableHD)
  const finalSeed = seed ?? Math.floor(Math.random() * 2147483647)

  console.log("[v0] Calling Modal API:", endpoint)
  console.log("[v0] Request params:", {
    prompt: prompt.substring(0, 100) + "...",
    width,
    height,
    steps,
    seed: finalSeed,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), enableHD ? 180000 : 120000)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, width, height, steps, seed: finalSeed }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    console.log("[v0] Response status:", response.status)

    if (!response.ok) {
      if (response.status === 429) throw new Error("error_rate_limit")
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Response data keys:", Object.keys(data))

    if (!data.image) throw new Error("error_invalid_response")

    return {
      id: generateUUID(),
      url: data.image,
      model: "z-image-turbo",
      prompt,
      aspectRatio,
      timestamp: Date.now(),
      seed: data.seed || finalSeed,
      steps: data.steps || steps,
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error("[v0] Generate Error:", error.message)
    if (error.name === "AbortError") {
      throw new Error("请求超时，请稍后重试。如果使用高清模式，生成时间会更长。")
    }
    if (error.message === "Failed to fetch") {
      throw new Error("网络连接失败，请检查网络后重试。")
    }
    throw error
  }
}

export const upscaleImage = async (
  imageData: string,
  scale = 4,
): Promise<{ image: string; width: number; height: number }> => {
  console.log("[v0] Calling Modal Upscale API:", MODAL_ENDPOINTS.upscale)
  console.log("[v0] Upscale params: scale =", scale, ", image length =", imageData.length)

  try {
    const response = await fetch(MODAL_ENDPOINTS.upscale, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, scale }),
    })

    console.log("[v0] Upscale response status:", response.status)

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error("[v0] Upscale error response:", err)
      throw new Error(err.error || `Upscale Error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Upscale response data keys:", Object.keys(data))

    if (data.error) throw new Error(data.error)

    return { image: data.image, width: data.width, height: data.height }
  } catch (error: any) {
    console.error("[v0] Upscale Error:", error.message)
    if (error.message === "Failed to fetch") {
      throw new Error("无法连接到 Modal Upscale 服务。请确认 Modal 后端已配置 upscale_options 处理器。")
    }
    throw error
  }
}

export interface LayerResult {
  index: number
  image: string
  width: number
  height: number
}

export const decomposeImage = async (
  imageData: string,
  numLayers = 4,
  resolution = 640,
  seed?: number,
): Promise<{ layers: LayerResult[]; seed: number }> => {
  // Use AbortController for timeout (5 minutes for cold start)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000)

  // Log request size for debugging
  const requestBody = JSON.stringify({
    image: imageData,
    layers: numLayers,
    resolution,
    seed,
  })
  console.log(`[Decompose] Request size: ${(requestBody.length / 1024 / 1024).toFixed(2)} MB`)

  try {
    const response = await fetch(MODAL_ENDPOINTS.decompose, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `Decompose Error: ${response.status}`)
    }

    const data = await response.json()
    if (data.error) throw new Error(data.error)

    return { layers: data.layers, seed: data.seed }
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error("[Decompose] Error:", error)
    if (error.name === "AbortError") {
      throw new Error("请求超时，模型可能正在冷启动，请稍后重试")
    }
    // Better error message for network errors
    if (error.message === "Failed to fetch") {
      throw new Error("无法连接到图层分解服务，可能是网络问题或请求体过大，请稍后重试")
    }
    throw error
  }
}
