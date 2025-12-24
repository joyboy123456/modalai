# Modal Flux.1 Schnell 部署指南

## 前置要求

1. 注册 [Modal](https://modal.com) 账号
2. 安装 Python 3.11+
3. 安装 Modal CLI

## 部署步骤

### 1. 安装 Modal CLI

```bash
pip install modal
```

### 2. 登录 Modal

```bash
modal token new
```

这会打开浏览器让你授权。

### 3. 部署服务

```bash
modal deploy modal_backend/flux_service.py
```

部署成功后，你会看到类似这样的输出：

```
✓ Created objects.
├── 🔨 Created FluxService.generate => https://your-username--flux-image-service-fluxservice-generate.modal.run
└── 🔨 Created FluxService.health => https://your-username--flux-image-service-fluxservice-health.modal.run
```

### 4. 配置前端

1. 复制 `generate` 端点 URL
2. 在应用设置中选择 "Modal" 作为 Provider
3. 将端点 URL 粘贴到 "Modal Endpoint" 输入框
4. 保存设置

## 本地测试

```bash
modal serve modal_backend/flux_service.py
```

这会启动一个本地开发服务器，方便调试。

## 成本估算

| GPU | 价格/小时 | 单张图(~3s) |
|-----|----------|------------|
| A10G | ~$1.10 | ~$0.001 |

- 首次请求（冷启动）：约 15-30 秒
- 后续请求：约 2-4 秒
- 容器空闲 2 分钟后自动关闭

## API 说明

### POST /generate

生成图片

**请求体：**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": 12345
}
```

**响应：**
```json
{
  "image": "data:image/png;base64,...",
  "seed": 12345,
  "width": 1024,
  "height": 1024,
  "steps": 4
}
```

### GET /health

健康检查

**响应：**
```json
{
  "status": "ok",
  "model": "flux-1-schnell"
}
```

## 常见问题

### Q: 冷启动太慢怎么办？

可以调整 `container_idle_timeout` 参数，让容器保持更长时间：

```python
@app.cls(
    container_idle_timeout=300,  # 5 分钟
)
```

### Q: 如何添加鉴权？

1. 在 Modal 创建 Secret：`modal secret create modal-api-key API_KEY=your-secret-key`
2. 在代码中验证请求头中的 Authorization

### Q: 如何查看日志？

```bash
modal app logs flux-image-service
```

或在 Modal Dashboard 查看。
