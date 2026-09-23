import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Calendar,
  Filter,
  ArrowUpRight,
  MoreVertical,
  Clock,
  Trash2,
  RotateCcw,
  Bell,
  Sparkles,
  Layers,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  Settings,
  X,
} from 'lucide-react';
import { Blogger, BrandType, CollaborationType } from '../types';
import { BrandLogo, MioMainBrand } from './BrandLogo';

interface BloggerTableViewProps {
  bloggers: Blogger[];
  onOpenAddModal: () => void;
  onCompleteBlogger: (id: string) => void;
  onReopenBlogger: (id: string) => void;
  onDeleteBlogger: (id: string) => void;
  onBackToBrandSelect: () => void;
  onOpenSettings?: () => void;
  currentBrand: BrandType;
  currentCollabType: CollaborationType;
}

type TabFilter = 'all' | 'pending';
type TimeFilter = 'today' | 'week' | 'all';

// Avatar gradient helper
const getAvatarColor = (name: string) => {
  const colors = [
    'from-rose-400 to-red-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-sky-400 to-blue-500',
    'from-indigo-400 to-purple-500',
    'from-pink-400 to-rose-500',
    'from-violet-400 to-purple-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const BloggerTableView: React.FC<BloggerTableViewProps> = ({
  bloggers,
  onOpenAddModal,
  onCompleteBlogger,
  onReopenBlogger,
  onDeleteBlogger,
  onBackToBrandSelect,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [historyBlogger, setHistoryBlogger] = useState<Blogger | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Helper: Format YYYY-MM-DD to DD.MM.YYYY
  const formatToDotDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. NOTIFICATION SYSTEM: Calculate bloggers pending for 5+ days without check
  const overdueBloggers = useMemo(() => {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return bloggers
      .filter((b) => b.status === 'pending' && !b.isBlacklisted)
      .map((b) => {
        const startDate = new Date(b.date || b.createdAt);
        const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const diffMs = todayMidnight - startMidnight;
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        return {
          ...b,
          diffDays,
          isOverdue: diffDays >= 5,
        };
      })
      .filter((item) => item.isOverdue)
      .sort((a, b) => b.diffDays - a.diffDays);
  }, [bloggers]);

  // 2. LIVE SEARCH & MULTI-FILTER PIPELINE
  const filteredBloggers = useMemo(() => {
    return bloggers.filter((blogger) => {
      // Qora ro'yxatdagi blogerlar ko'rsatilmasin
      if (blogger.isBlacklisted) return false;

      // 1. Tab filter:
      // 'all' tabida hamma ishlangan unikal blogerlar (har bir nickname 1 marta)
      // 'pending' tabida esa faqat navbatdagi ishlanayotgan blogerlar
      if (activeTab === 'pending' && blogger.status !== 'pending') return false;

      // 2. Brand filter
      if (brandFilter !== 'all' && blogger.brand !== brandFilter) return false;

      // 3. Time filter (Bugun / Haftalik / Barchasi)
      if (timeFilter !== 'all') {
        const itemDate = new Date(blogger.date || blogger.createdAt);
        const now = new Date();
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        if (timeFilter === 'today' && diffDays > 1.5) return false;
        if (timeFilter === 'week' && diffDays > 7.5) return false;
      }

      // 4. Real-time Search query across all relevant fields
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const cleanNick = blogger.nickname.toLowerCase().replace('@', '');
        const matchesNick = cleanNick.includes(query) || blogger.nickname.toLowerCase().includes(query);
        const matchesManager = blogger.manager?.toLowerCase().includes(query) || false;
        const matchesNotes = blogger.notes?.toLowerCase().includes(query) || false;
        const matchesHistory = blogger.history?.some((h) => 
          h.date.includes(query) || h.collaborationType.toLowerCase().includes(query) || (h.manager && h.manager.toLowerCase().includes(query)) || (h.notes && h.notes.toLowerCase().includes(query))
        ) || false;
        const matchesBrand =
          (blogger.brand === 'mio_beauty' && (query.includes('beauty') || query.includes('uxod') || query.includes('kosmetika'))) ||
          (blogger.brand === 'mio_home' && (query.includes('home') || query.includes('kir') || query.includes('idish') || query.includes('sovun')));

        if (!matchesNick && !matchesManager && !matchesNotes && !matchesBrand && !matchesHistory) {
          return false;
        }
      }

      return true;
    });
  }, [bloggers, activeTab, brandFilter, timeFilter, searchQuery]);

  // Counts for top tab badges
  const pendingCount = bloggers.filter((b) => b.status === 'pending' && !b.isBlacklisted).length;
  const allBloggersCount = bloggers.filter((b) => !b.isBlacklisted).length;
  const totalCount = bloggers.length;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#6878ea] via-[#7888f3] to-[#8f9efc] text-slate-800 p-2 sm:p-5 lg:p-8 flex flex-col justify-between selection:bg-[#F0826D]/30">
      
      {/* 1. TOP BRAND HEADER: MIO Rasmiy Logosi */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between py-2 px-3 mb-3 text-white">
        <MioMainBrand />

        {/* Current Date & Switch brand button & Sozlamalar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold border border-white/20">
            <Calendar className="w-3.5 h-3.5 text-white/80" />
            <span>Seshanba, 22-Sentabr, 2026</span>
          </div>

          <button
            type="button"
            onClick={onBackToBrandSelect}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-xs border border-white/20"
            title="Brendni o‘zgartirish"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Brendni almashtirish</span>
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-xs border border-white/20"
              title="Tizim sozlamalari"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sozlamalar</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN FLOATING SAAS CONTAINER */}
      <div className="w-full max-w-7xl mx-auto bg-[#F4F6F9] rounded-[32px] sm:rounded-[40px] shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/70 relative">
        <div className="w-full min-w-0">
          
          {/* TOP CONTROLS ROW */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            
            {/* Top Navigation Tabs: Faqat Barchasi (ishlanganlar) va Ishlanayotganlar */}
            <div className="flex items-center gap-1.5 p-1 bg-white/90 rounded-full border border-slate-200/80 shadow-xs text-xs font-bold text-slate-600 overflow-x-auto">
              {/* Barchasi (Hamma ishlangan blogerlar) */}
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F0826D]" />
                <span>Barchasi</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'all' ? 'bg-[#F0826D] text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {allBloggersCount}
                </span>
              </button>

              {/* Ishlanayotganlar */}
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Ishlanayotganlar</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {pendingCount}
                </span>
              </button>
            </div>

            {/* Action Tools: Live Search, 5-Day Alert Bell, Add Blogger */}
            <div className="flex items-center gap-2.5">
              
              {/* REAL-TIME SEARCH BAR */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bloger, mahsulot, menejer..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F0826D]/30 focus:border-[#F0826D] shadow-xs transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-[10px] cursor-pointer"
                    title="Tozalash"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 5-DAY CHECK NOTIFICATION BELL */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                    overdueBloggers.length > 0
                      ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 animate-pulse'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900'
                  }`}
                  title={`${overdueBloggers.length} ta bloger 5 kundan buyon tekshirilmagan!`}
                >
                  <Bell className="w-4 h-4" />
                  {overdueBloggers.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                      {overdueBloggers.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-40"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              Eslatma (5+ kun kutilganlar)
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              Hamkorlik boshlanganidan so‘ng 5 kun ichida tekshirish lozim
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200">
                          {overdueBloggers.length} ta
                        </span>
                      </div>

                      <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                        {overdueBloggers.length === 0 ? (
                          <div className="py-8 text-center text-slate-400">
                            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                            <p className="text-xs font-bold text-slate-700">Barcha blogerlar tekshirilgan!</p>
                            <p className="text-[11px] mt-0.5">5 kundan ortiq kechikkan hamkorliklar mavjud emas.</p>
                          </div>
                        ) : (
                          overdueBloggers.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-bold text-xs text-slate-900">
                                  {item.nickname}
                                </div>
                                <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                  ⚠️ {item.diffDays} kun oldin boshlangan ({item.date})
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {item.manager ? `Mas'ul: ${item.manager}` : (item.brand === 'mio_beauty' ? 'MIO Beauty' : 'MIO Home')}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => onCompleteBlogger(item.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors shrink-0"
                                title="Tekshirildi deb belgilash"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Tekshirildi</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ADD BLOGGER BUTTON */}
              <button
                type="button"
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm cursor-pointer transition-transform hover:scale-102 active:scale-98 shrink-0"
              >
                <Plus className="w-4 h-4 text-[#F0826D]" />
                <span>Bloger qo‘shish</span>
              </button>

            </div>
          </div>

          {/* SECOND SUB-HEADER ROW: Title & Action Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>Blogerlar Monitoringi</span>
                <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
                  {filteredBloggers.length} ta topildi
                </span>
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                MIO Beauty (Uxodoviy kosmetika) va MIO Home (Kir yuvish, idish va qo‘l vositalari)
              </p>
            </div>

            {/* Sub-Filters: Date & Brand */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Brand filter pill */}
              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold shadow-xs transition-colors cursor-pointer ${
                    brandFilter !== 'all'
                      ? 'bg-[#F0826D] text-white border-[#F0826D]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    {brandFilter === 'all'
                      ? 'Filtr'
                      : brandFilter === 'mio_beauty'
                      ? 'MIO Beauty'
                      : 'MIO Home'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {isFilterMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setBrandFilter('all');
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Barcha brendlar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBrandFilter('mio_beauty');
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Faqat MIO Beauty
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBrandFilter('mio_home');
                        setIsFilterMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Faqat MIO Home
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* MAIN DATA TABLE CARD */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100/90 overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Blogerlar Ro‘yxati
                </h3>

                {/* Time filter pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setTimeFilter('today')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      timeFilter === 'today'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Bugun
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('week')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      timeFilter === 'week'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Haftalik
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('all')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      timeFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Barchasi
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('all');
                    setSearchQuery('');
                    setBrandFilter('all');
                    setTimeFilter('all');
                  }}
                  className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                  title="Filtrlarni tozalash"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-14 text-center"># ID</th>
                    <th className="py-3.5 px-5">Bloger Nomi</th>
                    <th className="py-3.5 px-5">Sana</th>
                    <th className="py-3.5 px-5">Hamkorlik Turi</th>
                    <th className="py-3.5 px-5">Mas'ul Xodim</th>
                    {activeTab === 'pending' && (
                      <th className="py-3.5 px-5 text-right">Amallar</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredBloggers.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'pending' ? 6 : 5} className="py-16 text-center text-slate-400">
                        <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-slate-600">Mos keladigan blogerlar topilmadi</p>
                        <p className="text-xs mt-1">Qidiruv yoki filtr parametrlarini o‘zgartiring.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBloggers.map((blogger, index) => {
                      const avatarGradient = getAvatarColor(blogger.nickname);
                      const historyCount = blogger.history?.length || 1;

                      return (
                        <tr
                          key={blogger.id}
                          onClick={() => {
                            if (activeTab === 'all') {
                              setHistoryBlogger(blogger);
                            }
                          }}
                          className={`transition-colors group ${
                            activeTab === 'all'
                              ? 'hover:bg-[#FFF8F6]/80 cursor-pointer'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* 1. ID */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-bold">
                            {String(index + 1).padStart(2, '0')}
                          </td>

                          {/* 2. Bloger Nomi */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full bg-gradient-to-tr ${avatarGradient} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                              >
                                {blogger.nickname.replace('@', '').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#F0826D] transition-colors">
                                  {blogger.nickname}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {blogger.audience || '250k obunachi'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 3. Sana / Qayta ishlash soni */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            {activeTab === 'all' ? (
                              historyCount > 1 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHistoryBlogger(blogger);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-[#FFF0ED] text-slate-800 hover:text-[#E06D57] font-bold text-xs border border-slate-200/90 hover:border-[#F0826D]/40 transition-all cursor-pointer shadow-2xs group/btn"
                                  title="Barcha ishlangan sanalar tarixini ko‘rish"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#E06D57]" />
                                  <span>{historyCount} marta ishlangan</span>
                                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover/btn:text-[#E06D57]" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHistoryBlogger(blogger);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-[#FFF0ED] text-slate-700 hover:text-[#E06D57] font-semibold text-xs border border-slate-200/80 hover:border-[#F0826D]/30 transition-all cursor-pointer group/btn"
                                  title="Hamkorlik sanasi va ma’lumotlari"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#E06D57]" />
                                  <span>{formatToDotDate(blogger.date)}</span>
                                </button>
                              )
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatToDotDate(blogger.date)}</span>
                              </div>
                            )}
                          </td>

                          {/* 4. Hamkorlik Turi */}
                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
                                blogger.collaborationType === 'barter'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {blogger.collaborationType === 'barter' ? 'Barter' : 'Pulli'}
                            </span>
                          </td>

                          {/* 5. Mas'ul Xodim (Barchasi va Ishlanayotganlarda ko'rinadi) */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            {blogger.manager ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold border border-slate-200/90 shrink-0">
                                  <User className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                <span className="font-semibold text-slate-800 text-xs truncate max-w-[140px] sm:max-w-[180px]" title={blogger.manager}>
                                  {blogger.manager}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal italic text-[11px]">
                                — Belgilanmagan —
                              </span>
                            )}
                          </td>

                          {/* 6. Amallar (FAQAT Ishlanayotganlar tabida ko'rsatiladi!) */}
                          {activeTab === 'pending' && (
                            <td className="py-3.5 px-5 text-right">
                              <div
                                className="flex items-center justify-end gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Bajarildi (Check) */}
                                <button
                                  type="button"
                                  onClick={() => onCompleteBlogger(blogger.id)}
                                  className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                  title="Tekshirildi va bajarildi deb belgilash"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Bajarildi</span>
                                </button>

                                {/* Delete / Bekor qilish */}
                                <button
                                  type="button"
                                  onClick={() => onDeleteBlogger(blogger.id)}
                                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                  title="O‘chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 bg-slate-50/30">
              <div>
                Jami: <strong>{filteredBloggers.length} ta bloger</strong> {activeTab === 'all' ? 'ro‘yxatda' : 'ishlanmoqda'} (umumiy {totalCount} tadan)
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F0826D]"></span>
                  Barchasi: {allBloggersCount}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Ishlanmoqda: {pendingCount}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 3. HISTORY MODAL: Ishlangan sanalar va hamkorlik tarixi */}
      <AnimatePresence>
        {historyBlogger && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryBlogger(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 z-10 shadow-2xl max-h-[88vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarColor(
                      historyBlogger.nickname
                    )} text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}
                  >
                    {historyBlogger.nickname.replace('@', '').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {historyBlogger.nickname}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0ED] text-[#E06D57] border border-[#F0826D]/30">
                        {historyBlogger.history?.length || 1} marta ishlangan
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {historyBlogger.audience || '250k obunachi'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryBlogger(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="py-4 overflow-y-auto space-y-2.5 flex-1">
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Ishlangan sanalar va hamkorlik turi:
                </div>

                {(!historyBlogger.history || historyBlogger.history.length === 0) ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-800">
                          {formatToDotDate(historyBlogger.date)}
                        </span>
                        <span className="text-slate-300">—</span>
                        <span className="font-bold text-blue-600">
                          {historyBlogger.collaborationType === 'barter' ? 'Barter' : 'Pulli'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Bajarilgan
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-6">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Mas'ul xodim: <strong className="text-slate-700 font-semibold">{historyBlogger.manager || 'Belgilanmagan'}</strong></span>
                    </div>
                  </div>
                ) : (
                  historyBlogger.history.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-white text-slate-500 text-[10px] font-bold flex items-center justify-center border border-slate-200 shadow-2xs">
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatToDotDate(item.date)}</span>
                            <span className="text-slate-300">—</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                item.collaborationType === 'barter'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {item.collaborationType === 'barter' ? 'Barter' : 'Pulli'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status === 'completed' ? '✓ Bajarilgan' : '⏳ Jarayonda'}
                        </span>
                      </div>

                      {/* Mas'ul xodim display */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2 pl-7">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Mas'ul xodim: <strong className="text-slate-800 font-semibold">{item.manager || historyBlogger.manager || 'Belgilanmagan'}</strong></span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-slate-500 mt-1.5 pl-7 line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryBlogger(null)}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. BOTTOM MIO FOOTER */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between py-3 px-3 mt-4 text-white/90 text-xs font-medium gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>MIO Beauty & MIO Home | Rasmiy Hamkorlik Monitoring Tizimi</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="tracking-wide font-bold">miobeauty.uz</span>
          <span className="text-white/40">•</span>
          <span className="tracking-wide font-bold">miohome.uz</span>
        </div>
      </footer>
    </div>
  );
};
