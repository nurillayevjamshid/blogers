export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  // This Vercel deployment is intentionally open: every visitor receives the admin session.
  return res.status(200).json({
    success: true,
    session: {
      username: 'jamshid',
      role: 'admin',
      token: 'vercel-open-admin-session',
    },
  });
}
