// Local adapter for the Netlify chat function.
// Run this beside Live Server so /api/chat is available on port 8888.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { handler } = require('./netlify/functions/chat.js');

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const port = Number(process.env.PORT || 8888);

const server = http.createServer(async (req, res) => {
  if (req.url !== '/api/chat' && req.url !== '/.netlify/functions/chat' && req.url !== '/chat') {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not found.' }));
    return;
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const result = await handler({
        httpMethod: req.method,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      });

      res.writeHead(result.statusCode || 200, result.headers || {});
      res.end(result.body || '');
    } catch (error) {
      console.error('Local chat server failed', error);
      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ error: 'The local AI server failed.' }));
    }
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`BioPackKos chat backend listening on http://127.0.0.1:${port}`);
});
