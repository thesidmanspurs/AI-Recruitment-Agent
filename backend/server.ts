import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/authenticate.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { apiCors } from './middleware/cors.js';
import authRoutes from './routes/authRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import usageRoutes from './routes/usageRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import { trackingService } from './services/tracking/trackingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '../frontend');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// ── CORS — only on /api; the SPA itself is same-origin via Vite middleware ──
app.use('/api', apiCors);
app.options('/api/*', apiCors);

// ── Public routes ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);

// Webhooks are public (no JWT). Each route validates its own shared-secret
// token. Must be mounted BEFORE the authenticate middleware.
app.use('/api/webhooks', webhookRoutes);

// ── Protected routes (JWT required) ──────────────────────────────────────────
app.use('/api/campaigns', authenticate, campaignRoutes);
app.use('/api/upload', authenticate, uploadRoutes);
app.use('/api/locations', authenticate, locationRoutes);
app.use('/api/usage', authenticate, usageRoutes);
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

async function startServer(): Promise<void> {
  if (env.NODE_ENV !== 'production') {
    // Dynamic import so the production bundle (which is built with
    // --packages=external) doesn't crash trying to resolve `vite` when it
    // isn't installed in the prod image (Vite is a devDependency).
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.join(frontendRoot, 'vite.config.ts'),
      root: frontendRoot,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Vite] Dev middleware mounted');
  } else {
    const distPath = path.join(frontendRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    console.log('[Static] Serving production build from /dist');
  }

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[Server] Running at http://localhost:${env.PORT}`);
    trackingService.startAlertScheduler();
  });
}

startServer();
