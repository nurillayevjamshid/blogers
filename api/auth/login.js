import { AUTH_CONFIG } from '../../src/login.js';
import { findUser } from '../../src/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const { username, password } = req.body || {};

  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  // 1. Super Admin (mio / mio070)
  if (cleanUser === AUTH_CONFIG.username && cleanPass === AUTH_CONFIG.password) {
    return res.status(200).json({
      success: true,
      session: {
        username: AUTH_CONFIG.username,
        name: 'Bosh Admin (MIO)',
        role: AUTH_CONFIG.role,
        token: `mio-auth-token-${Date.now()}`,
      },
    });
  }

  // 2. Database Users (menejerlar)
  try {
    const user = await findUser(cleanUser);
    if (user && user.active) {
      const isMatch = (user.password && user.password === cleanPass) ||
                      (user.password_hash && user.password_hash === cleanPass);
      if (isMatch) {
        return res.status(200).json({
          success: true,
          session: {
            username: user.username,
            name: user.name || user.username,
            role: user.role,
            token: `token-${user.username}-${Date.now()}`,
          },
        });
      }
    }
  } catch (err) {
    console.error('Login DB check error:', err);
  }

  return res.status(401).json({
    success: false,
    error: 'Login yoki parol xato.',
  });
}
