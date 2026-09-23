import React from 'react';
import { motion } from 'motion/react';
import { Handshake, Wallet, Clock, CheckCircle2, Users, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { CollaborationType, BrandType, DashboardStats } from '../types';
import { BrandLogo } from './BrandLogo';

interface DashboardHeaderProps {
  collaborationType: CollaborationType;
  brand: BrandType;
  stats: DashboardStats;
  onOpenSettings: () => void;
  onChangeContext: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  collaborationType,
  brand,
  stats,
  onOpenSettings,
  onChangeContext,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="space-y-6 mb-8">
      {/* Top Header Bar */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Active Brand Official Logo */}
          <div className="shrink-0">
            <BrandLogo brand={brand} variant="square" size="sm" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {brand === 'mio_beauty' ? 'MIO Beauty' : 'MIO Home'} Blogerlari
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60">
                {stats.totalCount} ta
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Blogerlar bilan hamkorlik monitoringi va tasdiqlangan ro‘yxat
            </p>
          </div>
        </div>

        {/* Selected Context Badges & Quick Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Official Brand Badge */}
          <BrandLogo brand={brand} variant="badge" />

          {/* Collaboration Type Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl glass-card text-xs font-semibold border-slate-200/80 shadow-xs">
            {collaborationType === 'barter' ? (
              <>
                <Handshake className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-slate-800">Barter</span>
              </>
            ) : (
              <>
                <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-800">Pulli</span>
              </>
            )}
          </div>

          {/* Change Context Button */}
          <button
            type="button"
            onClick={onChangeContext}
            className="p-2 rounded-2xl glass-card hover:bg-white text-slate-600 hover:text-blue-600 border-slate-200/80 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title="Kategoriya yoki brendni almashtirish"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">O‘zgartirish</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-2xl glass-card hover:bg-white text-slate-600 hover:text-blue-600 border-slate-200/80 transition-colors cursor-pointer"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Settings / Profile Icon */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-2xl glass-card hover:bg-white text-slate-600 hover:text-blue-600 border-slate-200/80 transition-colors cursor-pointer"
            title="Sozlamalar"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#F0826D] to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
              M
            </div>
          </button>
        </div>
      </div>

      {/* DASHBOARD STATISTIKA: 3 ta Katta Glassmorphism Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Jarayondagi blogerlar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-5 rounded-3xl border border-white/80 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Jarayondagi blogerlar
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.pendingCount}
            </h3>
            <span className="text-[11px] text-blue-600 font-medium mt-0.5 inline-block">
              Hozir ish olib borilmoqda
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6 stroke-[1.8]" />
          </div>
        </motion.div>

        {/* Stat 2: Ishlangan blogerlar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-5 rounded-3xl border border-white/80 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Ishlangan blogerlar
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.completedCount}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 inline-block">
              Tasdiqlangan va ishonchli
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
          </div>
        </motion.div>

        {/* Stat 3: Jami blogerlar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel p-5 rounded-3xl border border-white/80 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Jami blogerlar
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalCount}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 inline-block">
              {stats.barterCount} Barter · {stats.paidCount} Pulli
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6 stroke-[1.8]" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
