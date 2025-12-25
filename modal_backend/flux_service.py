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
import uuid
from datetime import datetime

app = modal.App("z-image-service")

# Create a Volume for storing images
image_volume = modal.Volume.from_name("peinture-images", create_if_missing=True)
VOLUME_PATH = "/images"

# Base image with common dependencies
base_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "libgl1", "libglib2.0-0")
    .pip_install(
        "numpy<2",
        "torch==2.5.1",
        "torchvision==0.20.1",
        "git+https://github.com/huggingface/diffusers",
        "transformers>=4.51.3",
        "accelerate",
        "safetensors",
        "sentencepiece",
        "fastapi[standard]",
        "opencv-python-headless",
        "python-pptx",
        "pillow",
        "spandrel",
    )
)


@app.cls(
    image=base_image,
    gpu="A10G",
    timeout=600,
    scaledown_window=120,
    volumes={VOLUME_PATH: image_volume},
)
class ZImageService:
    def __init__(self):
        self.pipe = None

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

    @modal.asgi_app()
    def serve(self):
        from fastapi import FastAPI, Request
        from fastapi.middleware.cors import CORSMiddleware
        from fastapi.responses import JSONResponse
        import torch
        import gc

        fastapi_app = FastAPI()
        
        # Add CORS middleware - this handles OPTIONS automatically
        fastapi_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @fastapi_app.get("/health")
        def health():
            return {"status": "ok", "model": "z-image-turbo"}

        @fastapi_app.get("/images/{image_id}")
        def get_image(image_id: str):
            """Serve image from volume"""
            from fastapi.responses import FileResponse
            import os
            
            image_path = f"{VOLUME_PATH}/{image_id}.png"
            if not os.path.exists(image_path):
                return JSONResponse({"error": "Image not found"}, status_code=404)
            
            return FileResponse(image_path, media_type="image/png")

        @fastapi_app.post("/generate")
        def generate(request: dict):
            import os
            
            prompt = request.get("prompt", "")
            width = request.get("width", 1024)
            height = request.get("height", 1024)
            steps = request.get("steps", 9)
            seed = request.get("seed")
            save_to_volume = request.get("save", True)  # Save to volume by default

            if not prompt:
                return JSONResponse({"error": "Prompt is required"}, status_code=400)

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
                return JSONResponse({"error": "GPU out of memory. Try smaller resolution."}, status_code=500)

            # Generate unique image ID
            image_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
            
            # Save to volume if requested
            image_url = None
            if save_to_volume:
                try:
                    os.makedirs(VOLUME_PATH, exist_ok=True)
                    image_path = f"{VOLUME_PATH}/{image_id}.png"
                    result.save(image_path, format="PNG")
                    image_volume.commit()
                    # Return URL to the image endpoint
                    image_url = f"https://joyboyjoyboy488-53207--z-image-service-zimageservice-serve.modal.run/images/{image_id}"
                    print(f"Image saved: {image_id}")
                except Exception as e:
                    print(f"Failed to save image: {e}")
            
            # Also return base64 for backward compatibility
            buffer = io.BytesIO()
            result.save(buffer, format="PNG")
            img_base64 = base64.b64encode(buffer.getvalue()).decode()

            del result
            torch.cuda.empty_cache()

            response = {
                "image": f"data:image/png;base64,{img_base64}",
                "seed": seed,
                "width": width,
                "height": height,
                "steps": steps,
            }
            
            if image_url:
                response["url"] = image_url
                response["image_id"] = image_id

            return response

        @fastapi_app.post("/upscale")
        def upscale(request: dict):
            import numpy as np
            from PIL import Image
            import spandrel
            import urllib.request
            import os

            image_data = request.get("image", "")
            scale = request.get("scale", 4)
            
            if not image_data:
                return JSONResponse({"error": "Image is required"}, status_code=400)
            
            scale = 4  # Real-ESRGAN x4plus is 4x only
            
            try:
                if image_data.startswith("data:"):
                    image_data = image_data.split(",")[1]
                img_bytes = base64.b64decode(image_data)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                
                original_size = img.size
                print(f"Upscaling: {original_size[0]}x{original_size[1]} -> {original_size[0]*scale}x{original_size[1]*scale}")
                
                # Download model if not exists
                model_path = "/tmp/RealESRGAN_x4plus.pth"
                if not os.path.exists(model_path):
                    print("Downloading Real-ESRGAN model...")
                    urllib.request.urlretrieve(
                        "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
                        model_path
                    )
                    print("Model downloaded!")
                
                # Load model with spandrel (universal model loader)
                model = spandrel.ModelLoader().load_from_file(model_path).eval().cuda()
                
                # Convert image to tensor
                img_np = np.array(img).astype(np.float32) / 255.0
                img_tensor = torch.from_numpy(img_np).permute(2, 0, 1).unsqueeze(0).cuda()
                
                # Process image
                with torch.inference_mode():
                    output = model(img_tensor)
                
                # Convert back to image
                output_np = output.squeeze(0).permute(1, 2, 0).cpu().numpy()
                output_np = (output_np * 255).clip(0, 255).astype(np.uint8)
                result = Image.fromarray(output_np)
                
                buffer = io.BytesIO()
                result.save(buffer, format="PNG")
                img_base64 = base64.b64encode(buffer.getvalue()).decode()
                
                new_size = result.size
                del model, output, result, img_tensor
                torch.cuda.empty_cache()
                gc.collect()
                
                return {
                    "image": f"data:image/png;base64,{img_base64}",
                    "original_width": original_size[0],
                    "original_height": original_size[1],
                    "width": new_size[0],
                    "height": new_size[1],
                    "scale": scale,
                }
                
            except Exception as e:
                import traceback
                traceback.print_exc()
                torch.cuda.empty_cache()
                gc.collect()
                return JSONResponse({"error": f"Upscale failed: {str(e)}"}, status_code=500)

        return fastapi_app


# ============================================
# Qwen-Image-Layered Service
# ============================================

# Separate image for LayeredService with python-pptx dependency
layered_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "libgl1", "libglib2.0-0")
    .pip_install(
        "numpy<2",
        "torch==2.5.1",
        "torchvision==0.20.1",
        "git+https://github.com/huggingface/diffusers",
        "transformers>=4.51.3",
        "accelerate",
        "safetensors",
        "sentencepiece",
        "fastapi[standard]",
        "pillow",
        "python-pptx",  # Required by QwenImageLayeredPipeline
    )
)

@app.cls(
    image=layered_image,
    gpu="A100-80GB",
    timeout=900,
    scaledown_window=300,
    memory=32768,
)
class LayeredService:
    def __init__(self):
        self.pipe = None

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

    @modal.asgi_app()
    def serve(self):
        from fastapi import FastAPI
        from fastapi.middleware.cors import CORSMiddleware
        from fastapi.responses import JSONResponse
        from PIL import Image
        import torch
        import gc

        fastapi_app = FastAPI()
        
        fastapi_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @fastapi_app.get("/health")
        def health():
            return {"status": "ok", "model": "qwen-image-layered"}

        @fastapi_app.post("/decompose")
        def decompose(request: dict):
            image_data = request.get("image", "")
            num_layers = request.get("layers", 4)
            resolution = request.get("resolution", 640)
            seed = request.get("seed")
            
            if not image_data:
                return JSONResponse({"error": "Image is required"}, status_code=400)
            
            # Clamp layers between 2-8 (model supports variable layers)
            num_layers = max(2, min(num_layers, 8))
            # Resolution bucket: 640 recommended, 1024 also supported
            resolution = 640 if resolution <= 640 else 1024
            
            try:
                if image_data.startswith("data:"):
                    image_data = image_data.split(",")[1]
                img_bytes = base64.b64decode(image_data)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
                
                # Resize if too large
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
                
                # output.images[0] is a list of layer images
                layers_base64 = []
                layer_images = output.images[0]
                for i, layer_img in enumerate(layer_images):
                    buffer = io.BytesIO()
                    layer_img.save(buffer, format="PNG")
                    layer_base64 = base64.b64encode(buffer.getvalue()).decode()
                    layers_base64.append({
                        "index": i,
                        "image": f"data:image/png;base64,{layer_base64}",
                        "width": layer_img.width,
                        "height": layer_img.height,
                    })
                
                del output, layer_images
                torch.cuda.empty_cache()
                gc.collect()
                
                print(f"Decomposition complete: {len(layers_base64)} layers")
                
                return {
                    "layers": layers_base64,
                    "num_layers": len(layers_base64),
                    "seed": seed,
                    "resolution": resolution,
                }
                
            except torch.cuda.OutOfMemoryError:
                torch.cuda.empty_cache()
                gc.collect()
                return JSONResponse({"error": "GPU out of memory. Try fewer layers or lower resolution."}, status_code=500)
            except Exception as e:
                torch.cuda.empty_cache()
                gc.collect()
                import traceback
                traceback.print_exc()
                return JSONResponse({"error": f"Decomposition failed: {str(e)}"}, status_code=500)

        return fastapi_app
