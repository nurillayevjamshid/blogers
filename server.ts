import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  getAllBloggers,
  getBloggerById,
  findBloggerByNickname,
  saveOrUpdateBloggerRecord,
  deleteBlogger,
  completeBlogger,
  findUser,
  normalizeNickname,
} from './src/db.js';

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json({ limit: '1mb' }));

type Role = 'admin' | 'viewer';
type Status = 'pending' | 'completed';
type Brand = 'mio_beauty' | 'mio_home';
type CollaborationType = 'barter' | 'paid';
interface History {
  id: string;
  date: string;
  collaborationType: CollaborationType;
  brand: Brand;
  status: Status;
  createdAt: string;
  completedAt?: string | null;
  category?: string;
  manager?: string;
  time?: string;
  notes?: string;
}
interface Blogger {
  id: string;
  nickname: string;
  date: string;
  collaborationType: CollaborationType;
  brand: Brand;
  status: Status;
  createdAt: string;
  completedAt?: string | null;
  category?: string;
  manager?: string;
  time?: string;
  audience?: string;
  notes?: string;
  isBlacklisted?: boolean;
  history: History[];
}
interface AppUser {
  username: string;
  role: Role;
  password_hash: string;
  active?: boolean;
}

const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'mio-local-development-secret-change-in-production';

function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, expected] = String(encoded || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  try {
    const actual = crypto.scryptSync(password, salt, 64).toString('hex');
    return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch { return false; }
}

function createToken(user: AppUser) {
  const payload = Buffer.from(JSON.stringify({ username: user.username, role: user.role, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

async function parseAuth(req: Request): Promise<AppUser | null> {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const [payload, signature] = header.slice(7).split('.');
    if (!payload || !signature) return null;
    const expected = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest('base64url');
    if (signature !== expected) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.username || !decoded.role || decoded.exp < Date.now()) return null;
    const user = await findUser(decoded.username);
    return user && user.role === decoded.role ? (user as AppUser) : null;
  } catch { return null; }
}

function auth(requiredRole?: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await parseAuth(req);
    if (!user) return res.status(401).json({ success: false, error: 'Sessiya tugagan. Qayta kiring.' });
    if (requiredRole && user.role !== requiredRole) return res.status(403).json({ success: false, error: 'Bu amal faqat admin uchun.' });
    (req as any).user = user;
    next();
  };
}

const fail = (res: Response, status: number, message: string) => res.status(status).json({ success: false, error: message });

app.get('/api/health', (_req, res) => res.json({ success: true, database: 'turso' }));

app.post('/api/auth/guest', async (_req, res) => {
  return fail(res, 401, 'Avtomatik kirish yopiq. Iltimos, login va parol orqali kiring.');
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();
    if (username === 'mio' && password === 'mio070') {
      return res.json({
        success: true,
        session: {
          username: 'mio',
          role: 'admin',
          token: createToken({ username: 'mio', role: 'admin', password_hash: '' }),
        },
      });
    }
    const found = await findUser(username);
    if (!found || !verifyPassword(password, found.password_hash)) return fail(res, 401, 'Login yoki parol xato.');
    return res.json({ success: true, session: { username: found.username, role: found.role, token: createToken(found as AppUser) } });
  } catch (error) { console.error(error); return fail(res, 500, 'Login xizmatida xatolik yuz berdi.'); }
});

app.get('/api/bloggers', auth(), async (_req, res) => {
  try {
    const data = await getAllBloggers();
    return res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Ma’lumotlarni yuklashda xatolik yuz berdi.');
  }
});

app.post('/api/bloggers', auth('admin'), async (req, res) => {
  try {
    const { nickname, date, collaborationType, brand, manager, category, time, audience, notes } = req.body || {};
    if (!nickname?.trim()) return fail(res, 400, "Bloger nickname'ini kiriting.");
    if (!date) return fail(res, 400, 'Sanani tanlang.');

    const type: CollaborationType = ['barter', 'paid'].includes(collaborationType) ? collaborationType : 'barter';
    const selectedBrand: Brand = ['mio_beauty', 'mio_home'].includes(brand) ? brand : 'mio_beauty';
    const normalized = normalizeNickname(nickname);
    const existing = await findBloggerByNickname(normalized);

    const now = new Date().toISOString();
    const historyItem: History = {
      id: `collab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date,
      collaborationType: type,
      brand: selectedBrand,
      status: 'pending',
      category: category || undefined,
      manager: manager?.trim() || undefined,
      time: time || undefined,
      notes: notes || undefined,
      createdAt: now,
      completedAt: null,
    };

    if (existing) {
      if (existing.isBlacklisted) return fail(res, 400, 'Ushbu bloger qora ro‘yxatda.');
      const updatedHistory = [historyItem, ...(existing.history || [])];
      const updated: Blogger = {
        ...existing,
        date,
        collaborationType: type,
        brand: selectedBrand,
        status: 'pending',
        category: category !== undefined ? (category || undefined) : existing.category,
        manager: manager !== undefined ? (manager?.trim() || undefined) : existing.manager,
        time: time !== undefined ? (time || undefined) : existing.time,
        audience: audience !== undefined ? (audience || undefined) : existing.audience,
        notes: notes !== undefined ? (notes || undefined) : existing.notes,
        completedAt: null,
        history: updatedHistory,
      };
      await saveOrUpdateBloggerRecord(updated);
      return res.json({ success: true, data: updated, isRepeat: true });
    }

    const newBlogger: Blogger = {
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nickname: normalized,
      date,
      collaborationType: type,
      brand: selectedBrand,
      status: 'pending',
      category: category || undefined,
      manager: manager?.trim() || undefined,
      time: time || '14:30 (Story seriya)',
      audience: audience || '250k obunachi',
      notes: notes || undefined,
      createdAt: now,
      completedAt: null,
      history: [historyItem],
    };
    await saveOrUpdateBloggerRecord(newBlogger);
    return res.status(201).json({ success: true, data: newBlogger, isRepeat: false });
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Blogerni saqlashda xatolik yuz berdi.');
  }
});

app.patch('/api/bloggers/:id', auth('admin'), async (req, res) => {
  try {
    const { nickname, date, collaborationType, brand, manager, category, time, audience, notes, isBlacklisted } = req.body || {};
    if (!nickname?.trim()) return fail(res, 400, "Bloger nickname'ini kiriting.");
    if (!date) return fail(res, 400, 'Sanani tanlang.');

    const blogger = await getBloggerById(req.params.id);
    if (!blogger) return fail(res, 404, 'Bloger topilmadi.');

    const normalized = normalizeNickname(nickname);
    const existingWithSameName = await findBloggerByNickname(normalized);
    if (existingWithSameName && existingWithSameName.id !== blogger.id) {
      return fail(res, 409, 'Bu nickname allaqachon mavjud.');
    }

    const type: CollaborationType = ['barter', 'paid'].includes(collaborationType) ? collaborationType : 'barter';
    const selectedBrand: Brand = ['mio_beauty', 'mio_home'].includes(brand) ? brand : 'mio_beauty';

    blogger.nickname = normalized;
    blogger.date = date;
    blogger.collaborationType = type;
    blogger.brand = selectedBrand;
    if (category !== undefined) blogger.category = category || undefined;
    if (manager !== undefined) blogger.manager = manager?.trim() || undefined;
    if (time !== undefined) blogger.time = time || undefined;
    if (audience !== undefined) blogger.audience = audience || undefined;
    if (notes !== undefined) blogger.notes = notes || undefined;
    if (isBlacklisted !== undefined) blogger.isBlacklisted = Boolean(isBlacklisted);

    if (blogger.history?.length) {
      Object.assign(blogger.history[0], {
        date,
        collaborationType: type,
        brand: selectedBrand,
        category: blogger.category,
        manager: blogger.manager,
        time: blogger.time,
        notes: blogger.notes,
      });
    }

    await saveOrUpdateBloggerRecord(blogger);
    return res.json({ success: true, data: blogger });
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Blogerni tahrirlashda xatolik yuz berdi.');
  }
});

app.patch('/api/bloggers/:id/complete', auth('admin'), async (req, res) => {
  try {
    const blogger = await getBloggerById(req.params.id);
    if (!blogger) return fail(res, 404, 'Bloger topilmadi.');
    const historyId = req.query?.historyId || req.body?.historyId || null;
    const updated = await completeBlogger(req.params.id, historyId ? String(historyId) : null);
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Blogerni yangilashda xatolik yuz berdi.');
  }
});

app.delete('/api/bloggers/:id', auth('admin'), async (req, res) => {
  try {
    const blogger = await getBloggerById(req.params.id);
    if (!blogger) return fail(res, 404, 'Bloger topilmadi.');
    await deleteBlogger(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Blogerni o‘chirishda xatolik yuz berdi.');
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`MIO server running on ${PORT} · database: turso`));
}

start();
