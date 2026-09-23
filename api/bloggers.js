import { getBloggers, saveBloggers, normalizeNickname, jsonError } from './_supabase.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.json({ success: true, data: await getBloggers() });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return jsonError(res, 405, 'Method not allowed.');
    }

    const { nickname, date, collaborationType, brand, category, manager, time, audience, notes } = req.body || {};
    if (!nickname || typeof nickname !== 'string' || !nickname.trim()) return jsonError(res, 400, "Bloger nickname'ini kiriting.");
    if (!date) return jsonError(res, 400, 'Sanani tanlang.');

    const type = ['barter', 'paid'].includes(collaborationType) ? collaborationType : 'barter';
    const br = ['mio_beauty', 'mio_home'].includes(brand) ? brand : 'mio_beauty';
    const normalized = normalizeNickname(nickname);
    const cleanKey = normalized.slice(1).toLowerCase();
    const bloggers = await getBloggers();
    const existing = bloggers.find((b) => b.nickname.replace(/^@/, '').toLowerCase() === cleanKey);
    const newCollabItem = {
      id: `collab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date, collaborationType: type, brand: br, status: 'pending',
      category: category || undefined, manager: manager?.trim() || undefined,
      time: time || '14:30 (Story seriya)', notes: notes || undefined,
      createdAt: new Date().toISOString(), completedAt: null,
    };

    if (existing) {
      if (existing.isBlacklisted) return jsonError(res, 400, 'Ushbu bloger qora ro‘yxatda. Hamkorlik kiritib bo‘lmaydi.');
      existing.history = Array.isArray(existing.history) ? existing.history : [];
      existing.history.unshift(newCollabItem);
      Object.assign(existing, { date, collaborationType: type, brand: br, status: 'pending', completedAt: null });
      if (category !== undefined) existing.category = category || undefined;
      if (manager !== undefined) existing.manager = manager.trim() || undefined;
      if (notes !== undefined) existing.notes = notes || undefined;
      if (audience) existing.audience = audience;
      await saveBloggers(bloggers);
      return res.status(200).json({ success: true, data: existing, isRepeat: true });
    }

    const blogger = {
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nickname: normalized, date, collaborationType: type, brand: br, status: 'pending',
      category: category || undefined, manager: manager?.trim() || undefined,
      time: time || '14:30 (Story seriya)', audience: audience || '250k obunachi',
      notes: notes || undefined, createdAt: new Date().toISOString(), completedAt: null,
      history: [newCollabItem],
    };
    bloggers.unshift(blogger);
    await saveBloggers(bloggers);
    return res.status(201).json({ success: true, data: blogger, isRepeat: false });
  } catch (error) {
    console.error(error);
    return jsonError(res, 500, 'Ma’lumotni saqlashda xatolik yuz berdi.');
  }
}
