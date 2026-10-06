import fs from 'node:fs';
import path from 'node:path';
import { executeQuery, executeBatch } from './tursoClient.js';

let initialized = false;

export async function initDatabase() {
  if (initialized) return;

  // 1. Jadvallarni yaratish
  await executeBatch([
    {
      sql: `CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        name TEXT,
        password TEXT,
        created_at TEXT
      );`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS bloggers (
        id TEXT PRIMARY KEY,
        nickname TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        collaboration_type TEXT NOT NULL,
        brand TEXT NOT NULL,
        status TEXT NOT NULL,
        category TEXT,
        manager TEXT,
        time TEXT,
        audience TEXT,
        notes TEXT,
        is_blacklisted INTEGER NOT NULL DEFAULT 0,
        blacklist_reason TEXT,
        price REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        completed_at TEXT
      );`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS blogger_history (
        id TEXT PRIMARY KEY,
        blogger_id TEXT NOT NULL,
        date TEXT NOT NULL,
        collaboration_type TEXT NOT NULL,
        brand TEXT NOT NULL,
        status TEXT NOT NULL,
        category TEXT,
        manager TEXT,
        time TEXT,
        notes TEXT,
        price REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'pending',
        blacklist_reason TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (blogger_id) REFERENCES bloggers(id) ON DELETE CASCADE
      );`,
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_bloggers_nickname ON bloggers(nickname);` },
    { sql: `CREATE INDEX IF NOT EXISTS idx_history_blogger_id ON blogger_history(blogger_id);` },
  ]);

  // Ustunlar mavjud bo'lmasa xavfsiz qo'shish
  for (const sql of [
    'ALTER TABLE bloggers ADD COLUMN price REAL DEFAULT 0',
    'ALTER TABLE bloggers ADD COLUMN payment_status TEXT DEFAULT "pending"',
    'ALTER TABLE bloggers ADD COLUMN blacklist_reason TEXT',
    'ALTER TABLE blogger_history ADD COLUMN price REAL DEFAULT 0',
    'ALTER TABLE blogger_history ADD COLUMN payment_status TEXT DEFAULT "pending"',
    'ALTER TABLE blogger_history ADD COLUMN blacklist_reason TEXT',
    'ALTER TABLE users ADD COLUMN name TEXT',
    'ALTER TABLE users ADD COLUMN password TEXT',
    'ALTER TABLE users ADD COLUMN created_at TEXT'
  ]) {
    try { await executeQuery(sql); } catch {}
  }

  // 2. Boshlang'ich foydalanuvchilar
  try {
    const existingUsers = await executeQuery('SELECT count(*) as count FROM users');
    const userCount = Number(existingUsers[0]?.count || 0);

    if (userCount === 0) {
      const usersFile = path.join(process.cwd(), 'data', 'users.json');
      if (fs.existsSync(usersFile)) {
        const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        if (Array.isArray(usersData)) {
          const userStatements = usersData.map((u) => ({
            sql: `INSERT OR IGNORE INTO users (username, role, password_hash, active, name, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            params: [
              u.username,
              u.role,
              u.password_hash || '',
              u.active !== false ? 1 : 0,
              u.username === 'jamshid' ? 'Jamshid' : u.username === 'nuriddin' ? 'Nuriddin' : u.username,
              u.username === 'jamshid' ? 'jamshid123' : '12345',
              new Date().toISOString()
            ],
          }));
          await executeBatch(userStatements);
        }
      }
    }
  } catch (err) {
    console.error('[Turso] Users init warning:', err);
  }

  initialized = true;
}

export function normalizeNickname(value) {
  return `@${String(value || '').trim().replace(/^@+/, '')}`;
}

export async function getAllBloggers() {
  await initDatabase();

  const [bloggerRows, historyRows] = await Promise.all([
    executeQuery('SELECT * FROM bloggers ORDER BY date DESC, created_at DESC'),
    executeQuery('SELECT * FROM blogger_history ORDER BY date DESC, created_at DESC'),
  ]);

  const historyMap = new Map();
  for (const h of historyRows) {
    if (!historyMap.has(h.blogger_id)) {
      historyMap.set(h.blogger_id, []);
    }
    historyMap.get(h.blogger_id).push({
      id: h.id,
      date: h.date,
      collaborationType: h.collaboration_type,
      brand: h.brand,
      status: h.status,
      category: h.category || undefined,
      manager: h.manager || undefined,
      time: h.time || undefined,
      notes: h.notes || undefined,
      price: Number(h.price || 0),
      paymentStatus: h.payment_status || 'pending',
      blacklistReason: h.blacklist_reason || undefined,
      createdAt: h.created_at,
      completedAt: h.completed_at || null,
    });
  }

  return bloggerRows.map((b) => {
    const list = historyMap.get(b.id) || [];
    const fallbackHistory = [{
      id: `${b.id}-initial`,
      date: b.date,
      collaborationType: b.collaboration_type,
      brand: b.brand,
      status: b.status,
      category: b.category || undefined,
      manager: b.manager || undefined,
      time: b.time || undefined,
      notes: b.notes || undefined,
      price: Number(b.price || 0),
      paymentStatus: b.payment_status || 'pending',
      blacklistReason: b.blacklist_reason || undefined,
      createdAt: b.created_at,
      completedAt: b.completed_at || null,
    }];

    const fullHistory = list.length > 0 ? list : fallbackHistory;
    const hasPendingCollab = fullHistory.some((h) => h.status === 'pending');
    const effectiveStatus = hasPendingCollab ? 'pending' : 'completed';

    return {
      id: b.id,
      nickname: b.nickname,
      date: b.date,
      collaborationType: b.collaboration_type,
      brand: b.brand,
      status: effectiveStatus,
      category: b.category || undefined,
      manager: b.manager || undefined,
      time: b.time || undefined,
      audience: b.audience || undefined,
      notes: b.notes || undefined,
      isBlacklisted: Boolean(b.is_blacklisted),
      blacklistReason: b.blacklist_reason || undefined,
      price: Number(b.price || 0),
      paymentStatus: b.payment_status || 'pending',
      createdAt: b.created_at,
      completedAt: b.completed_at || null,
      history: fullHistory,
    };
  });
}

export async function getBloggerById(id) {
  await initDatabase();
  const rows = await executeQuery('SELECT * FROM bloggers WHERE id = ?', [id]);
  if (!rows.length) return null;
  const b = rows[0];

  const historyRows = await executeQuery('SELECT * FROM blogger_history WHERE blogger_id = ? ORDER BY date DESC, created_at DESC', [id]);
  const history = historyRows.map((h) => ({
    id: h.id,
    date: h.date,
    collaborationType: h.collaboration_type,
    brand: h.brand,
    status: h.status,
    category: h.category || undefined,
    manager: h.manager || undefined,
    time: h.time || undefined,
    notes: h.notes || undefined,
    price: Number(h.price || 0),
    paymentStatus: h.payment_status || 'pending',
    blacklistReason: h.blacklist_reason || undefined,
    createdAt: h.created_at,
    completedAt: h.completed_at || null,
  }));

  const fullHistory = history.length > 0 ? history : [{
    id: `${b.id}-initial`,
    date: b.date,
    collaborationType: b.collaboration_type,
    brand: b.brand,
    status: b.status,
    category: b.category || undefined,
    manager: b.manager || undefined,
    time: b.time || undefined,
    notes: b.notes || undefined,
    price: Number(b.price || 0),
    paymentStatus: b.payment_status || 'pending',
    blacklistReason: b.blacklist_reason || undefined,
    createdAt: b.created_at,
    completedAt: b.completed_at || null,
  }];

  const hasPending = fullHistory.some((h) => h.status === 'pending');

  return {
    id: b.id,
    nickname: b.nickname,
    date: b.date,
    collaborationType: b.collaboration_type,
    brand: b.brand,
    status: hasPending ? 'pending' : 'completed',
    category: b.category || undefined,
    manager: b.manager || undefined,
    time: b.time || undefined,
    audience: b.audience || undefined,
    notes: b.notes || undefined,
    isBlacklisted: Boolean(b.is_blacklisted),
    blacklistReason: b.blacklist_reason || undefined,
    price: Number(b.price || 0),
    paymentStatus: b.payment_status || 'pending',
    createdAt: b.created_at,
    completedAt: b.completed_at || null,
    history: fullHistory,
  };
}

export async function findBloggerByNickname(nickname) {
  await initDatabase();
  const normalized = normalizeNickname(nickname);
  const rows = await executeQuery('SELECT id FROM bloggers WHERE lower(nickname) = lower(?)', [normalized]);
  if (!rows.length) return null;
  return getBloggerById(rows[0].id);
}

export async function saveOrUpdateBloggerRecord(blogger) {
  await initDatabase();

  const statements = [
    {
      sql: `
        INSERT INTO bloggers (
          id, nickname, date, collaboration_type, brand, status,
          category, manager, time, audience, notes, is_blacklisted, blacklist_reason,
          price, payment_status, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          nickname = excluded.nickname,
          date = excluded.date,
          collaboration_type = excluded.collaboration_type,
          brand = excluded.brand,
          status = excluded.status,
          category = excluded.category,
          manager = excluded.manager,
          time = excluded.time,
          audience = excluded.audience,
          notes = excluded.notes,
          is_blacklisted = excluded.is_blacklisted,
          blacklist_reason = excluded.blacklist_reason,
          price = excluded.price,
          payment_status = excluded.payment_status,
          completed_at = excluded.completed_at
      `,
      params: [
        blogger.id,
        normalizeNickname(blogger.nickname),
        blogger.date,
        blogger.collaborationType || blogger.collaboration_type || 'barter',
        blogger.brand || 'mio_beauty',
        blogger.status || 'pending',
        blogger.category || null,
        blogger.manager || null,
        blogger.time || null,
        blogger.audience || null,
        blogger.notes || null,
        blogger.isBlacklisted ? 1 : 0,
        blogger.blacklistReason || null,
        Number(blogger.price || 0),
        blogger.paymentStatus || 'pending',
        blogger.createdAt || blogger.created_at || new Date().toISOString(),
        blogger.completedAt || blogger.completed_at || null,
      ],
    },
  ];

  if (Array.isArray(blogger.history)) {
    for (const h of blogger.history) {
      statements.push({
        sql: `
          INSERT INTO blogger_history (
            id, blogger_id, date, collaboration_type, brand, status,
            category, manager, time, notes, price, payment_status, blacklist_reason,
            created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            date = excluded.date,
            collaboration_type = excluded.collaboration_type,
            brand = excluded.brand,
            status = excluded.status,
            category = excluded.category,
            manager = excluded.manager,
            time = excluded.time,
            notes = excluded.notes,
            price = excluded.price,
            payment_status = excluded.payment_status,
            blacklist_reason = excluded.blacklist_reason,
            completed_at = excluded.completed_at
        `,
        params: [
          h.id,
          blogger.id,
          h.date,
          h.collaborationType || h.collaboration_type || 'barter',
          h.brand || 'mio_beauty',
          h.status || 'pending',
          h.category || null,
          h.manager || null,
          h.time || null,
          h.notes || null,
          Number(h.price || 0),
          h.paymentStatus || 'pending',
          h.blacklistReason || null,
          h.createdAt || h.created_at || new Date().toISOString(),
          h.completedAt || h.completed_at || null,
        ],
      });
    }
  }

  await executeBatch(statements);
}

export async function deleteBlogger(id) {
  await initDatabase();
  await executeBatch([
    { sql: 'DELETE FROM blogger_history WHERE blogger_id = ?', params: [id] },
    { sql: 'DELETE FROM bloggers WHERE id = ?', params: [id] },
  ]);
}

export async function completeBlogger(id, historyId = null) {
  await initDatabase();
  const now = new Date().toISOString();

  if (historyId) {
    await executeBatch([
      {
        sql: 'UPDATE blogger_history SET status = ?, completed_at = ? WHERE id = ?',
        params: ['completed', now, historyId],
      },
    ]);

    const pendingList = await executeQuery(
      'SELECT count(*) as count FROM blogger_history WHERE blogger_id = ? AND status = ?',
      [id, 'pending']
    );
    const pendingCount = Number(pendingList[0]?.count || 0);

    if (pendingCount === 0) {
      await executeBatch([
        { sql: 'UPDATE bloggers SET status = ?, completed_at = ? WHERE id = ?', params: ['completed', now, id] },
      ]);
    }
    return getBloggerById(id);
  }

  await executeBatch([
    { sql: 'UPDATE bloggers SET status = ?, completed_at = ? WHERE id = ?', params: ['completed', now, id] },
    { sql: 'UPDATE blogger_history SET status = ?, completed_at = ? WHERE blogger_id = ? AND status = ?', params: ['completed', now, id, 'pending'] },
  ]);
  return getBloggerById(id);
}

// User / Manager boshqaruvi
export async function getAllUsers() {
  await initDatabase();
  const rows = await executeQuery('SELECT username, role, active, name, password, created_at FROM users ORDER BY created_at DESC, username ASC');
  return rows.map((r) => ({
    username: r.username,
    role: r.role,
    active: Boolean(r.active),
    name: r.name || r.username,
    password: r.password || '',
    createdAt: r.created_at || null,
  }));
}

export async function saveUser({ username, name, role, password, active = true }) {
  await initDatabase();
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanRole = ['admin', 'manager', 'viewer'].includes(role) ? role : 'manager';
  const cleanName = String(name || cleanUsername).trim();
  const cleanPass = String(password || '').trim();
  const now = new Date().toISOString();

  await executeQuery(
    `INSERT INTO users (username, role, password_hash, active, name, password, created_at)
     VALUES (?, ?, '', ?, ?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET
       role = excluded.role,
       active = excluded.active,
       name = excluded.name,
       password = CASE WHEN excluded.password != '' THEN excluded.password ELSE users.password END`,
    [cleanUsername, cleanRole, active ? 1 : 0, cleanName, cleanPass, now]
  );

  return { username: cleanUsername, role: cleanRole, name: cleanName, active: Boolean(active) };
}

export async function toggleUserActive(username, active) {
  await initDatabase();
  await executeQuery('UPDATE users SET active = ? WHERE lower(username) = lower(?)', [active ? 1 : 0, String(username).toLowerCase()]);
}

export async function deleteUser(username) {
  await initDatabase();
  await executeQuery('DELETE FROM users WHERE lower(username) = lower(?)', [String(username).toLowerCase()]);
}

export async function findUser(username) {
  await initDatabase();
  const rows = await executeQuery('SELECT * FROM users WHERE lower(username) = ?', [String(username).toLowerCase()]);
  if (!rows.length) return null;
  const row = rows[0];
  return {
    username: row.username,
    role: row.role,
    name: row.name || row.username,
    password: row.password || '',
    password_hash: row.password_hash || '',
    active: Boolean(row.active),
  };
}
