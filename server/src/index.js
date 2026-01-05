import express from 'express';
import cors from 'cors';
import compression from 'compression';
import expressStaticGzip from 'express-static-gzip';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import apiRoutes from './routes/api.js';
import { errorHandler } from './utils/errors.js';

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

// API routes
app.use('/api', apiRoutes);

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
