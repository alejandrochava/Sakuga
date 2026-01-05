import { Router } from 'express';
import * as db from '../db/index.js';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = db.createUser(username, password, email);
    const session = db.createSession(user.id);

    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (e) {
    if (e.message === 'Username already exists') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Registration error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const session = db.createSession(user.id);

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      db.deleteSession(token);
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Logout error:', e);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

// Change password
router.post('/change-password', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = db.authenticateUser(req.user.username, currentPassword);
    if (!user) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    db.updateUserPassword(req.user.id, newPassword);

    // Invalidate all other sessions
    db.deleteUserSessions(req.user.id);

    // Create new session
    const session = db.createSession(req.user.id);

    res.json({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (e) {
    console.error('Change password error:', e);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
