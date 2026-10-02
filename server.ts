import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';

const __dirname = process.cwd();
const PORT = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json({ limit: '1mb' }));

type Role = 'admin' | 'viewer';
type Status = 'pending' | 'completed';
type Brand = 'mio_beauty' | 'mio_home';
type CollaborationType = 'barter' | 'paid';
interface History { id: string; date: string; collaborationType: CollaborationType; brand: Brand; status: Status; createdAt: string; completedAt?: string | null; manager?: string }
interface Blogger { id: string; nickname: string; date: string; collaborationType: CollaborationType; brand: Brand; status: Status; createdAt: string; completedAt?: string | null; manager?: string; history: History[] }
interface AppUser { username: string; role: Role; password_hash: string; active?: boolean }

const DATA_FILE = path.join(__dirname, 'data', 'bloggers.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'mio-local-development-secret-change-in-production';

const normalize = (value: unknown) => `@${String(value || '').trim().replace(/^@+/, '')}`;
const rowToBlogger = (row: any): Blogger => {
  const fallbackHistory: History = {
    id: `${row.id}-initial`, date: String(row.date).slice(0, 10),
    collaborationType: row.collaboration_type, brand: row.brand, status: row.status,
    createdAt: row.created_at || new Date().toISOString(), completedAt: row.completed_at || null,
    manager: row.manager || undefined,
  };
  return {
    id: row.id, nickname: normalize(row.nickname), date: String(row.date).slice(0, 10),
    collaborationType: row.collaboration_type, brand: row.brand, status: row.status,
    createdAt: row.created_at || new Date().toISOString(), completedAt: row.completed_at || null,
    manager: row.manager || undefined, history: Array.isArray(row.history) && row.history.length ? row.history : [fallbackHistory],
  };
};
function localRead(): Blogger[] {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Blogger[];
    const map = new Map<string, Blogger>();
    for (const item of raw) {
      const nickname = normalize(item.nickname);
      const key = nickname.slice(1).toLowerCase();
      const history = item.history?.length ? item.history : [{ id: `${item.id}-initial`, date: item.date, collaborationType: item.collaborationType || 'barter', brand: item.brand || 'mio_beauty', status: item.status || 'completed', createdAt: item.createdAt || new Date().toISOString(), completedAt: item.completedAt || null, manager: item.manager }];
      if (!map.has(key)) map.set(key, { ...item, nickname, history });
      else {
        const current = map.get(key)!;
        for (const entry of history) if (!current.history.some((h) => h.id === entry.id)) current.history.push(entry);
      }
    }
    return [...map.values()];
  } catch { return []; }
}
function localWrite(data: Blogger[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}
async function readBloggers() { return localRead(); }
async function writeBloggers(data: Blogger[]) { localWrite(data); }

// Roles and password hashes live in data/users.json. Plaintext passwords are never stored.
function localUsers(): AppUser[] {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) as AppUser[]; } catch { return []; }
}
async function findUser(username: string): Promise<AppUser | null> {
  return localUsers().find((user) => user.username === username && user.active !== false) || null;
}
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
    return user && user.role === decoded.role ? user : null;
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

app.get('/api/health', (_req, res) => res.json({ success: true, database: 'json-file' }));
app.post('/api/auth/guest', async (_req, res) => {
  try {
    const guest = await findUser('jamshid');
    if (!guest) return fail(res, 503, 'Avtomatik sessiya uchun foydalanuvchi sozlanmagan.');
    return res.json({ success: true, session: { username: guest.username, role: guest.role, token: createToken(guest) } });
  } catch (error) { console.error(error); return fail(res, 500, 'Avtomatik sessiya yaratilmadi.'); }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const found = await findUser(username);
    if (!found || !verifyPassword(password, found.password_hash)) return fail(res, 401, 'Login yoki parol xato.');
    return res.json({ success: true, session: { username: found.username, role: found.role, token: createToken(found) } });
  } catch (error) { console.error(error); return fail(res, 500, 'Login xizmatida xatolik yuz berdi.'); }
});

app.get('/api/bloggers', auth(), async (_req, res) => {
  try { return res.json({ success: true, data: await readBloggers() }); }
  catch (error) { console.error(error); return fail(res, 500, 'Ma’lumotlarni yuklashda xatolik yuz berdi.'); }
});
app.post('/api/bloggers', auth('admin'), async (req, res) => {
  try {
    const { nickname, date, collaborationType, brand, manager } = req.body || {};
    if (!nickname?.trim()) return fail(res, 400, "Bloger nickname'ini kiriting.");
    if (!date) return fail(res, 400, 'Sanani tanlang.');
    const type: CollaborationType = ['barter', 'paid'].includes(collaborationType) ? collaborationType : 'barter';
    const selectedBrand: Brand = ['mio_beauty', 'mio_home'].includes(brand) ? brand : 'mio_beauty';
    const normalized = normalize(nickname);
    const key = normalized.slice(1).toLowerCase();
    const bloggers = await readBloggers();
    const now = new Date().toISOString();
    const history: History = { id: `collab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, date, collaborationType: type, brand: selectedBrand, status: 'pending', createdAt: now, completedAt: null, manager: manager?.trim() || undefined };
    const index = bloggers.findIndex((blogger) => blogger.nickname.slice(1).toLowerCase() === key);
    if (index >= 0) {
      const blogger = bloggers[index];
      blogger.history = [history, ...(blogger.history || [])];
      Object.assign(blogger, { date, collaborationType: type, brand: selectedBrand, status: 'pending', completedAt: null, manager: manager?.trim() || undefined });
      await writeBloggers(bloggers);
      return res.json({ success: true, data: blogger, isRepeat: true });
    }
    const blogger: Blogger = { id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, nickname: normalized, date, collaborationType: type, brand: selectedBrand, status: 'pending', createdAt: now, completedAt: null, manager: manager?.trim() || undefined, history: [history] };
    bloggers.unshift(blogger);
    await writeBloggers(bloggers);
    return res.status(201).json({ success: true, data: blogger, isRepeat: false });
  } catch (error) { console.error(error); return fail(res, 500, 'Blogerni saqlashda xatolik yuz berdi.'); }
});
app.patch('/api/bloggers/:id', auth('admin'), async (req, res) => {
  try {
    const { nickname, date, collaborationType, brand, manager } = req.body || {};
    if (!nickname?.trim()) return fail(res, 400, "Bloger nickname'ini kiriting.");
    if (!date) return fail(res, 400, 'Sanani tanlang.');
    const type: CollaborationType = ['barter', 'paid'].includes(collaborationType) ? collaborationType : 'barter';
    const selectedBrand: Brand = ['mio_beauty', 'mio_home'].includes(brand) ? brand : 'mio_beauty';
    const normalized = normalize(nickname); const key = normalized.slice(1).toLowerCase();
    const data = await readBloggers(); const blogger = data.find((item) => item.id === req.params.id);
    if (!blogger) return fail(res, 404, 'Bloger topilmadi.');
    if (data.some((item) => item.id !== blogger.id && item.nickname.slice(1).toLowerCase() === key)) return fail(res, 409, 'Bu nickname allaqachon mavjud.');
    Object.assign(blogger, { nickname: normalized, date, collaborationType: type, brand: selectedBrand, manager: manager?.trim() || undefined });
    if (blogger.history?.length) Object.assign(blogger.history[0], { date, collaborationType: type, brand: selectedBrand, manager: manager?.trim() || undefined });
    await writeBloggers(data); return res.json({ success: true, data: blogger });
  } catch (error) { console.error(error); return fail(res, 500, 'Blogerni tahrirlashda xatolik yuz berdi.'); }
});
app.patch('/api/bloggers/:id/complete', auth('admin'), async (req, res) => {
  try {
    const data = await readBloggers(); const blogger = data.find((item) => item.id === req.params.id);
    if (!blogger) return fail(res, 404, 'Bloger topilmadi.');
    const now = new Date().toISOString(); blogger.status = 'completed'; blogger.completedAt = now;
    blogger.history.forEach((entry) => { if (entry.status === 'pending') { entry.status = 'completed'; entry.completedAt = now; } });
    await writeBloggers(data); return res.json({ success: true, data: blogger });
  } catch (error) { console.error(error); return fail(res, 500, 'Blogerni yangilashda xatolik yuz berdi.'); }
});
app.delete('/api/bloggers/:id', auth('admin'), async (req, res) => {
  try {
    const data = await readBloggers(); const blogger = data.find((item) => item.id === req.params.id);
    if (!blogger) return fail(res, 404, 'Bloger topilmadi.');
    await writeBloggers(data.filter((item) => item.id !== req.params.id));
    return res.json({ success: true });
  } catch (error) { console.error(error); return fail(res, 500, 'Blogerni o‘chirishda xatolik yuz berdi.'); }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist'); app.use(express.static(dist)); app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`MIO server running on ${PORT} · database: json-file`));
}
start();
