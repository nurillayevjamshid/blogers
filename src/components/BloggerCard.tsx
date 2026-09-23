import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Calendar, Handshake, Wallet, Trash2, Clock, CheckCircle2, User } from 'lucide-react';
import { Blogger } from '../types';
import { BrandLogo } from './BrandLogo';

interface BloggerCardProps {
  blogger: Blogger;
  onComplete?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isCompletedView?: boolean;
}

export const BloggerCard: React.FC<BloggerCardProps> = ({
  blogger,
  onComplete,
  onDelete,
  isCompletedView = false,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleCheck = async () => {
    if (!onComplete || isChecking || blogger.status === 'completed') return;
    setIsChecking(true);
    await onComplete(blogger.id);
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    await onDelete(blogger.id);
  };

  const formatDate = (dateStr: string) => {
    try {
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const isCompleted = blogger.status === 'completed';
  const historyCount = blogger.history?.length || 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`relative p-5 sm:p-6 rounded-3xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-white/80 border-emerald-100 shadow-sm'
          : 'glass-card glass-card-hover border-white/80 hover:border-[#F0826D]/40'
      }`}
    >
      {/* Top row: Official Brand Logo Icon + Nickname & Quick Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Authentic Brand Emblem */}
          <div className="shrink-0" title={blogger.brand === 'mio_beauty' ? 'MIO Beauty' : 'MIO Home'}>
            <BrandLogo brand={blogger.brand} variant="icon" size="sm" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-mono truncate">
                {blogger.nickname}
              </h3>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Ishlangan</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
              <BrandLogo brand={blogger.brand} variant="inline" className="text-xs" />
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                {blogger.collaborationType === 'barter' ? (
                  <>
                    <Handshake className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-blue-600 font-semibold">Barter</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-indigo-600 font-semibold">Pulli</span>
                  </>
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Delete action button (hidden in completed view) */}
        {!isCompletedView && onDelete && !showConfirmDelete && (
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="text-slate-300 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50/70 transition-colors"
            title="O‘chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Delete confirmation inline */}
      {showConfirmDelete && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs flex items-center justify-between gap-2">
          <span className="text-rose-800 font-medium">O‘chirishni tasdiqlaysizmi?</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Yo‘q
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
            >
              Ha
            </button>
          </div>
        </div>
      )}

      {/* Date info & History */}
      <div className="mb-3">
        {historyCount > 1 ? (
          <div>
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{historyCount} marta ishlangan</span>
            </button>
            {showHistory && (
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <p className="font-bold text-slate-700 text-[11px] mb-1">Ishlangan sanalar:</p>
                {blogger.history?.map((h, i) => (
                  <div key={h.id || i} className="flex items-center justify-between text-slate-600">
                    <span className="font-medium">• {formatDate(h.date)}</span>
                    <span className="font-bold text-[10px] uppercase text-slate-500">
                      {h.collaborationType === 'barter' ? 'Barter' : 'Pulli'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Hamkorlik sanasi: {formatDate(blogger.date)}</span>
          </div>
        )}
      </div>

      {/* Mas'ul xodim */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-4">
        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Mas'ul xodim: <strong className="text-slate-800 font-semibold">{blogger.manager || 'Belgilanmagan'}</strong></span>
      </div>

      {/* Bottom row: Status and Check button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Bajarildi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              <Clock className="w-3 h-3 text-blue-500 animate-spin-slow" />
              Jarayonda
            </span>
          )}
        </div>

        {/* Check Button for in-progress tab */}
        {!isCompletedView && (
          <button
            type="button"
            onClick={handleCheck}
            disabled={isChecking || isCompleted}
            className={`group relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl border transition-all duration-200 font-semibold text-xs cursor-pointer ${
              isCompleted || isChecking
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'bg-white/80 hover:bg-blue-600 border-slate-200 hover:border-blue-600 text-slate-700 hover:text-white shadow-xs hover:shadow-md hover:shadow-blue-500/20'
            }`}
            title="Ishlangan deb belgilash"
          >
            <motion.div
              animate={isChecking ? { scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5"
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted || isChecking ? 'text-white' : 'text-slate-500 group-hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>{isChecking ? 'Belgilanmoqda...' : 'Tasdiqlash'}</span>
            </motion.div>
          </button>
        )}

        {isCompletedView && blogger.completedAt && (
          <span className="text-[11px] text-slate-400">
            Tasdiqlangan: {new Date(blogger.completedAt).toLocaleDateString('uz-UZ')}
          </span>
        )}
      </div>
    </motion.div>
  );
};
