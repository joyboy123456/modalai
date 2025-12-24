const http = require('http');
const https = require('https');

const PORT = 3002;

const ENDPOINTS = {
  '/decompose': 'https://joyboyjoyboy488-53207--z-image-service-layeredservice-decompose.modal.run',
  '/generate': 'https://joyboyjoyboy488-53207--z-image-service-zimageservice-generate.modal.run',
  '/health': 'https://joyboyjoyboy488-53207--z-image-service-layeredservice-health.modal.run'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const targetUrl = ENDPOINTS[req.url];
  if (!targetUrl) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  console.log(`[Proxy] ${req.method} ${req.url} -> ${targetUrl}`);

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const url = new URL(targetUrl);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/',
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 300000 // 5 minutes
    };

    const proxyReq = https.request(options, proxyRes => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode}`);
      
      // Copy headers
      const headers = { ...proxyRes.headers };
      headers['Access-Control-Allow-Origin'] = '*';
      
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      console.error('[Proxy] Error:', err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    });

    proxyReq.on('timeout', () => {
      console.error('[Proxy] Timeout');
      proxyReq.destroy();
      res.writeHead(504);
      res.end(JSON.stringify({ error: 'Gateway Timeout' }));
    });

    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log('Endpoints:', Object.keys(ENDPOINTS).join(', '));
});
