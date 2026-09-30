import 'dotenv/config';
import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!process.env.SUPABASE_URL || !key) throw new Error('SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY (yoki SUPABASE_SECRET_KEY) kerak.');
const supabase = createClient(process.env.SUPABASE_URL, key, { auth: { persistSession: false } });
const bloggers = JSON.parse(await fs.readFile(new URL('../data/bloggers.json', import.meta.url), 'utf8')).map((b) => ({
  id: b.id, nickname: b.nickname, date: b.date, collaboration_type: b.collaborationType,
  brand: b.brand, status: b.status, manager: b.manager ?? null, history: b.history ?? [],
  completed_at: b.completedAt ?? null, created_at: b.createdAt ?? new Date().toISOString(),
}));
const users = JSON.parse(await fs.readFile(new URL('../data/users.json', import.meta.url), 'utf8')).map((u) => ({
  username: u.username, role: u.role, password_hash: u.password_hash, active: u.active !== false,
}));
const usersResult = await supabase.from('app_users').upsert(users, { onConflict: 'username' });
if (usersResult.error) throw usersResult.error;
const bloggersResult = await supabase.from('bloggers').upsert(bloggers, { onConflict: 'id' });
if (bloggersResult.error) throw bloggersResult.error;
console.log(`Supabasega ${users.length} ta user va ${bloggers.length} ta blogger seed qilindi.`);
