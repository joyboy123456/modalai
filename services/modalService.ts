import { GeneratedImage, AspectRatioOption } from "../types";
import { generateUUID } from "./utils";

// Use Vercel API proxy in production, direct Modal API in development
const IS_PRODUCTION = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

const ENDPOINT_STORAGE_KEY = "modalEndpoint";
const DEFAULT_MODAL_ENDPOINT = "https://joyboyjoyboy488-53207--z-image-service-zimageservice-generate.modal.run";
const VERCEL_GENERATE_ENDPOINT = "/api/generate";

export const getModalEndpoint = (): string => {
  if (IS_PRODUCTION) return VERCEL_GENERATE_ENDPOINT;
  if (typeof localStorage === "undefined") return DEFAULT_MODAL_ENDPOINT;
  return localStorage.getItem(ENDPOINT_STORAGE_KEY) || DEFAULT_MODAL_ENDPOINT;
};

export const saveModalEndpoint = (endpoint: string) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ENDPOINT_STORAGE_KEY, endpoint.trim());
  }
};

const getBaseDimensions = (ratio: AspectRatioOption) => {
  switch (ratio) {
    case "16:9": return { width: 1024, height: 576 };
    case "4:3": return { width: 1024, height: 768 };
    case "3:2": return { width: 960, height: 640 };
    case "9:16": return { width: 576, height: 1024 };
    case "3:4": return { width: 768, height: 1024 };
    case "2:3": return { width: 640, height: 960 };
    case "1:1":
    default: return { width: 1024, height: 1024 };
  }
};

const getDimensions = (ratio: AspectRatioOption, enableHD: boolean) => {
  const base = getBaseDimensions(ratio);
  if (enableHD) {
    return {
      width: Math.round(base.width * 2),
      height: Math.round(base.height * 2),
    };
  }
  return base;
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatioOption,
  seed?: number,
  steps: number = 9,
  enableHD: boolean = false
): Promise<GeneratedImage> => {
  const endpoint = getModalEndpoint();
  const { width, height } = getDimensions(aspectRatio, enableHD);
  const finalSeed = seed ?? Math.floor(Math.random() * 2147483647);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, width, height, steps, seed: finalSeed }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("error_rate_limit");
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API Error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.image) throw new Error("error_invalid_response");

  return {
    id: generateUUID(),
    url: data.image,
    model: "z-image-turbo",
    prompt,
    aspectRatio,
    timestamp: Date.now(),
    seed: data.seed || finalSeed,
    steps: data.steps || steps,
  };
};

export const upscaleImage = async (
  imageData: string,
  scale: number = 4
): Promise<{ image: string; width: number; height: number }> => {
  const endpoint = IS_PRODUCTION 
    ? "/api/upscale" 
    : getModalEndpoint().replace(/generate$/, "upscale");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData, scale }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Upscale Error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return { image: data.image, width: data.width, height: data.height };
};

// Layered Service Endpoint - use Vercel API proxy in production
const MODAL_LAYERED_ENDPOINT = "https://joyboyjoyboy488-53207--z-image-service-layeredservice-decompose.modal.run";
const getLayeredEndpoint = () => IS_PRODUCTION ? "/api/decompose" : MODAL_LAYERED_ENDPOINT;

export interface LayerResult {
  index: number;
  image: string;
  width: number;
  height: number;
}

export const decomposeImage = async (
  imageData: string,
  numLayers: number = 4,
  resolution: number = 640,
  seed?: number
): Promise<{ layers: LayerResult[]; seed: number }> => {
  // Use AbortController for timeout (5 minutes for cold start)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  // Log request size for debugging
  const requestBody = JSON.stringify({
    image: imageData,
    layers: numLayers,
    resolution,
    seed,
  });
  console.log(`[Decompose] Request size: ${(requestBody.length / 1024 / 1024).toFixed(2)} MB`);

  try {
    const response = await fetch(getLayeredEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Decompose Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    return { layers: data.layers, seed: data.seed };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('[Decompose] Error:', error);
    if (error.name === 'AbortError') {
      throw new Error('请求超时，模型可能正在冷启动，请稍后重试');
    }
    // Better error message for network errors
    if (error.message === 'Failed to fetch') {
      throw new Error('无法连接到图层分解服务，可能是网络问题或请求体过大，请稍后重试');
    }
    throw error;
  }
};
