// Simple CORS Proxy Server for Mercado Libre API
// Run with: node proxy-server.js
// Then update script.js to use: const PROXY = 'http://localhost:3000/proxy?url=';

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse the target URL from query parameter
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  let targetUrl = parsedUrl.query.url;

  // Handle favicon and other non-proxy requests gracefully
  if (pathname === '/favicon.ico') {
    res.writeHead(204, { 'Content-Length': 0 });
    res.end();
    return;
  }

  // Handle root path with helpful message
  if (pathname === '/' && !targetUrl) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>CORS Proxy Server</title></head>
        <body style="font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff;">
          <h1>🚀 CORS Proxy Server</h1>
          <p>Server is running! Use it with:</p>
          <code style="background: #333; padding: 10px; display: block; margin: 10px 0;">
            /proxy?url=ENCODED_URL
          </code>
          <p style="color: #888; margin-top: 20px;">This proxy is for the Gaming Price MX application.</p>
        </body>
      </html>
    `);
    return;
  }

  // Only process /proxy requests with url parameter
  if (pathname !== '/proxy' || !targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Invalid request. Use: /proxy?url=ENCODED_URL',
      path: pathname
    }));
    return;
  }

  // Forward all headers except host and connection
  // Normalize headers (HTTP headers are case-insensitive, but Node.js can be sensitive)
  const headers = {};
  for (const key in req.headers) {
    if (key !== 'host' && key !== 'connection' && key !== 'content-length') {
      // Preserve original case for important headers like Authorization
      headers[key] = req.headers[key];
    }
  }
  
  // Ensure Authorization header is preserved (case-sensitive for some APIs)
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }
  if (req.headers.Authorization) {
    headers['Authorization'] = req.headers.Authorization;
  }

  // Determine if target is HTTPS
  const isHttps = targetUrl.startsWith('https://');
  const requestModule = isHttps ? https : http;

  // Parse target URL
  const targetParsed = url.parse(targetUrl);

  const options = {
    hostname: targetParsed.hostname,
    port: targetParsed.port || (isHttps ? 443 : 80),
    path: targetParsed.path,
    method: req.method,
    headers: headers
  };

  // Log for debugging
  const hasAuth = (headers.Authorization || headers.authorization) ? 'YES' : 'NO';
  const authPreview = headers.Authorization || headers.authorization || 'NONE';
  console.log(`[${new Date().toISOString()}] ${req.method} ${targetParsed.hostname}${targetParsed.path}`);
  console.log(`  [Auth: ${hasAuth}] ${authPreview.substring(0, 30)}...`);
  console.log(`  [Headers being sent:]`, Object.keys(headers).join(', '));

  // Make the proxy request
  const proxyReq = requestModule.request(options, (proxyRes) => {
    // Log response status
    console.log(`[${new Date().toISOString()}] Response: ${proxyRes.statusCode} from ${targetParsed.hostname}`);
    
    // Set CORS headers on response
    const responseHeaders = { ...proxyRes.headers };
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept';
    
    // Forward status code and headers
    res.writeHead(proxyRes.statusCode, responseHeaders);

    // Pipe the response
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Proxy error:`, err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });

  // Forward request body for POST requests
  if (req.method === 'POST' || req.method === 'PUT') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📝 Update script.js: const PROXY = 'http://localhost:${PORT}/proxy?url=';`);
});
