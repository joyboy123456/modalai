export interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    aspectRatio: string;
    timestamp: number;
    model: string;
    seed?: number;
    steps?: number;
    duration?: number;
    isBlurred?: boolean;
    isUpscaled?: boolean;
}

export type AspectRatioOption = "1:1" | "3:2" | "2:3" | "3:4" | "4:3" | "9:16" | "16:9";

export type ModelOption = "z-image-turbo";
