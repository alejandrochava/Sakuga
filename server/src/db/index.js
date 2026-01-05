import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_PATH = join(__dirname, '../../storage');
const DB_PATH = join(STORAGE_PATH, 'sakuga.db');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table (for future auth)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Collections table
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- History table
  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    collection_id TEXT,
    prompt TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    aspect_ratio TEXT,
    image_url TEXT NOT NULL,
    cost REAL DEFAULT 0,
    variant_group TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL
  );

  -- Queue table
  CREATE TABLE IF NOT EXISTS queue (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    prompt TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    aspect_ratio TEXT,
    count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Favorites table
  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    history_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (history_id) REFERENCES history(id) ON DELETE CASCADE,
    UNIQUE(user_id, history_id)
  );

  -- Create indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_history_created ON history(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_history_type ON history(type);
  CREATE INDEX IF NOT EXISTS idx_history_provider ON history(provider);
  CREATE INDEX IF NOT EXISTS idx_history_collection ON history(collection_id);
  CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
  CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
  CREATE INDEX IF NOT EXISTS idx_queue_user ON queue(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
`);

// ============ HISTORY OPERATIONS ============

export function getHistory({ userId = null, page = 1, limit = 0, type = null, provider = null, search = null, collectionId = null } = {}) {
  let sql = 'SELECT * FROM history WHERE 1=1';
  const params = [];

  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (provider) {
    sql += ' AND provider = ?';
    params.push(provider);
  }

  if (search) {
    sql += ' AND prompt LIKE ?';
    params.push(`%${search}%`);
  }

  if (collectionId) {
    sql += ' AND collection_id = ?';
    params.push(collectionId);
  }

  sql += ' ORDER BY created_at DESC';

  // Get total count
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params);

  // Apply pagination
  if (limit > 0) {
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  const items = db.prepare(sql).all(...params).map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  }));

  if (limit > 0) {
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  }

  return items;
}

export function getHistoryById(id) {
  const row = db.prepare('SELECT * FROM history WHERE id = ?').get(id);
  if (row && row.metadata) {
    row.metadata = JSON.parse(row.metadata);
  }
  return row;
}

export function addHistory(item) {
  const stmt = db.prepare(`
    INSERT INTO history (id, user_id, collection_id, prompt, type, provider, model, aspect_ratio, image_url, cost, variant_group, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    item.id,
    item.userId || null,
    item.collectionId || null,
    item.prompt,
    item.type,
    item.provider || null,
    item.model || null,
    item.aspectRatio || null,
    item.imageUrl,
    item.cost || 0,
    item.variantGroup || null,
    item.metadata ? JSON.stringify(item.metadata) : null,
    item.createdAt || new Date().toISOString()
  );

  return item;
}

export function deleteHistory(id) {
  const result = db.prepare('DELETE FROM history WHERE id = ?').run(id);
  return result.changes > 0;
}

export function clearHistory(userId = null) {
  if (userId) {
    return db.prepare('DELETE FROM history WHERE user_id = ?').run(userId);
  }
  return db.prepare('DELETE FROM history').run();
}

export function updateHistoryCollection(historyId, collectionId) {
  return db.prepare('UPDATE history SET collection_id = ? WHERE id = ?').run(collectionId, historyId);
}

// ============ QUEUE OPERATIONS ============

export function getQueue(userId = null) {
  let sql = 'SELECT * FROM queue';
  const params = [];

  if (userId) {
    sql += ' WHERE user_id = ?';
    params.push(userId);
  }

  sql += ' ORDER BY created_at ASC';

  return db.prepare(sql).all(...params);
}

export function getQueueById(id) {
  return db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
}

export function addQueue(item) {
  const stmt = db.prepare(`
    INSERT INTO queue (id, user_id, prompt, provider, model, aspect_ratio, count, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    item.id,
    item.userId || null,
    item.prompt,
    item.provider || null,
    item.model || null,
    item.aspectRatio || null,
    item.count || 1,
    item.status || 'pending',
    item.createdAt || new Date().toISOString()
  );

  return item;
}

export function updateQueue(id, updates) {
  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    const column = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case
    fields.push(`${column} = ?`);
    params.push(value);
  }

  fields.push('updated_at = datetime("now")');
  params.push(id);

  const sql = `UPDATE queue SET ${fields.join(', ')} WHERE id = ?`;
  return db.prepare(sql).run(...params);
}

export function deleteQueue(id) {
  return db.prepare('DELETE FROM queue WHERE id = ?').run(id);
}

export function clearQueue(userId = null) {
  if (userId) {
    return db.prepare('DELETE FROM queue WHERE user_id = ?').run(userId);
  }
  return db.prepare('DELETE FROM queue').run();
}

// ============ COLLECTIONS OPERATIONS ============

export function getCollections(userId = null) {
  let sql = `
    SELECT c.*, COUNT(h.id) as item_count
    FROM collections c
    LEFT JOIN history h ON h.collection_id = c.id
  `;

  const params = [];
  if (userId) {
    sql += ' WHERE c.user_id = ?';
    params.push(userId);
  }

  sql += ' GROUP BY c.id ORDER BY c.created_at DESC';

  return db.prepare(sql).all(...params);
}

export function getCollectionById(id) {
  return db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
}

export function addCollection(collection) {
  const stmt = db.prepare(`
    INSERT INTO collections (id, user_id, name, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    collection.id,
    collection.userId || null,
    collection.name,
    collection.description || null,
    collection.createdAt || new Date().toISOString()
  );

  return collection;
}

export function updateCollection(id, updates) {
  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    params.push(value);
  }

  fields.push('updated_at = datetime("now")');
  params.push(id);

  const sql = `UPDATE collections SET ${fields.join(', ')} WHERE id = ?`;
  return db.prepare(sql).run(...params);
}

export function deleteCollection(id) {
  return db.prepare('DELETE FROM collections WHERE id = ?').run(id);
}

// ============ FAVORITES OPERATIONS ============

export function getFavorites(userId = null) {
  let sql = `
    SELECT h.* FROM favorites f
    JOIN history h ON h.id = f.history_id
  `;

  const params = [];
  if (userId) {
    sql += ' WHERE f.user_id = ?';
    params.push(userId);
  }

  sql += ' ORDER BY f.created_at DESC';

  return db.prepare(sql).all(...params);
}

export function addFavorite(id, historyId, userId = null) {
  try {
    db.prepare(`
      INSERT INTO favorites (id, user_id, history_id, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(id, userId, historyId);
    return true;
  } catch (e) {
    return false; // Already favorited
  }
}

export function removeFavorite(historyId, userId = null) {
  let sql = 'DELETE FROM favorites WHERE history_id = ?';
  const params = [historyId];

  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }

  return db.prepare(sql).run(...params);
}

export function isFavorite(historyId, userId = null) {
  let sql = 'SELECT 1 FROM favorites WHERE history_id = ?';
  const params = [historyId];

  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }

  return !!db.prepare(sql).get(...params);
}

// ============ STATS OPERATIONS ============

export function getStats(userId = null) {
  const params = userId ? [userId] : [];
  const userFilter = userId ? 'WHERE user_id = ?' : '';

  const totalGenerations = db.prepare(`SELECT COUNT(*) as count FROM history ${userFilter}`).get(...params).count;
  const totalCost = db.prepare(`SELECT COALESCE(SUM(cost), 0) as total FROM history ${userFilter}`).get(...params).total;

  const byProvider = db.prepare(`
    SELECT provider, COUNT(*) as count, COALESCE(SUM(cost), 0) as cost
    FROM history ${userFilter}
    GROUP BY provider
    ORDER BY count DESC
  `).all(...params);

  const byType = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM history ${userFilter}
    GROUP BY type
    ORDER BY count DESC
  `).all(...params);

  const recentCosts = db.prepare(`
    SELECT DATE(created_at) as date, COALESCE(SUM(cost), 0) as cost, COUNT(*) as count
    FROM history ${userFilter}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all(...params);

  return {
    totalGenerations,
    totalCost,
    byProvider,
    byType,
    recentCosts
  };
}

// ============ EXPORT/IMPORT OPERATIONS ============

export function exportData(userId = null) {
  return {
    history: getHistory({ userId }),
    collections: getCollections(userId),
    favorites: getFavorites(userId),
    exportedAt: new Date().toISOString()
  };
}

export function importData(data, userId = null) {
  const transaction = db.transaction(() => {
    let imported = { history: 0, collections: 0, favorites: 0 };

    // Import collections first
    if (data.collections) {
      for (const collection of data.collections) {
        try {
          addCollection({ ...collection, userId });
          imported.collections++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }

    // Import history
    if (data.history) {
      const items = Array.isArray(data.history) ? data.history : data.history.items || [];
      for (const item of items) {
        try {
          addHistory({ ...item, userId });
          imported.history++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }

    return imported;
  });

  return transaction();
}

// ============ MIGRATION ============

export async function migrateFromJSON() {
  const HISTORY_PATH = join(STORAGE_PATH, 'history.json');
  const QUEUE_PATH = join(STORAGE_PATH, 'queue.json');

  let migrated = { history: 0, queue: 0 };

  // Migrate history
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
      for (const item of data) {
        try {
          addHistory({
            id: item.id,
            prompt: item.prompt,
            type: item.type,
            provider: item.provider,
            model: item.model,
            aspectRatio: item.aspectRatio,
            imageUrl: item.imageUrl,
            cost: item.cost,
            variantGroup: item.variantGroup,
            createdAt: item.createdAt
          });
          migrated.history++;
        } catch (e) {
          // Skip duplicates
        }
      }
      // Rename old file
      fs.renameSync(HISTORY_PATH, HISTORY_PATH + '.bak');
    }
  } catch (e) {
    console.error('History migration error:', e);
  }

  // Migrate queue
  try {
    if (fs.existsSync(QUEUE_PATH)) {
      const data = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
      for (const item of data) {
        try {
          addQueue({
            id: item.id,
            prompt: item.prompt,
            provider: item.provider,
            model: item.model,
            aspectRatio: item.aspectRatio,
            count: item.count,
            status: item.status,
            createdAt: item.createdAt
          });
          migrated.queue++;
        } catch (e) {
          // Skip duplicates
        }
      }
      // Rename old file
      fs.renameSync(QUEUE_PATH, QUEUE_PATH + '.bak');
    }
  } catch (e) {
    console.error('Queue migration error:', e);
  }

  return migrated;
}

// ============ USER OPERATIONS ============

export function createUser(username, password, email = null) {
  const id = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, email, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(id, username, passwordHash, email);

    return { id, username, email };
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username already exists');
    }
    throw e;
  }
}

export function getUserById(id) {
  const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(id);
  return user || null;
}

export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function authenticateUser(username, password) {
  const user = getUserByUsername(username);
  if (!user) {
    return null;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return null;
  }

  return { id: user.id, username: user.username, email: user.email };
}

export function updateUserPassword(id, newPassword) {
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  return db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').run(passwordHash, id);
}

export function deleteUser(id) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function getAllUsers() {
  return db.prepare('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC').all();
}

// ============ SESSIONS TABLE ============

// Add sessions table for token-based auth
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

export function createSession(userId) {
  const id = crypto.randomUUID();
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(id, userId, token, expiresAt);

  return { token, expiresAt };
}

export function getSessionByToken(token) {
  const session = db.prepare(`
    SELECT s.*, u.username, u.email
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token);

  return session || null;
}

export function deleteSession(token) {
  return db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function deleteUserSessions(userId) {
  return db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function cleanExpiredSessions() {
  return db.prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")').run();
}

// Export db for direct queries if needed
export { db };
