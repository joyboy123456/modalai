
import { ModelOption } from './types';

export const MODEL_OPTIONS = [
  { value: 'z-image-turbo', label: 'Z-Image Turbo' },
];

export const getModelConfig = (model: ModelOption) => {
  if (model === 'z-image-turbo') return { min: 1, max: 20, default: 9 };
  return { min: 1, max: 20, default: 9 };
};
