import type { ModelOption } from "./types"

// 只保留 Modal Z-Image 模型
export const MODEL_OPTIONS = [{ value: "z-image-turbo", label: "Z-Image Turbo" }]

export const Z_IMAGE_MODELS = ["z-image-turbo"]

export const getModelConfig = (model: ModelOption) => {
  if (model === "z-image-turbo") return { min: 1, max: 20, default: 9 }
  return { min: 1, max: 20, default: 9 }
}
