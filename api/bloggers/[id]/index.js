import { getBloggers, saveBloggers, jsonError } from '../../_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') { res.setHeader('Allow', 'DELETE'); return jsonError(res, 405, 'Method not allowed.'); }
  try {
    const bloggers = await getBloggers();
    const filtered = bloggers.filter((item) => item.id !== req.query.id);
    if (filtered.length === bloggers.length) return jsonError(res, 404, 'Bloger topilmadi.');
    await saveBloggers(filtered);
    return res.json({ success: true });
  } catch (error) { console.error(error); return jsonError(res, 500, 'Blogerni o‘chirishda xatolik yuz berdi.'); }
}
