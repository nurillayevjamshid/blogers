import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, CheckCircle2, Calendar, Handshake, Wallet, RotateCcw } from 'lucide-react';
import { Blogger } from '../types';
import { BloggerCard } from './BloggerCard';
import { BrandLogo } from './BrandLogo';

interface CompletedBloggersTabProps {
  bloggers: Blogger[];
  onDeleteBlogger: (id: string) => Promise<void>;
  onReopenBlogger?: (id: string) => Promise<void>;
}

type FilterOption = 'all' | 'barter' | 'paid' | 'mio_beauty' | 'mio_home';

export const CompletedBloggersTab: React.FC<CompletedBloggersTabProps> = ({
  bloggers,
  onDeleteBlogger,
  onReopenBlogger,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredBloggers = useMemo(() => {
    return bloggers.filter((blogger) => {
      // Nickname search (real-time, case-insensitive)
      const cleanSearch = searchTerm.trim().toLowerCase().replace(/^@/, '');
      const cleanNick = blogger.nickname.toLowerCase().replace(/^@/, '');
      const matchesSearch = cleanSearch === '' || cleanNick.includes(cleanSearch);

      // Category filter
      let matchesFilter = true;
      if (activeFilter === 'barter') matchesFilter = blogger.collaborationType === 'barter';
      if (activeFilter === 'paid') matchesFilter = blogger.collaborationType === 'paid';
      if (activeFilter === 'mio_beauty') matchesFilter = blogger.brand === 'mio_beauty';
      if (activeFilter === 'mio_home') matchesFilter = blogger.brand === 'mio_home';

      // Date filter
      let matchesDate = true;
      if (dateFilter) {
        matchesDate = blogger.date === dateFilter;
      }

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [bloggers, searchTerm, activeFilter, dateFilter]);

  return (
    <div className="space-y-6">
      {/* Header and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Blogerlar ro‘yxati
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
              {filteredBloggers.length} ta tasdiqlangan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Oldin ishlangan va tasdiqlangan blogerlar (Ishonchli baza)
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-3xl space-y-3.5 border border-white/80">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nickname qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200/90 rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                Tozalash
              </button>
            )}
          </div>

          {/* Date Picker Filter */}
          <div className="relative sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white/80 border border-slate-200/90 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              title="Sana bo‘yicha filter"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-[10px] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <span className="text-slate-400 text-xs font-medium mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            Hammasi
          </button>

          <button
            onClick={() => setActiveFilter('barter')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              activeFilter === 'barter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>Barter</span>
          </button>

          <button
            onClick={() => setActiveFilter('paid')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              activeFilter === 'paid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Pulli</span>
          </button>

          <button
            onClick={() => setActiveFilter('mio_beauty')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'mio_beauty'
                ? 'bg-[#F0826D] text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <BrandLogo brand="mio_beauty" variant="icon" size="xs" />
            <span>MIO Beauty</span>
          </button>

          <button
            onClick={() => setActiveFilter('mio_home')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'mio_home'
                ? 'bg-[#F0826D] text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <BrandLogo brand="mio_home" variant="icon" size="xs" />
            <span>MIO Home</span>
          </button>

          {(activeFilter !== 'all' || dateFilter !== '' || searchTerm !== '') && (
            <button
              onClick={() => {
                setActiveFilter('all');
                setDateFilter('');
                setSearchTerm('');
              }}
              className="ml-auto text-[11px] text-blue-600 hover:underline shrink-0 pl-2 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Filtrlarni bekor qilish
            </button>
          )}
        </div>
      </div>

      {/* Bloggers List Grid or Empty State */}
      {bloggers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-12 text-center border border-white/80"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Hozircha ishlangan blogerlar mavjud emas.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            "Ishlanayotgan blogerlar" bo‘limidagi blogerlarni tasdiqlaganingizdan so‘ng ular bu yerda saqlanadi.
          </p>
        </motion.div>
      ) : filteredBloggers.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/80">
          <p className="text-sm font-semibold text-slate-700 mb-1">
            Qidiruv natijalari bo‘yicha bloger topilmadi.
          </p>
          <p className="text-xs text-slate-400">
            Qidiruv so‘zini yoki tanlangan filtrlarni o‘zgartirib ko‘ring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredBloggers.map((blogger) => (
              <BloggerCard
                key={blogger.id}
                blogger={blogger}
                onDelete={onDeleteBlogger}
                isCompletedView={true}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
