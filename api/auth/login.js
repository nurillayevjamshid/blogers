import { AUTH_CONFIG } from '../../src/login.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const { username, password } = req.body || {};

  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  if (cleanUser === AUTH_CONFIG.username && cleanPass === AUTH_CONFIG.password) {
    return res.status(200).json({
      success: true,
      session: {
        username: AUTH_CONFIG.username,
        role: AUTH_CONFIG.role,
        token: `mio-auth-token-${Date.now()}`,
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Login yoki parol xato.',
  });
}
