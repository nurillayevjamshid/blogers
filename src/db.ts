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
        active INTEGER NOT NULL DEFAULT 1
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
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (blogger_id) REFERENCES bloggers(id) ON DELETE CASCADE
      );`,
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_bloggers_nickname ON bloggers(nickname);` },
    { sql: `CREATE INDEX IF NOT EXISTS idx_history_blogger_id ON blogger_history(blogger_id);` },
  ]);

  // 2. Boshlang'ich foydalanuvchilarni ko'chirish
  try {
    const existingUsers = await executeQuery('SELECT count(*) as count FROM users');
    const userCount = Number(existingUsers[0]?.count || 0);

    if (userCount === 0) {
      const usersFile = path.join(process.cwd(), 'data', 'users.json');
      if (fs.existsSync(usersFile)) {
        const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        if (Array.isArray(usersData)) {
          const userStatements = usersData.map((u) => ({
            sql: `INSERT OR IGNORE INTO users (username, role, password_hash, active) VALUES (?, ?, ?, ?)`,
            params: [u.username, u.role, u.password_hash, u.active !== false ? 1 : 0],
          }));
          await executeBatch(userStatements);
          console.log(`[Turso] ${usersData.length} foydalanuvchi ko'chirildi.`);
        }
      }
    }
  } catch (err) {
    console.error('[Turso] Users init warning:', err);
  }

  initialized = true;
}

export function normalizeNickname(value: unknown) {
  return `@${String(value || '').trim().replace(/^@+/, '')}`;
}

export async function getAllBloggers() {
  await initDatabase();

  const [bloggerRows, historyRows] = await Promise.all([
    executeQuery('SELECT * FROM bloggers ORDER BY date DESC, created_at DESC'),
    executeQuery('SELECT * FROM blogger_history ORDER BY created_at DESC'),
  ]);

  const historyMap = new Map<string, any[]>();
  for (const h of historyRows) {
    if (!historyMap.has(h.blogger_id)) {
      historyMap.set(h.blogger_id, []);
    }
    historyMap.get(h.blogger_id)!.push({
      id: h.id,
      date: h.date,
      collaborationType: h.collaboration_type,
      brand: h.brand,
      status: h.status,
      category: h.category || undefined,
      manager: h.manager || undefined,
      time: h.time || undefined,
      notes: h.notes || undefined,
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
      createdAt: b.created_at,
      completedAt: b.completed_at || null,
    }];

    return {
      id: b.id,
      nickname: b.nickname,
      date: b.date,
      collaborationType: b.collaboration_type,
      brand: b.brand,
      status: b.status,
      category: b.category || undefined,
      manager: b.manager || undefined,
      time: b.time || undefined,
      audience: b.audience || undefined,
      notes: b.notes || undefined,
      isBlacklisted: Boolean(b.is_blacklisted),
      createdAt: b.created_at,
      completedAt: b.completed_at || null,
      history: list.length > 0 ? list : fallbackHistory,
    };
  });
}

export async function getBloggerById(id: string) {
  await initDatabase();
  const rows = await executeQuery('SELECT * FROM bloggers WHERE id = ?', [id]);
  if (!rows.length) return null;
  const b = rows[0];

  const historyRows = await executeQuery('SELECT * FROM blogger_history WHERE blogger_id = ? ORDER BY created_at DESC', [id]);
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
    createdAt: h.created_at,
    completedAt: h.completed_at || null,
  }));

  return {
    id: b.id,
    nickname: b.nickname,
    date: b.date,
    collaborationType: b.collaboration_type,
    brand: b.brand,
    status: b.status,
    category: b.category || undefined,
    manager: b.manager || undefined,
    time: b.time || undefined,
    audience: b.audience || undefined,
    notes: b.notes || undefined,
    isBlacklisted: Boolean(b.is_blacklisted),
    createdAt: b.created_at,
    completedAt: b.completed_at || null,
    history: history.length > 0 ? history : [{
      id: `${b.id}-initial`,
      date: b.date,
      collaborationType: b.collaboration_type,
      brand: b.brand,
      status: b.status,
      category: b.category || undefined,
      manager: b.manager || undefined,
      time: b.time || undefined,
      notes: b.notes || undefined,
      createdAt: b.created_at,
      completedAt: b.completed_at || null,
    }],
  };
}

export async function findBloggerByNickname(nickname: string) {
  await initDatabase();
  const norm = normalizeNickname(nickname).toLowerCase();
  const rows = await executeQuery('SELECT id FROM bloggers WHERE lower(nickname) = ?', [norm]);
  if (!rows.length) return null;
  return getBloggerById(rows[0].id);
}

export async function saveOrUpdateBloggerRecord(blogger: any) {
  await initDatabase();
  const norm = normalizeNickname(blogger.nickname);

  const statements: Array<{ sql: string; params?: any[] }> = [
    {
      sql: `
        INSERT INTO bloggers (
          id, nickname, date, collaboration_type, brand, status,
          category, manager, time, audience, notes, is_blacklisted, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          completed_at = excluded.completed_at
      `,
      params: [
        blogger.id,
        norm,
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
            category, manager, time, notes, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            date = excluded.date,
            collaboration_type = excluded.collaboration_type,
            brand = excluded.brand,
            status = excluded.status,
            category = excluded.category,
            manager = excluded.manager,
            time = excluded.time,
            notes = excluded.notes,
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
          h.createdAt || h.created_at || new Date().toISOString(),
          h.completedAt || h.completed_at || null,
        ],
      });
    }
  }

  await executeBatch(statements);
}

export async function deleteBlogger(id: string) {
  await initDatabase();
  await executeBatch([
    { sql: 'DELETE FROM blogger_history WHERE blogger_id = ?', params: [id] },
    { sql: 'DELETE FROM bloggers WHERE id = ?', params: [id] },
  ]);
}

export async function completeBlogger(id: string) {
  await initDatabase();
  const now = new Date().toISOString();
  await executeBatch([
    { sql: 'UPDATE bloggers SET status = ?, completed_at = ? WHERE id = ?', params: ['completed', now, id] },
    { sql: 'UPDATE blogger_history SET status = ?, completed_at = ? WHERE blogger_id = ? AND status = ?', params: ['completed', now, id, 'pending'] },
  ]);
  return getBloggerById(id);
}

export async function findUser(username: string) {
  await initDatabase();
  const rows = await executeQuery('SELECT * FROM users WHERE lower(username) = ? AND active = 1', [String(username).toLowerCase()]);
  if (!rows.length) return null;
  const row = rows[0];
  return {
    username: row.username,
    role: row.role,
    password_hash: row.password_hash,
    active: Boolean(row.active),
  };
}
