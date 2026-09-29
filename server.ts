import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

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

const DATA_FILE = path.join(__dirname, 'data', 'bloggers.json');
const databaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = databaseKey && process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, databaseKey, { auth: { persistSession: false } })
  : null;

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
const bloggerToRow = (b: Blogger) => ({
  id: b.id, nickname: b.nickname, date: b.date, collaboration_type: b.collaborationType,
  brand: b.brand, status: b.status, created_at: b.createdAt, completed_at: b.completedAt || null,
  manager: b.manager || null, history: b.history || [],
});

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
function localWrite(data: Blogger[]) { fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true }); fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
async function readBloggers() {
  if (!supabase) return localRead();
  const { data, error } = await supabase.from('bloggers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToBlogger);
}
async function writeBloggers(data: Blogger[]) {
  if (!supabase) return localWrite(data);
  const { error } = await supabase.from('bloggers').upsert(data.map(bloggerToRow), { onConflict: 'id' });
  if (error) throw error;
}

// Product roles: Jamshid is the administrator; Nuriddin is read-only viewer.
const credentials: Array<{ username: string; password: string; role: Role }> = [
  { username: 'jamshid', password: '123', role: 'admin' },
  { username: 'nuriddin', password: '12345', role: 'viewer' },
];
function parseAuth(req: Request) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const [username, role] = Buffer.from(header.slice(7), 'base64').toString('utf8').split(':');
    return credentials.find((credential) => credential.username === username && credential.role === role) || null;
  } catch { return null; }
}
function auth(requiredRole?: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = parseAuth(req);
    if (!user) return res.status(401).json({ success: false, error: 'Sessiya tugagan. Qayta kiring.' });
    if (requiredRole && user.role !== requiredRole) return res.status(403).json({ success: false, error: 'Bu amal faqat admin uchun.' });
    (req as any).user = user;
    next();
  };
}
const fail = (res: Response, status: number, message: string) => res.status(status).json({ success: false, error: message });

app.get('/api/health', (_req, res) => res.json({ success: true, database: supabase ? 'supabase' : 'local-demo' }));
app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const found = credentials.find((credential) => credential.username === username && credential.password === password);
  if (!found) return fail(res, 401, 'Login yoki parol xato.');
  const token = Buffer.from(`${found.username}:${found.role}`).toString('base64');
  return res.json({ success: true, session: { username: found.username, role: found.role, token } });
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
    const data = await readBloggers(); const next = data.filter((item) => item.id !== req.params.id);
    if (next.length === data.length) return fail(res, 404, 'Bloger topilmadi.');
    await writeBloggers(next); return res.json({ success: true });
  } catch (error) { console.error(error); return fail(res, 500, 'Blogerni o‘chirishda xatolik yuz berdi.'); }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist'); app.use(express.static(dist)); app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`MIO server running on ${PORT} · database: ${supabase ? 'supabase' : 'local-demo'}`));
}
start();
