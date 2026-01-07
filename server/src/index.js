import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import expressStaticGzip from 'express-static-gzip';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import apiRoutes from './routes/api.js';
import { errorHandler } from './utils/errors.js';
import logger from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - restrict to known origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests in development)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Rate limiting - general API limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for generation endpoints
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 generation requests per minute
  message: { error: 'Too many generation requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '5mb' })); // Reduced from 50mb
app.use(express.urlencoded({ extended: true, limit: '5mb' })); // Reduced from 50mb

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Apply stricter rate limiting to generation endpoints
app.use('/api/generate', generateLimiter);
app.use('/api/edit', generateLimiter);
app.use('/api/inpaint', generateLimiter);
app.use('/api/upscale', generateLimiter);

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
  logger.info({ path: clientDistPath }, 'Serving client from static directory');

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
  logger.info({ port: PORT }, 'Sakuga server running');
});
