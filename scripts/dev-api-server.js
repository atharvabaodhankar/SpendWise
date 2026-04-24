// Local dev API server — development only, not used in production
import 'dotenv/config';
import http from 'http';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  // Only handle /api/* routes
  if (!url.pathname.startsWith('/api/')) {
    res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Read body
  let body = '';
  for await (const chunk of req) body += chunk;
  try { req.body = JSON.parse(body); } catch { req.body = {}; }

  // Expose query params
  req.query = Object.fromEntries(url.searchParams.entries());

  // Wrap res with Express-like helpers
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };
  res.send = (data) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', typeof data === 'string' ? 'text/html' : 'application/json');
    res.end(typeof data === 'string' ? data : JSON.stringify(data));
  };
  res.setHeader('Content-Type', 'application/json');

  try {
    // Dynamically load the matching handler, e.g. /api/ai-chat -> api/ai-chat.js
    const handlerPath = `..${url.pathname}.js`;
    const { default: handler } = await import(handlerPath);
    await handler(req, res);
  } catch (err) {
    console.error('Handler error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => console.log(`Dev API server on http://localhost:${PORT}`));
