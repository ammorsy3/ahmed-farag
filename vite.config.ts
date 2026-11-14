import path from 'node:path';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

// Local stand-in for Vercel Functions: /api/<name> runs api/<name>.ts (its GET/POST/DELETE export)
// with the env from .env*.local, so `npm run dev` tests the same code that runs on Vercel.
function localApi(): Plugin {
  return {
    name: 'local-vercel-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''));
      server.middlewares.use(async (req, res, next) => {
        const m = req.url?.match(/^\/api\/([a-z-]+)(?:\?|$)/);
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(path.resolve(__dirname, `api/${m[1]}.ts`));
          const handler = mod[req.method || 'GET'];
          if (typeof handler !== 'function') {
            res.statusCode = 405;
            return res.end();
          }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body: req.method === 'GET' ? undefined : body });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(String((e as Error).stack || e));
          res.statusCode = 500;
          res.end('local api error');
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localApi()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
