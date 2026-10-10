/** Local-only preview. Deliberately no directory listing or arbitrary file serving. */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, build, buildHtml } from './build.mjs';
const dev = process.argv.includes('--dev');
const port = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error('PORT must be an integer from 0 to 65535.');
if (!dev)
    await build();
const server = http.createServer(async (request, response) => {
    try {
        if (!['GET', 'HEAD'].includes(request.method)) {
            response.writeHead(405, { Allow: 'GET, HEAD' });
            response.end();
            return;
        }
        const path = new URL(request.url, 'http://127.0.0.1').pathname;
        if (path === '/favicon.ico') {
            response.writeHead(204);
            response.end();
            return;
        }
        if (!['/', '/index.html'].includes(path)) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }
        const html = dev ? await buildHtml() : await readFile(join(ROOT, 'dist/index.html'));
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        response.end(request.method === 'HEAD' ? undefined : html);
    }
    catch (error) {
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.end(error.message);
    }
});
server.listen(port, '127.0.0.1', () => console.log(`Slide rule: http://127.0.0.1:${server.address().port} ${dev ? '(reload after editing source)' : ''}`));
for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => server.close());
