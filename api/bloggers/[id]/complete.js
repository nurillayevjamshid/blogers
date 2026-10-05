import { completeBlogger, getBloggerById } from '../../../src/db.js';
import { jsonError } from '../../bloggers.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return jsonError(res, 405, 'Method not allowed.');
  }
  try {
    const id = String(req.query?.id || '');
    const historyId = req.query?.historyId || req.body?.historyId || null;

    const blogger = await getBloggerById(id);
    if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');

    const updated = await completeBlogger(id, historyId ? String(historyId) : null);
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return jsonError(res, 500, 'Blogerni yangilashda xatolik yuz berdi.');
  }
}
