import express from 'express';
import cors from 'cors';
import compression from 'compression';
import expressStaticGzip from 'express-static-gzip';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler } from './utils/errors.js';
import { cleanExpiredSessions } from './db/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Authentication middleware (adds req.user if authenticated)
app.use(authenticate);

// Auth routes
app.use('/api/auth', authRoutes);

// API routes
app.use('/api', apiRoutes);

// Clean expired sessions periodically (every hour)
setInterval(() => {
  try {
    cleanExpiredSessions();
  } catch (e) {
    console.error('Session cleanup error:', e);
  }
}, 60 * 60 * 1000);

// Serve images from storage with caching headers
app.use('/api/images', express.static(join(__dirname, '../storage/images'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  immutable: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve client build in production
const clientDistPath = join(__dirname, '../../client/dist');
if (existsSync(clientDistPath)) {
  console.log('Serving client from:', clientDistPath);

  // Serve pre-compressed static files (gzip, brotli)
  app.use(expressStaticGzip(clientDistPath, {
    enableBrotli: true,
    orderPreference: ['br', 'gz'],
    serveStatic: {
      maxAge: '1y',
      etag: true,
      immutable: true
    }
  }));

  // SPA fallback - serve index.html for client-side routing
  // Exclude API routes and health check
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(join(clientDistPath, 'index.html'));
  });
}

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Sakuga server running on http://localhost:${PORT}`);
});
