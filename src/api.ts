import { Blogger, BrandType, CollaborationType, PaymentStatus, Session, StaffUser } from './types';

const KEY = 'mio_blogger_session';

const headers = () => {
  const s = getAuth();
  return {
    'Content-Type': 'application/json',
    ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
  };
};

export function getAuth(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function logoutAuth() {
  localStorage.removeItem(KEY);
}

export async function guestLoginApi(): Promise<{ success: boolean; session?: Session; error?: string }> {
  return { success: false, error: 'Avtomatik kirish yopiq.' };
}

export async function loginApi(username: string, password: string): Promise<{ success: boolean; session?: Session; error?: string }> {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '').trim();

  // Local fallback for super admin mio
  if (u === 'mio' && p === 'mio070') {
    const s: Session = { username: 'mio', role: 'admin', name: 'Bosh Admin', token: `mio-auth-token-${Date.now()}` };
    localStorage.setItem(KEY, JSON.stringify(s));
    return { success: true, session: s };
  }

  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const j = await r.json();
    if (j.session) localStorage.setItem(KEY, JSON.stringify(j.session));
    return j;
  } catch {
    return { success: false, error: 'Login yoki parol xato.' };
  }
}

export async function fetchBloggersApi(): Promise<Blogger[]> {
  const r = await fetch('/api/bloggers', { headers: headers() });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Ma’lumotlarni yuklashda xatolik yuz berdi.');
  return j.data || [];
}

export async function addBloggerApi(data: {
  nickname: string;
  date: string;
  collaborationType: CollaborationType;
  brand: BrandType;
  manager?: string;
  price?: number;
  paymentStatus?: PaymentStatus;
  category?: string;
  notes?: string;
}) {
  const r = await fetch('/api/bloggers', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return r.json() as Promise<{ success: boolean; data?: Blogger; error?: string }>;
}

export async function completeBloggerApi(id: string, historyId?: string) {
  const url = historyId ? `/api/bloggers/${id}/complete?historyId=${encodeURIComponent(historyId)}` : `/api/bloggers/${id}/complete`;
  const r = await fetch(url, { method: 'PATCH', headers: headers() });
  return r.ok;
}

export async function updateBloggerApi(
  id: string,
  data: Partial<Blogger> & { historyId?: string }
) {
  try {
    let r = await fetch(`/api/bloggers/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (r.status === 404 || r.status === 405) {
      r = await fetch(`/api/bloggers?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(data),
      });
    }
    const j = await r.json().catch(() => ({}));
    return { success: r.ok, error: j.error as string | undefined, data: j.data as Blogger | undefined };
  } catch {
    return { success: false, error: 'Server bilan bog‘lanib bo‘lmadi.' };
  }
}

export async function updateBlacklistApi(id: string, isBlacklisted: boolean, blacklistReason?: string) {
  try {
    let r = await fetch(`/api/bloggers/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ isBlacklisted, blacklistReason }),
    });
    if (r.status === 404 || r.status === 405) {
      r = await fetch(`/api/bloggers?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ isBlacklisted, blacklistReason }),
      });
    }
    const j = await r.json().catch(() => ({}));
    return { success: r.ok, error: j.error as string | undefined, data: j.data as Blogger | undefined };
  } catch {
    return { success: false, error: 'Server bilan bog‘lanib bo‘lmadi.' };
  }
}

export async function deleteBloggerApi(id: string) {
  try {
    let r = await fetch(`/api/bloggers/${id}`, { method: 'DELETE', headers: headers() });
    if (r.status === 404 || r.status === 405) {
      r = await fetch(`/api/bloggers?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers() });
    }
    const j = await r.json().catch(() => ({}));
    return { success: r.ok, error: j.error as string | undefined };
  } catch {
    return { success: false, error: 'Server bilan bog‘lanib bo‘lmadi.' };
  }
}

// User / Menejerlar API
export async function fetchUsersApi(): Promise<StaffUser[]> {
  const r = await fetch('/api/users', { headers: headers() });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Foydalanuvchilarni yuklashda xatolik.');
  return j.data || [];
}

export async function createUserApi(data: { username: string; name?: string; role: string; password: string }) {
  const r = await fetch('/api/users', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  const j = await r.json();
  return { success: r.ok, error: j.error as string | undefined, data: j.data as StaffUser | undefined };
}

export async function toggleUserActiveApi(username: string, active: boolean) {
  const r = await fetch('/api/users', {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ username, active }),
  });
  const j = await r.json();
  return { success: r.ok, error: j.error as string | undefined };
}

export async function deleteUserApi(username: string) {
  const r = await fetch(`/api/users?username=${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  const j = await r.json();
  return { success: r.ok, error: j.error as string | undefined };
}
