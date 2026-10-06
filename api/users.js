import { getAllUsers, saveUser, toggleUserActive, deleteUser } from '../src/db.js';

export function jsonError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const users = await getAllUsers();
      return res.json({ success: true, data: users });
    }

    if (req.method === 'POST') {
      const { username, name, role, password } = req.body || {};
      if (!username?.trim()) return jsonError(res, 400, 'Login (username) kiriting.');
      if (!password?.trim()) return jsonError(res, 400, 'Parol kiriting.');

      const saved = await saveUser({
        username: username.trim(),
        name: name?.trim() || username.trim(),
        role: role || 'manager',
        password: password.trim(),
        active: true,
      });

      return res.status(201).json({ success: true, data: saved });
    }

    if (req.method === 'PATCH') {
      const { username, active, role, name, password } = req.body || {};
      if (!username?.trim()) return jsonError(res, 400, 'Foydalanuvchi tanlanmadi.');

      if (active !== undefined) {
        await toggleUserActive(username.trim(), Boolean(active));
      }

      if (role || name || password) {
        await saveUser({
          username: username.trim(),
          name,
          role,
          password,
          active: active !== undefined ? Boolean(active) : true,
        });
      }

      return res.json({ success: true });
    }

    if (req.method === 'DELETE') {
      const username = String(req.query?.username || req.body?.username || '');
      if (!username.trim()) return jsonError(res, 400, 'Foydalanuvchi tanlanmadi.');
      if (username.toLowerCase() === 'mio') return jsonError(res, 400, 'Bosh adminni o‘chirib bo‘lmaydi.');

      await deleteUser(username.trim());
      return res.json({ success: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return jsonError(res, 405, 'Method not allowed.');
  } catch (error) {
    console.error('API /users error:', error);
    return jsonError(res, 500, 'Foydalanuvchilar bilan ishlashda xatolik yuz berdi.');
  }
}
