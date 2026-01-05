import * as db from '../db/index.js';

// Middleware to extract user from session token
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7);
  const session = db.getSessionByToken(token);

  if (!session) {
    req.user = null;
    return next();
  }

  req.user = {
    id: session.user_id,
    username: session.username,
    email: session.email
  };

  next();
}

// Middleware to require authentication
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Optional: Middleware to require admin (for future use)
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // For now, first user is admin
  // In production, add an is_admin column to users table
  next();
}
