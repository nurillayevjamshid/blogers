import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Ban,
  Archive,
  Users,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  ExternalLink,
  Instagram,
  UserPlus,
  TrendingUp,
  DollarSign,
  Lock,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { Blogger, CollaborationHistoryItem, Session, StaffUser, BrandType, CollaborationType, PaymentStatus } from './types';
import {
  fetchUsersApi,
  createUserApi,
  toggleUserActiveApi,
  deleteUserApi,
  updateBloggerApi,
  updateBlacklistApi,
  completeBloggerApi,
} from './api';
import mioHomeLogo from './assets/mio-home-logo.png';
import mioBeautyLogo from './assets/mio-beauty-logo.png';

interface AdminPanelProps {
  session: Session;
  bloggers: Blogger[];
  onBack: () => void;
  onRefreshBloggers: () => void;
}

export default function AdminPanel({ session, bloggers, onBack, onRefreshBloggers }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'finance' | 'managers'>('monitoring');
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [selectedBloggerForBlacklist, setSelectedBloggerForBlacklist] = useState<string>('');
  const [blacklistReason, setBlacklistReason] = useState<string>('');

  // Edit price/payment modal
  const [editingPayment, setEditingPayment] = useState<{
    bloggerId: string;
    historyId: string;
    nickname: string;
    price: number;
    paymentStatus: PaymentStatus;
  } | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    role: 'manager' as 'admin' | 'manager' | 'viewer',
    password: '',
  });
  const [userError, setUserError] = useState('');

  // Load users when managers tab is active
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const list = await fetchUsersApi();
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Helper date formatter: dd/mm/yyyy
  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Helper number formatter
  const formatMoney = (val?: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  // 1. REKLAMA VA BLOGERLAR NAZORATI DATA
  // Bugungi sana
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Kechikayotgan reklamalar: status === 'pending' va date < bugun
  const overdueCollaborations = useMemo(() => {
    const list: Array<{
      bloggerId: string;
      nickname: string;
      historyId: string;
      date: string;
      dateObj: Date;
      daysLate: number;
      brand: BrandType;
      collaborationType: CollaborationType;
      manager?: string;
      notes?: string;
    }> = [];

    bloggers.forEach((b) => {
      if (b.isBlacklisted) return;
      (b.history || []).forEach((h) => {
        if (h.status === 'pending' && h.date) {
          const parts = h.date.split('-');
          let d: Date;
          if (parts.length === 3) {
            d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else {
            d = new Date(h.date);
          }
          if (!isNaN(d.getTime()) && d < todayStart) {
            const diffTime = todayStart.getTime() - d.getTime();
            const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            list.push({
              bloggerId: b.id,
              nickname: b.nickname,
              historyId: h.id,
              date: h.date,
              dateObj: d,
              daysLate,
              brand: h.brand,
              collaborationType: h.collaborationType,
              manager: h.manager || b.manager,
              notes: h.notes,
            });
          }
        }
      });
    });

    return list.sort((a, b) => b.daysLate - a.daysLate);
  }, [bloggers, todayStart]);

  // Qora ro'yxatdagi blogerlar
  const blacklistedBloggers = useMemo(() => {
    return bloggers.filter((b) => b.isBlacklisted);
  }, [bloggers]);

  // Arxiv va tarix (barcha blogerlar va ularning yakunlangan hamkorliklari)
  const archiveBloggers = useMemo(() => {
    return bloggers.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        b.nickname.toLowerCase().includes(q) ||
        (b.manager && b.manager.toLowerCase().includes(q))
      );
    });
  }, [bloggers, searchQuery]);

  // 2. MOLIYA VA BYUDJET NAZORATI DATA
  const financeData = useMemo(() => {
    let beautyPaid = 0;
    let homePaid = 0;
    let totalPendingPay = 0;
    let barterCount = 0;

    const paidItems: Array<{
      bloggerId: string;
      nickname: string;
      historyId: string;
      date: string;
      brand: BrandType;
      price: number;
      paymentStatus: PaymentStatus;
      manager?: string;
      status: string;
    }> = [];

    bloggers.forEach((b) => {
      (b.history || []).forEach((h) => {
        if (h.collaborationType === 'paid') {
          const price = Number(h.price || 0);
          const payStatus = h.paymentStatus || 'pending';

          if (payStatus === 'paid' || payStatus === 'advance') {
            if (h.brand === 'mio_beauty') beautyPaid += price;
            if (h.brand === 'mio_home') homePaid += price;
          } else {
            totalPendingPay += price;
          }

          paidItems.push({
            bloggerId: b.id,
            nickname: b.nickname,
            historyId: h.id,
            date: h.date,
            brand: h.brand,
            price,
            paymentStatus: payStatus,
            manager: h.manager || b.manager,
            status: h.status,
          });
        } else if (h.collaborationType === 'barter') {
          barterCount += 1;
        }
      });
    });

    return {
      beautyPaid,
      homePaid,
      totalPaid: beautyPaid + homePaid,
      totalPendingPay,
      barterCount,
      paidItems: paidItems.sort((a, b) => (b.date > a.date ? 1 : -1)),
    };
  }, [bloggers]);

  // 3. MENEJERLAR HISOBOTI & REYTING DATA
  const managerStats = useMemo(() => {
    const map = new Map<string, {
      name: string;
      totalCollabs: number;
      beautyCount: number;
      homeCount: number;
      paidCount: number;
      barterCount: number;
      completedCount: number;
      pendingCount: number;
      totalBudget: number;
    }>();

    bloggers.forEach((b) => {
      (b.history || []).forEach((h) => {
        const mgr = (h.manager || b.manager || 'Tayinlanmagan').trim();
        if (!map.has(mgr)) {
          map.set(mgr, {
            name: mgr,
            totalCollabs: 0,
            beautyCount: 0,
            homeCount: 0,
            paidCount: 0,
            barterCount: 0,
            completedCount: 0,
            pendingCount: 0,
            totalBudget: 0,
          });
        }
        const stat = map.get(mgr)!;
        stat.totalCollabs += 1;
        if (h.brand === 'mio_beauty') stat.beautyCount += 1;
        if (h.brand === 'mio_home') stat.homeCount += 1;
        if (h.collaborationType === 'paid') {
          stat.paidCount += 1;
          stat.totalBudget += Number(h.price || 0);
        } else {
          stat.barterCount += 1;
        }
        if (h.status === 'completed') stat.completedCount += 1;
        else stat.pendingCount += 1;
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalCollabs - a.totalCollabs);
  }, [bloggers]);

  // ACTIONS
  // Complete an overdue collaboration directly
  const handleCompleteCollab = async (bloggerId: string, historyId: string) => {
    if (!confirm('Ushbu hamkorlikni "Bajarildi" deb belgilaysizmi?')) return;
    await completeBloggerApi(bloggerId, historyId);
    onRefreshBloggers();
  };

  // Blacklist blogger
  const handleAddToBlacklist = async () => {
    if (!selectedBloggerForBlacklist) return;
    const blogger = bloggers.find((b) => b.id === selectedBloggerForBlacklist || b.nickname.toLowerCase() === selectedBloggerForBlacklist.toLowerCase());
    if (!blogger) return;

    await updateBlacklistApi(blogger.id, true, blacklistReason.trim() || 'Sabab ko‘rsatilmadi');
    setShowBlacklistModal(false);
    setSelectedBloggerForBlacklist('');
    setBlacklistReason('');
    onRefreshBloggers();
  };

  // Remove from blacklist
  const handleRemoveFromBlacklist = async (bloggerId: string) => {
    if (!confirm('Ushbu blogerni qora ro‘yxatdan chiqarib, qayta tiklaysizmi?')) return;
    await updateBlacklistApi(bloggerId, false, '');
    onRefreshBloggers();
  };

  // Update payment status or price
  const handleSavePaymentEdit = async () => {
    if (!editingPayment) return;
    await updateBloggerApi(editingPayment.bloggerId, {
      historyId: editingPayment.historyId,
      price: Number(editingPayment.price || 0),
      paymentStatus: editingPayment.paymentStatus,
    });
    setEditingPayment(null);
    onRefreshBloggers();
  };

  // Quick cycle payment status
  const handleQuickPaymentStatus = async (bloggerId: string, historyId: string, currentStatus: PaymentStatus) => {
    const nextStatus: PaymentStatus =
      currentStatus === 'pending' ? 'advance' : currentStatus === 'advance' ? 'paid' : 'pending';
    await updateBloggerApi(bloggerId, {
      historyId,
      paymentStatus: nextStatus,
    });
    onRefreshBloggers();
  };

  // Add new staff user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    if (!newUser.username.trim() || !newUser.password.trim()) {
      return setUserError('Login va parolni kiriting.');
    }
    const res = await createUserApi({
      username: newUser.username.trim().toLowerCase(),
      name: newUser.name.trim() || newUser.username.trim(),
      role: newUser.role,
      password: newUser.password.trim(),
    });

    if (!res.success) {
      return setUserError(res.error || 'Foydalanuvchi yaratishda xatolik.');
    }

    setNewUser({ username: '', name: '', role: 'manager', password: '' });
    setShowAddUserModal(false);
    loadUsers();
  };

  // Toggle staff active/blocked
  const handleToggleActive = async (username: string, currentActive: boolean) => {
    await toggleUserActiveApi(username, !currentActive);
    loadUsers();
  };

  // Delete staff user
  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Haqiqatan ham "${username}" xodimini o‘chirmoqchimisiz?`)) return;
    await deleteUserApi(username);
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Asosiy panelga qaytish</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black tracking-wide text-slate-500 uppercase">
                Boshqaruv markazi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-black text-slate-900">{session.name || session.username}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Super Admin
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Title Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase text-white tracking-widest">
                Admin Panel
              </span>
              <span className="text-xs font-bold text-slate-400">MIO Boshqaruv & Monitoring</span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Tizim Boshqaruvi va Moliya
            </h1>
          </div>
        </div>

        {/* 3 Main Tab Buttons */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
              activeTab === 'monitoring'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`h-4 w-4 ${overdueCollaborations.length > 0 ? 'text-rose-400' : ''}`} />
            <span>1. Reklama & Nazorat</span>
            {overdueCollaborations.length > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {overdueCollaborations.length} kechikkan
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
              activeTab === 'finance'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>2. Moliya & Byudjet</span>
          </button>

          <button
            onClick={() => setActiveTab('managers')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
              activeTab === 'managers'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="h-4 w-4 text-indigo-400" />
            <span>3. Menejerlar Boshqaruvi</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {users.length} xodim
            </span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: REKLAMA VA BLOGERLAR NAZORATI (MONITORING) */}
        {/* ======================================================== */}
        {activeTab === 'monitoring' && (
          <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                    Kechikkan reklamalar
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-rose-900">{overdueCollaborations.length}</p>
                <p className="mt-1 text-xs text-rose-600">Sanasi o‘tgan, lekin yakunlanmagan</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Qora ro‘yxatdagilar
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Ban className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">{blacklistedBloggers.length}</p>
                <p className="mt-1 text-xs text-slate-400">Ishlash taqiqlangan blogerlar</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Barcha blogerlar
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Archive className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">{bloggers.length}</p>
                <p className="mt-1 text-xs text-slate-400">Tizimda qayd etilgan jami blogerlar</p>
              </div>
            </div>

            {/* SECTION 1: KECHIKAYOTGAN REKLAMALAR (QIZIL RO'YXAT) */}
            <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black text-rose-900">
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                    Kechikayotgan Reklamalar Nazorati
                  </h2>
                  <p className="text-xs text-slate-500">
                    Belgilangan sanasi o‘tib ketgan, lekin hali "Bajarildi" belgilanmagan reklamalar
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 self-start sm:self-auto">
                  {overdueCollaborations.length} ta kechikish aniqlandi
                </span>
              </div>

              {overdueCollaborations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-sm font-bold text-emerald-800">
                    Ajoyib! Hozirda hech qanday kechikkan reklama yo‘q.
                  </p>
                  <p className="text-xs text-emerald-600">Barcha reklamalar o‘z vaqtida bajarilmoqda.</p>
                </div>
              ) : (
                <div className="divide-y divide-rose-100">
                  {overdueCollaborations.map((item) => (
                    <div
                      key={item.historyId}
                      className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-rose-50/40 rounded-xl px-2 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold text-xs">
                          ⚠️ {item.daysLate}k
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://instagram.com/${item.nickname.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-black text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                            >
                              {item.nickname}
                              <ExternalLink className="h-3 w-3 text-slate-400" />
                            </a>
                            <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800">
                              {item.daysLate} kun kechikdi
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">
                              Sana: {formatDateDisplay(item.date)}
                            </span>
                            <span>•</span>
                            <span>Menejer: <strong className="text-slate-800">{item.manager || 'Noma‘lum'}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <img
                                src={item.brand === 'mio_beauty' ? mioBeautyLogo : mioHomeLogo}
                                alt="brand"
                                className="h-3.5 w-3.5 object-contain"
                              />
                              {item.brand === 'mio_beauty' ? 'MIO Beauty' : 'MIO Home'}
                            </span>
                            <span>•</span>
                            <span className="uppercase text-[10px] font-bold text-slate-600">
                              {item.collaborationType === 'paid' ? 'Pullik' : 'Barter'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleCompleteCollab(item.bloggerId, item.historyId)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Bajarildi deb belgilash</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: QORA RO'YXAT (BLACKLIST) BOSHQARUVI */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <Ban className="h-5 w-5 text-slate-700" />
                    Qora Ro‘yxat (Blacklist) Boshqaruvi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Reklamani bajarmagan, pulni olib yo‘qolgan yoki sifatsiz blogerlarni nazorat qilish
                  </p>
                </div>
                <button
                  onClick={() => setShowBlacklistModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Qora ro‘yxatga qo‘shish</span>
                </button>
              </div>

              {blacklistedBloggers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-500">Qora ro‘yxatda hech kim yo‘q.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {blacklistedBloggers.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 px-2 rounded-xl transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{b.nickname}</span>
                          <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            BLOKLANGAN
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-rose-700 font-medium">
                          <strong>Sabab:</strong> {b.blacklistReason || 'Sabab ko‘rsatilmagan'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveFromBlacklist(b.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition self-start sm:self-auto"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Ro‘yxatdan chiqarish (Oqlash)</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 3: ARXIV VA HAMKORLIKLAR TARIXI */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <Archive className="h-5 w-5 text-indigo-600" />
                    Hamkorliklar Tarixi va Arxiv
                  </h2>
                  <p className="text-xs text-slate-500">
                    Har bir bloger bilan necha marta, qaysi brendlar bilan ishlanganini to‘liq ko‘rish
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nickname yoki menejer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {archiveBloggers.map((b) => {
                  const history = b.history || [];
                  const beautyCount = history.filter((h) => h.brand === 'mio_beauty').length;
                  const homeCount = history.filter((h) => h.brand === 'mio_home').length;

                  return (
                    <div key={b.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{b.nickname}</span>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700">
                            {history.length} marta hamkorlik
                          </span>
                          {b.isBlacklisted && (
                            <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                              Qora ro‘yxatda
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>MIO Beauty: <strong>{beautyCount}</strong></span>
                          <span>•</span>
                          <span>MIO Home: <strong>{homeCount}</strong></span>
                        </div>
                      </div>

                      {/* Hamkorliklar ketma-ketligi */}
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {history.map((h, idx) => (
                          <div
                            key={h.id || idx}
                            className={`rounded-lg border p-2.5 text-xs ${
                              h.status === 'completed'
                                ? 'border-slate-200 bg-white text-slate-700'
                                : 'border-amber-200 bg-amber-50/50 text-amber-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-bold">
                                <img
                                  src={h.brand === 'mio_beauty' ? mioBeautyLogo : mioHomeLogo}
                                  alt="brand"
                                  className="h-3 w-3 object-contain"
                                />
                                {h.brand === 'mio_beauty' ? 'MIO Beauty' : 'MIO Home'}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase ${
                                  h.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {h.status === 'completed' ? 'Bajarildi' : 'Jarayonda'}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Sana: {formatDateDisplay(h.date)}</span>
                              <span className="font-medium text-slate-700">
                                {h.collaborationType === 'paid' ? `Pullik (${formatMoney(h.price)})` : 'Barter'}
                              </span>
                            </div>
                            {h.manager && (
                              <p className="mt-1 text-[10px] text-slate-400">
                                Menejer: <span className="font-semibold text-slate-600">{h.manager}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MOLIYA VA BYUDJET NAZORATI */}
        {/* ======================================================== */}
        {activeTab === 'finance' && (
          <div className="space-y-8">
            {/* 4 Financial Indicator Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-700">
                    MIO Beauty Xarajati
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100">
                    <img src={mioBeautyLogo} alt="Beauty" className="h-5 w-5 object-contain" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-pink-950">{formatMoney(financeData.beautyPaid)}</p>
                <p className="mt-1 text-xs text-pink-700">Pullik reklamalarga to‘langan</p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-700">
                    MIO Home Xarajati
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
                    <img src={mioHomeLogo} alt="Home" className="h-5 w-5 object-contain" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-sky-950">{formatMoney(financeData.homePaid)}</p>
                <p className="mt-1 text-xs text-sky-700">Pullik reklamalarga to‘langan</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                    Jami To‘langan Summa
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-emerald-950">{formatMoney(financeData.totalPaid)}</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Kutilmoqda: <strong>{formatMoney(financeData.totalPendingPay)}</strong>
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Barter Mahsulotlar
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-amber-950">{financeData.barterCount} ta</p>
                <p className="mt-1 text-xs text-amber-700">Barter orqali berilgan mahsulotlar</p>
              </div>
            </div>

            {/* Pullik blogerlar narxi va to'lov holati jadvali */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Blogerlar Narxi va To‘lov Holati
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pullik blogerlarning kelishilgan summasi va to‘lov statusini boshqarish
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                    🟡 Kutilmoqda
                  </span>
                  <span className="flex items-center gap-1 font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
                    🔵 Avans
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    🟢 To‘landi
                  </span>
                </div>
              </div>

              {financeData.paidItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-500">Hozircha pullik hamkorliklar mavjud emas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Bloger</th>
                        <th className="pb-3">Brend</th>
                        <th className="pb-3">Sana</th>
                        <th className="pb-3">Menejer</th>
                        <th className="pb-3">Narx (Kelishilgan)</th>
                        <th className="pb-3">To‘lov Holati</th>
                        <th className="pb-3 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {financeData.paidItems.map((item) => (
                        <tr key={item.historyId} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-black text-slate-900">
                            <a
                              href={`https://instagram.com/${item.nickname.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-indigo-600 flex items-center gap-1"
                            >
                              {item.nickname}
                              <ExternalLink className="h-3 w-3 text-slate-400" />
                            </a>
                          </td>
                          <td className="py-3">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <img
                                src={item.brand === 'mio_beauty' ? mioBeautyLogo : mioHomeLogo}
                                alt="brand"
                                className="h-3.5 w-3.5 object-contain"
                              />
                              {item.brand === 'mio_beauty' ? 'Beauty' : 'Home'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600">{formatDateDisplay(item.date)}</td>
                          <td className="py-3 font-semibold text-slate-700">{item.manager || '-'}</td>
                          <td className="py-3 font-black text-slate-900">
                            {formatMoney(item.price)}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleQuickPaymentStatus(item.bloggerId, item.historyId, item.paymentStatus)}
                              title="Holatni almashtirish uchun bosing"
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase transition ${
                                item.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : item.paymentStatus === 'advance'
                                  ? 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              {item.paymentStatus === 'paid'
                                ? '🟢 To‘landi'
                                : item.paymentStatus === 'advance'
                                ? '🔵 Avans berildi'
                                : '🟡 To‘lov kutilmoqda'}
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() =>
                                setEditingPayment({
                                  bloggerId: item.bloggerId,
                                  historyId: item.historyId,
                                  nickname: item.nickname,
                                  price: item.price,
                                  paymentStatus: item.paymentStatus,
                                })
                              }
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                            >
                              Narxni o‘zgartirish
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MENEJERLAR (XODIMLAR) BOSHQARUVI */}
        {/* ======================================================== */}
        {activeTab === 'managers' && (
          <div className="space-y-8">
            {/* SECTION 1: XODIMLAR RO'YXATI VA QO'SHISH */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Menejerlar va Xodimlar Ro‘yxati
                  </h2>
                  <p className="text-xs text-slate-500">
                    Yangi xodimlarga login-parol berish, kirish huquqini bloklash yoki o‘chirish
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition self-start sm:self-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Yangi menejer qo‘shish</span>
                </button>
              </div>

              {loadingUsers ? (
                <p className="text-xs text-slate-400 py-4">Xodimlar ro‘yxati yuklanmoqda...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Ism va Login</th>
                        <th className="pb-3">Roli</th>
                        <th className="pb-3">Parol</th>
                        <th className="pb-3">Holati</th>
                        <th className="pb-3 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Bosh admin mio satri */}
                      <tr className="bg-slate-50/70">
                        <td className="py-3">
                          <p className="font-black text-slate-900">Bosh Admin (MIO)</p>
                          <p className="text-[10px] text-slate-400 font-mono">login: mio</p>
                        </td>
                        <td className="py-3">
                          <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-800 uppercase">
                            Super Admin
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-500">mio070</td>
                        <td className="py-3">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Faol (Asosiy)
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-400 text-[10px] font-bold">
                          O‘zgarmas
                        </td>
                      </tr>

                      {users.map((u) => (
                        <tr key={u.username} className="hover:bg-slate-50 transition">
                          <td className="py-3">
                            <p className="font-bold text-slate-900">{u.name || u.username}</p>
                            <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'manager'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Menejer' : 'Kuzatuvchi'}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-600">
                            {u.password || '••••••••'}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleToggleActive(u.username, u.active)}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                                u.active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                            >
                              {u.active ? '🟢 Faol' : '🔴 Bloklangan'}
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleActive(u.username, u.active)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                  u.active
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {u.active ? 'Bloklash' : 'Faollashtirish'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.username)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Xodimni o‘chirish"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 2: MENEJERLAR SAMARADORLIGI VA REYTINGI */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Menejerlar Samaradorligi va Reytingi
                </h2>
                <p className="text-xs text-slate-500">
                  Kim qancha bloger bilan kelishdi, brendlar taqsimoti va sarflangan byudjet
                </p>
              </div>

              {managerStats.length === 0 ? (
                <p className="text-xs text-slate-400">Statistika mavjud emas.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {managerStats.map((mgr, index) => {
                    const isTop1 = index === 0;
                    return (
                      <div
                        key={mgr.name}
                        className={`rounded-2xl border p-5 transition ${
                          isTop1
                            ? 'border-amber-300 bg-gradient-to-br from-amber-50/60 to-white shadow-md'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-xs ${
                                index === 0
                                  ? 'bg-amber-400 text-slate-900'
                                  : index === 1
                                  ? 'bg-slate-300 text-slate-800'
                                  : index === 2
                                  ? 'bg-amber-700/30 text-amber-900'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              #{index + 1}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm">{mgr.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">
                                {isTop1 ? '🏆 Eng faol menejer' : 'Menejer'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xl font-black text-slate-900">
                            {mgr.totalCollabs} <span className="text-xs font-normal text-slate-500">ta</span>
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-slate-50 p-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">MIO Beauty</span>
                            <p className="font-black text-slate-800">{mgr.beautyCount} ta</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">MIO Home</span>
                            <p className="font-black text-slate-800">{mgr.homeCount} ta</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Barter / Pullik</span>
                            <p className="font-black text-slate-800">{mgr.barterCount} / {mgr.paidCount}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Bajarildi / Kutilmoqda</span>
                            <p className="font-black text-slate-800">{mgr.completedCount} / {mgr.pendingCount}</p>
                          </div>
                        </div>

                        {mgr.totalBudget > 0 && (
                          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs">
                            <span className="text-emerald-700 font-bold">Jami byudjet:</span>
                            <span className="font-black text-emerald-900">{formatMoney(mgr.totalBudget)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: YANGI MENEJER QO'SHISH */}
      {/* ======================================================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Yangi Xodim / Menejer Qo‘shish</h3>
              <button onClick={() => setShowAddUserModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">F.I.Sh (Ismi)</label>
                <input
                  type="text"
                  placeholder="Masalan: Jamshid Nurillayev"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Login (Username)</label>
                <input
                  type="text"
                  placeholder="Masalan: jamshid"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Parol</label>
                <input
                  type="text"
                  placeholder="Masalan: mio12345"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Roli</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="manager">Menejer (Blogerlarni kiritish va ko‘rish)</option>
                  <option value="admin">Admin (To‘liq huquqlar)</option>
                  <option value="viewer">Kuzatuvchi (Faqat ko‘rish)</option>
                </select>
              </div>

              {userError && <p className="text-xs font-bold text-rose-600">{userError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Xodimni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: QORA RO'YXATGA QO'SHISH */}
      {/* ======================================================== */}
      {showBlacklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-rose-900 flex items-center gap-2">
                <Ban className="h-5 w-5 text-rose-600" />
                Qora Ro‘yxatga Kiritish
              </h3>
              <button onClick={() => setShowBlacklistModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Blogerni tanlang</label>
                <select
                  value={selectedBloggerForBlacklist}
                  onChange={(e) => setSelectedBloggerForBlacklist(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
                >
                  <option value="">Blogerni tanlang...</option>
                  {bloggers
                    .filter((b) => !b.isBlacklisted)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nickname} {b.manager ? `(${b.manager})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Sababini yozing</label>
                <textarea
                  rows={3}
                  placeholder="Masalan: Reklamani vaqtida qilmadi, xabarlarga javob bermayapti yoki nakrutka aniqlandi..."
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlacklistModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddToBlacklist}
                  disabled={!selectedBloggerForBlacklist}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Qora Ro‘yxatga Tiqish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: NARX VA TO'LOV TAHRIRI */}
      {/* ======================================================== */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                To‘lov Ma‘lumotlarini O‘zgartirish
              </h3>
              <button onClick={() => setEditingPayment(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500">Bloger:</p>
                <p className="font-black text-slate-900 text-sm">{editingPayment.nickname}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Kelishilgan Narx (so‘m)</label>
                <input
                  type="number"
                  value={editingPayment.price}
                  onChange={(e) => setEditingPayment({ ...editingPayment, price: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">To‘lov Holati</label>
                <select
                  value={editingPayment.paymentStatus}
                  onChange={(e) => setEditingPayment({ ...editingPayment, paymentStatus: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                >
                  <option value="pending">🟡 To‘lov kutilmoqda</option>
                  <option value="advance">🔵 Avans berildi</option>
                  <option value="paid">🟢 To‘landi</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingPayment(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSavePaymentEdit}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
