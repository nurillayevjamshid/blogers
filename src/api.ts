import { Blogger, CollaborationType, BrandType } from './types';

export async function fetchBloggersApi(): Promise<Blogger[]> {
  try {
    const res = await fetch('/api/bloggers');
    if (!res.ok) throw new Error('Failed to fetch bloggers');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching bloggers:', err);
    return [];
  }
}

export async function createBloggerApi(data: {
  nickname: string;
  date: string;
  collaborationType: CollaborationType;
  brand: BrandType;
  notes?: string;
  category?: string;
  manager?: string;
  time?: string;
  audience?: string;
}): Promise<{ success: boolean; data?: Blogger; error?: string }> {
  try {
    const res = await fetch('/api/bloggers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error('Error creating blogger:', err);
    return { success: false, error: err.message || 'Xatolik yuz berdi' };
  }
}

export async function completeBloggerApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bloggers/${id}/complete`, {
      method: 'PATCH',
    });
    return res.ok;
  } catch (err) {
    console.error('Error completing blogger:', err);
    return false;
  }
}

export async function reopenBloggerApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bloggers/${id}/reopen`, {
      method: 'PATCH',
    });
    return res.ok;
  } catch (err) {
    console.error('Error reopening blogger:', err);
    return false;
  }
}

export async function deleteBloggerApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bloggers/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting blogger:', err);
    return false;
  }
}

export async function resetDemoApi(): Promise<Blogger[]> {
  try {
    const res = await fetch('/api/reset-demo', {
      method: 'POST',
    });
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error resetting demo:', err);
    return [];
  }
}
