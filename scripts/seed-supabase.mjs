import 'dotenv/config';
import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!process.env.SUPABASE_URL || !key) throw new Error('SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY (yoki SUPABASE_SECRET_KEY) kerak.');
const supabase = createClient(process.env.SUPABASE_URL, key, { auth: { persistSession: false } });
const rows = JSON.parse(await fs.readFile(new URL('../data/bloggers.json', import.meta.url), 'utf8')).map((b) => ({
  id: b.id, nickname: b.nickname, date: b.date, collaboration_type: b.collaborationType,
  brand: b.brand, status: b.status, manager: b.manager ?? null, history: b.history ?? [],
  completed_at: b.completedAt ?? null, created_at: b.createdAt ?? new Date().toISOString(),
}));
const { error } = await supabase.from('bloggers').upsert(rows, { onConflict: 'id' });
if (error) throw error;
console.log(`Supabasega ${rows.length} ta blogger ko‘chirildi.`);
