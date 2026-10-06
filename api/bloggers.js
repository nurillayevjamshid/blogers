import {
  getAllBloggers,
  getBloggerById,
  findBloggerByNickname,
  saveOrUpdateBloggerRecord,
  deleteBlogger,
  normalizeNickname,
} from '../src/db.js';

export function jsonError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await getAllBloggers();
      return res.json({ success: true, data });
    }

    if (req.method === 'DELETE') {
      const id = String(req.query?.id || req.body?.id || '');
      if (!id) return jsonError(res, 400, 'Bloger ID topilmadi.');
      const blogger = await getBloggerById(id);
      if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');
      await deleteBlogger(id);
      return res.json({ success: true });
    }

    if (req.method === 'PATCH') {
      const id = String(req.query?.id || req.body?.id || '');
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

      if (!id) return jsonError(res, 400, 'Bloger ID topilmadi.');
      const blogger = await getBloggerById(id);
      if (!blogger) return jsonError(res, 404, 'Bloger topilmadi.');

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

          // Agar birinchi hamkorlik bo'lsa, blogger asosiy parametrlarini ham yangilaymiz
          if (blogger.history[0]?.id === historyId) {
            if (price !== undefined) blogger.price = Number(price);
            if (paymentStatus !== undefined) blogger.paymentStatus = paymentStatus;
          }
          await saveOrUpdateBloggerRecord(blogger);
          return res.json({ success: true, data: blogger });
        }
      }

      // 3. To'liq bloger tahriri
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

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
      return jsonError(res, 405, 'Method not allowed.');
    }

    const {
      nickname,
      date,
      collaborationType,
      brand,
      category,
      manager,
      time,
      audience,
      notes,
      price,
      paymentStatus,
    } = req.body || {};

    if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
      return jsonError(res, 400, "Bloger nickname'ini kiriting.");
    }
    if (!date) return jsonError(res, 400, 'Sanani tanlang.');

    const type = ['barter', 'paid'].includes(collaborationType) ? collaborationType : 'barter';
    const br = ['mio_beauty', 'mio_home'].includes(brand) ? brand : 'mio_beauty';
    const numPrice = type === 'paid' ? Number(price || 0) : 0;
    const payStatus = type === 'paid' ? (paymentStatus || 'pending') : 'paid';

    const normalized = normalizeNickname(nickname);
    const existing = await findBloggerByNickname(normalized);

    const now = new Date().toISOString();
    const newCollabItem = {
      id: `collab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date,
      collaborationType: type,
      brand: br,
      status: 'pending',
      category: category || undefined,
      manager: manager?.trim() || undefined,
      time: time || '14:30 (Story seriya)',
      notes: notes || undefined,
      price: numPrice,
      paymentStatus: payStatus,
      createdAt: now,
      completedAt: null,
    };

    if (existing) {
      if (existing.isBlacklisted) {
        return jsonError(res, 400, `Ushbu bloger qora ro‘yxatda (${existing.blacklistReason || 'sababsiz'}). Hamkorlik kiritib bo‘lmaydi.`);
      }
      existing.history = Array.isArray(existing.history) ? existing.history : [];
      existing.history.unshift(newCollabItem);
      Object.assign(existing, {
        date,
        collaborationType: type,
        brand: br,
        status: 'pending',
        completedAt: null,
        price: numPrice,
        paymentStatus: payStatus,
      });
      if (category !== undefined) existing.category = category || undefined;
      if (manager !== undefined) existing.manager = manager?.trim() || undefined;
      if (notes !== undefined) existing.notes = notes || undefined;
      if (audience) existing.audience = audience;
      await saveOrUpdateBloggerRecord(existing);
      return res.status(200).json({ success: true, data: existing, isRepeat: true });
    }

    const blogger = {
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nickname: normalized,
      date,
      collaborationType: type,
      brand: br,
      status: 'pending',
      category: category || undefined,
      manager: manager?.trim() || undefined,
      time: time || '14:30 (Story seriya)',
      audience: audience || '250k obunachi',
      notes: notes || undefined,
      price: numPrice,
      paymentStatus: payStatus,
      createdAt: now,
      completedAt: null,
      history: [newCollabItem],
    };
    await saveOrUpdateBloggerRecord(blogger);
    return res.status(201).json({ success: true, data: blogger, isRepeat: false });
  } catch (error) {
    console.error('API /bloggers error:', error);
    return jsonError(res, 500, 'Ma’lumotni saqlashda xatolik yuz berdi.');
  }
}
