import {
  getBloggerById,
  deleteBlogger,
  saveOrUpdateBloggerRecord,
  findBloggerByNickname,
  normalizeNickname,
} from '../../../src/db.js';

export function jsonError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

export default async function handler(req, res) {
  const id = String(req.query?.id || req.body?.id || '');
  if (!id) return jsonError(res, 400, 'Bloger ID topilmadi.');

  try {
    if (req.method === 'GET') {
      const blogger = await getBloggerById(id);
      if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');
      return res.json({ success: true, data: blogger });
    }

    if (req.method === 'DELETE') {
      const blogger = await getBloggerById(id);
      if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');
      await deleteBlogger(id);
      return res.json({ success: true });
    }

    if (req.method === 'PATCH') {
      const blogger = await getBloggerById(id);
      if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');

      const {
        nickname,
        date,
        collaborationType,
        brand,
        manager,
        category,
        time,
        audience,
        notes,
        isBlacklisted,
        blacklistReason,
        price,
        paymentStatus,
        historyId,
      } = req.body || {};

      // 1. Agar faqat Blacklist o'zgartirilayotgan bo'lsa
      if (isBlacklisted !== undefined && !nickname && !date) {
        blogger.isBlacklisted = Boolean(isBlacklisted);
        blogger.blacklistReason = isBlacklisted ? (blacklistReason?.trim() || 'Sabab ko‘rsatilmadi') : null;
        await saveOrUpdateBloggerRecord(blogger);
        return res.json({ success: true, data: blogger });
      }

      // 2. Agar aniq bir hamkorlik (historyId) to'lov yoki narxi o'zgartirilayotgan bo'lsa
      if (historyId && Array.isArray(blogger.history)) {
        const item = blogger.history.find((h) => h.id === historyId);
        if (item) {
          if (price !== undefined) item.price = Number(price);
          if (paymentStatus !== undefined) item.paymentStatus = paymentStatus;
          if (manager !== undefined) item.manager = manager?.trim() || undefined;
          if (date !== undefined) item.date = date;
          if (brand !== undefined) item.brand = brand;
          if (collaborationType !== undefined) item.collaborationType = collaborationType;

          if (blogger.history[0]?.id === historyId) {
            if (price !== undefined) blogger.price = Number(price);
            if (paymentStatus !== undefined) blogger.paymentStatus = paymentStatus;
          }
          await saveOrUpdateBloggerRecord(blogger);
          return res.json({ success: true, data: blogger });
        }
      }

      // 3. Bloger tahriri (nickname, date, brand, type, manager va h.k.)
      if (nickname) {
        const normalized = normalizeNickname(nickname);
        const existingWithSameName = await findBloggerByNickname(normalized);
        if (existingWithSameName && existingWithSameName.id !== id) {
          return jsonError(res, 409, 'Bu nickname allaqachon mavjud.');
        }
        blogger.nickname = normalized;
      }

      if (date) blogger.date = date;
      if (collaborationType) {
        blogger.collaborationType = ['barter', 'paid'].includes(collaborationType) ? collaborationType : 'barter';
      }
      if (brand) {
        blogger.brand = ['mio_beauty', 'mio_home'].includes(brand) ? brand : 'mio_beauty';
      }
      if (category !== undefined) blogger.category = category || undefined;
      if (manager !== undefined) blogger.manager = manager?.trim() || undefined;
      if (time !== undefined) blogger.time = time || undefined;
      if (audience !== undefined) blogger.audience = audience || undefined;
      if (notes !== undefined) blogger.notes = notes || undefined;
      if (isBlacklisted !== undefined) blogger.isBlacklisted = Boolean(isBlacklisted);
      if (blacklistReason !== undefined) blogger.blacklistReason = blacklistReason || undefined;
      if (price !== undefined) blogger.price = Number(price);
      if (paymentStatus !== undefined) blogger.paymentStatus = paymentStatus;

      if (blogger.history?.length) {
        Object.assign(blogger.history[0], {
          date: blogger.date,
          collaborationType: blogger.collaborationType,
          brand: blogger.brand,
          category: blogger.category,
          manager: blogger.manager,
          time: blogger.time,
          notes: blogger.notes,
          price: blogger.price,
          paymentStatus: blogger.paymentStatus,
        });
      }

      await saveOrUpdateBloggerRecord(blogger);
      return res.json({ success: true, data: blogger });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return jsonError(res, 405, 'Method not allowed.');
  } catch (error) {
    console.error('API /bloggers/[id] error:', error);
    return jsonError(res, 500, 'Serverda xatolik yuz berdi.');
  }
}
