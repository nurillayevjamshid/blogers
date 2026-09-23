import { getBloggers, saveBloggers, jsonError } from '../../_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') { res.setHeader('Allow', 'PATCH'); return jsonError(res, 405, 'Method not allowed.'); }
  try {
    const bloggers = await getBloggers();
    const blogger = bloggers.find((item) => item.id === req.query.id);
    if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');
    const now = new Date().toISOString();
    blogger.status = 'completed';
    blogger.completedAt = now;
    blogger.history?.forEach((item) => { if (item.status === 'pending') { item.status = 'completed'; item.completedAt = now; } });
    await saveBloggers(bloggers);
    return res.json({ success: true, data: blogger });
  } catch (error) { console.error(error); return jsonError(res, 500, 'Blogerni yangilashda xatolik yuz berdi.'); }
}
