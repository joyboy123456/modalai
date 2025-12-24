"""
Modal Serverless Image Generation Service

Services:
- Z-Image-Turbo: Text-to-Image generation
- Qwen-Image-Layered: Image layer decomposition
- Real-ESRGAN: Image upscaling

Deploy: modal deploy modal_backend/flux_service.py
"""

import modal
import io
import base64

app = modal.App("z-image-service")

# Base image with common dependencies
base_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "libgl1", "libglib2.0-0")
    .pip_install(
        "torch",
        "torchvision",
        "git+https://github.com/huggingface/diffusers",
        "transformers>=4.51.3",
        "accelerate",
        "safetensors",
        "sentencepiece",
        "fastapi[standard]",
        "realesrgan",
        "opencv-python-headless",
        "basicsr",
        "gfpgan",
        "python-pptx",
    )
)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


@app.cls(
    image=base_image,
    gpu="A10G",
    timeout=600,
    scaledown_window=120,
)
class ZImageService:
    @modal.enter()
    def load_model(self):
        """Load Z-Image-Turbo model once when container starts"""
        import torch
        from diffusers import ZImagePipeline

        print("Loading Z-Image-Turbo model...")
        self.pipe = ZImagePipeline.from_pretrained(
            "Tongyi-MAI/Z-Image-Turbo",
            torch_dtype=torch.bfloat16,
        )
        self.pipe.enable_model_cpu_offload()
        
        if hasattr(self.pipe, 'enable_vae_tiling'):
            self.pipe.enable_vae_tiling()
        elif hasattr(self.pipe, 'vae') and hasattr(self.pipe.vae, 'enable_tiling'):
            self.pipe.vae.enable_tiling()
        
        if hasattr(self.pipe, 'enable_vae_slicing'):
            self.pipe.enable_vae_slicing()
        
        print("Z-Image-Turbo model loaded successfully!")

    @modal.web_endpoint()
    def generate(self, request: dict = None):
        """Generate image from text prompt"""
        import torch
        import gc
        from fastapi import Request
        from fastapi.responses import JSONResponse, Response
        from starlette.requests import Request as StarletteRequest

        # Handle OPTIONS preflight request
        if request is None or (isinstance(request, dict) and len(request) == 0):
            return Response(content="", headers=CORS_HEADERS)

        prompt = request.get("prompt", "")
        width = request.get("width", 1024)
        height = request.get("height", 1024)
        steps = request.get("steps", 9)
        seed = request.get("seed")

        if not prompt:
            return JSONResponse({"error": "Prompt is required"}, headers=CORS_HEADERS)

        width = max(512, min((width // 8) * 8, 2048))
        height = max(512, min((height // 8) * 8, 2048))

        if seed is None:
            seed = torch.randint(0, 2**31, (1,)).item()
        
        generator = torch.Generator("cuda").manual_seed(int(seed))
        print(f"Generating: {prompt[:50]}... ({width}x{height}, steps={steps})")

        torch.cuda.empty_cache()
        gc.collect()

        try:
            with torch.inference_mode():
                result = self.pipe(
                    prompt=prompt,
                    width=width,
                    height=height,
                    num_inference_steps=steps,
                    guidance_scale=0.0,
                    generator=generator,
                ).images[0]
        except torch.cuda.OutOfMemoryError:
            torch.cuda.empty_cache()
            gc.collect()
            return JSONResponse({"error": "GPU out of memory. Try smaller resolution."}, headers=CORS_HEADERS)

        buffer = io.BytesIO()
        result.save(buffer, format="JPEG", quality=92)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()

        del result
        torch.cuda.empty_cache()

        return JSONResponse({
            "image": f"data:image/jpeg;base64,{img_base64}",
            "seed": seed,
            "width": width,
            "height": height,
            "steps": steps,
        }, headers=CORS_HEADERS)

    @modal.web_endpoint()
    def upscale(self, request: dict = None):
        """Upscale image using Real-ESRGAN"""
        import torch
        import gc
        import numpy as np
        from PIL import Image
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet
        from fastapi.responses import JSONResponse, Response

        # Handle OPTIONS preflight request
        if request is None or (isinstance(request, dict) and len(request) == 0):
            return Response(content="", headers=CORS_HEADERS)

        image_data = request.get("image", "")
        scale = request.get("scale", 4)
        
        if not image_data:
            return JSONResponse({"error": "Image is required"}, headers=CORS_HEADERS)
        
        scale = 4 if scale >= 3 else 2
        
        try:
            if image_data.startswith("data:"):
                image_data = image_data.split(",")[1]
            img_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            img_np = np.array(img)
            
            original_size = img.size
            print(f"Upscaling: {original_size[0]}x{original_size[1]} -> {original_size[0]*scale}x{original_size[1]*scale}")
            
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            upsampler = RealESRGANer(
                scale=4,
                model_path="https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
                model=model,
                tile=400,
                tile_pad=10,
                pre_pad=0,
                half=True,
                device="cuda",
            )
            
            output, _ = upsampler.enhance(img_np, outscale=scale)
            result = Image.fromarray(output)
            buffer = io.BytesIO()
            result.save(buffer, format="JPEG", quality=92)
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            new_size = result.size
            del upsampler, model, output, result
            torch.cuda.empty_cache()
            gc.collect()
            
            return JSONResponse({
                "image": f"data:image/jpeg;base64,{img_base64}",
                "original_width": original_size[0],
                "original_height": original_size[1],
                "width": new_size[0],
                "height": new_size[1],
                "scale": scale,
            }, headers=CORS_HEADERS)
            
        except Exception as e:
            torch.cuda.empty_cache()
            gc.collect()
            return JSONResponse({"error": f"Upscale failed: {str(e)}"}, headers=CORS_HEADERS)

    @modal.web_endpoint(method="GET")
    def health(self):
        from fastapi.responses import JSONResponse
        return JSONResponse({"status": "ok", "model": "z-image-turbo"}, headers=CORS_HEADERS)


# ============================================
# Qwen-Image-Layered Service
# ============================================

@app.cls(
    image=base_image,
    gpu="A100-80GB",
    timeout=900,
    scaledown_window=300,
    memory=32768,
)
class LayeredService:
    @modal.enter()
    def load_model(self):
        """Load Qwen-Image-Layered model"""
        import torch
        from diffusers import QwenImageLayeredPipeline

        print("Loading Qwen-Image-Layered model on A100-80GB...")
        
        self.pipe = QwenImageLayeredPipeline.from_pretrained(
            "Qwen/Qwen-Image-Layered",
            torch_dtype=torch.bfloat16,
        )
        self.pipe = self.pipe.to("cuda", torch.bfloat16)
        
        self.pipe.set_progress_bar_config(disable=None)
        print("Qwen-Image-Layered model loaded successfully on GPU!")

    @modal.web_endpoint()
    def decompose(self, request: dict = None):
        """Decompose image into RGBA layers"""
        import torch
        import gc
        from PIL import Image
        from fastapi.responses import JSONResponse, Response

        # Handle OPTIONS preflight request
        if request is None or (isinstance(request, dict) and len(request) == 0):
            return Response(content="", headers=CORS_HEADERS)

        image_data = request.get("image", "")
        num_layers = request.get("layers", 3)
        resolution = request.get("resolution", 512)
        seed = request.get("seed")
        
        if not image_data:
            return JSONResponse({"error": "Image is required"}, headers=CORS_HEADERS)
        
        num_layers = max(2, min(num_layers, 5))
        resolution = min(resolution, 640)
        
        try:
            if image_data.startswith("data:"):
                image_data = image_data.split(",")[1]
            img_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
            
            max_input_size = 1024
            if max(img.size) > max_input_size:
                ratio = max_input_size / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            original_size = img.size
            print(f"Decomposing image: {original_size[0]}x{original_size[1]} into {num_layers} layers at {resolution}px")
            
            if seed is None:
                seed = torch.randint(0, 2**31, (1,)).item()
            
            generator = torch.Generator(device='cuda').manual_seed(int(seed))
            
            torch.cuda.empty_cache()
            gc.collect()
            
            with torch.inference_mode():
                output = self.pipe(
                    image=img,
                    generator=generator,
                    true_cfg_scale=4.0,
                    negative_prompt=" ",
                    num_inference_steps=50,
                    num_images_per_prompt=1,
                    layers=num_layers,
                    resolution=resolution,
                    cfg_normalize=True,
                    use_en_prompt=True,
                )
            
            layers_base64 = []
            for i, layer_img in enumerate(output.images[0]):
                buffer = io.BytesIO()
                layer_img.save(buffer, format="PNG")
                layer_base64 = base64.b64encode(buffer.getvalue()).decode()
                layers_base64.append({
                    "index": i,
                    "image": f"data:image/png;base64,{layer_base64}",
                    "width": layer_img.width,
                    "height": layer_img.height,
                })
            
            del output
            torch.cuda.empty_cache()
            gc.collect()
            
            print(f"Decomposition complete: {len(layers_base64)} layers")
            
            return JSONResponse({
                "layers": layers_base64,
                "num_layers": len(layers_base64),
                "seed": seed,
                "resolution": resolution,
            }, headers=CORS_HEADERS)
            
        except torch.cuda.OutOfMemoryError:
            torch.cuda.empty_cache()
            gc.collect()
            return JSONResponse({"error": "GPU out of memory. Try fewer layers or lower resolution."}, headers=CORS_HEADERS)
        except Exception as e:
            torch.cuda.empty_cache()
            gc.collect()
            import traceback
            traceback.print_exc()
            return JSONResponse({"error": f"Decomposition failed: {str(e)}"}, headers=CORS_HEADERS)
