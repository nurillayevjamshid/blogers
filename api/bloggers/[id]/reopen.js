import { getBloggers, saveBloggers, jsonError } from '../../_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') { res.setHeader('Allow', 'PATCH'); return jsonError(res, 405, 'Method not allowed.'); }
  try {
    const bloggers = await getBloggers();
    const blogger = bloggers.find((item) => item.id === req.query.id);
    if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');
    blogger.status = 'pending';
    blogger.completedAt = null;
    if (blogger.history?.length) { blogger.history[0].status = 'pending'; blogger.history[0].completedAt = null; }
    await saveBloggers(bloggers);
    return res.json({ success: true, data: blogger });
  } catch (error) { console.error(error); return jsonError(res, 500, 'Blogerni qayta ochishda xatolik yuz berdi.'); }
}
