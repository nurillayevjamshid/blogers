import { deleteBlogger, getBloggerById } from '../../../src/db.js';
import { jsonError } from '../../bloggers.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return jsonError(res, 405, 'Method not allowed.');
  }
  try {
    const id = String(req.query?.id || '');
    const blogger = await getBloggerById(id);
    if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');

    await deleteBlogger(id);
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return jsonError(res, 500, 'Blogerni o‘chirishda xatolik yuz berdi.');
  }
}
