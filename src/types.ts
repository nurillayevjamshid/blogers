export type CollaborationType = 'barter' | 'paid';
export type BrandType = 'mio_beauty' | 'mio_home';
export type BloggerStatus = 'pending' | 'completed';

export interface CollaborationHistoryItem {
  id: string;
  date: string;
  collaborationType: CollaborationType;
  brand: BrandType;
  status: BloggerStatus;
  createdAt: string;
  completedAt?: string | null;
  notes?: string;
  category?: string;
  manager?: string;
  time?: string;
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
  notes?: string;
  category?: string;
  manager?: string;
  time?: string;
  audience?: string;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  history?: CollaborationHistoryItem[];
}

export type StepView = 'collaboration_select' | 'brand_select' | 'dashboard';
export type ActiveTab = 'pending' | 'completed';
export type NavigationTab = 'dashboard' | 'bloggers' | 'settings';

export interface DashboardStats {
  pendingCount: number;
  completedCount: number;
  totalCount: number;
  barterCount: number;
  paidCount: number;
  beautyCount: number;
  homeCount: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
