export type CollaborationType = 'barter' | 'paid';
export type BrandType = 'mio_beauty' | 'mio_home';
export type BloggerStatus = 'pending' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'advance';
export type Role = 'admin' | 'manager' | 'viewer';

export interface CollaborationHistoryItem {
  id: string;
  date: string;
  collaborationType: CollaborationType;
  brand: BrandType;
  status: BloggerStatus;
  createdAt: string;
  completedAt?: string | null;
  manager?: string;
  category?: string;
  time?: string;
  notes?: string;
  price?: number;
  paymentStatus?: PaymentStatus;
  blacklistReason?: string;
}

export interface Blogger {
  id: string;
  nickname: string;
  date: string;
  collaborationType: CollaborationType;
  brand: BrandType;
  status: BloggerStatus;
  createdAt: string;
  completedAt?: string | null;
  manager?: string;
  category?: string;
  time?: string;
  audience?: string;
  notes?: string;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  price?: number;
  paymentStatus?: PaymentStatus;
  history?: CollaborationHistoryItem[];
}

export interface StaffUser {
  username: string;
  name?: string;
  role: Role;
  active: boolean;
  password?: string;
  createdAt?: string;
}

export interface Session {
  username: string;
  role: Role;
  name?: string;
  token: string;
}
