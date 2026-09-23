import { createClient } from '@supabase/supabase-js';

const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
export const supabase = createClient(process.env.SUPABASE_URL, key);

export function rowToBlogger(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    date: row.date,
    collaborationType: row.collaboration_type,
    brand: row.brand,
    status: row.status,
    category: row.category || undefined,
    manager: row.manager || undefined,
    time: row.time || undefined,
    audience: row.audience || undefined,
    notes: row.notes || undefined,
    completedAt: row.completed_at || null,
    isBlacklisted: row.is_blacklisted || false,
    blacklistReason: row.blacklist_reason || undefined,
    history: Array.isArray(row.history) ? row.history : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function bloggerToRow(blogger) {
  return {
    id: blogger.id,
    nickname: blogger.nickname,
    date: blogger.date,
    collaboration_type: blogger.collaborationType,
    brand: blogger.brand,
    status: blogger.status,
    category: blogger.category || null,
    manager: blogger.manager || null,
    time: blogger.time || null,
    audience: blogger.audience || null,
    notes: blogger.notes || null,
    completed_at: blogger.completedAt || null,
    is_blacklisted: blogger.isBlacklisted || false,
    blacklist_reason: blogger.blacklistReason || null,
    history: blogger.history || [],
    created_at: blogger.createdAt || new Date().toISOString(),
  };
}

export async function getBloggers() {
  const { data, error } = await supabase.from('bloggers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToBlogger);
}

export async function saveBloggers(bloggers) {
  const { error } = await supabase.from('bloggers').upsert(bloggers.map(bloggerToRow), { onConflict: 'id' });
  if (error) throw error;
}

export function normalizeNickname(nickname) {
  return `@${String(nickname || '').trim().replace(/^@+/, '')}`;
}

export function jsonError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}
