import React from 'react';
import { Calendar, Check, Clock, Trash2, User } from 'lucide-react';
import { Blogger } from '../types';

interface MobileBloggerCardProps {
  blogger: Blogger;
  index: number;
  isPendingView: boolean;
  onOpenHistory: (blogger: Blogger) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('T')[0].split('-');
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dateStr;
};

const getAvatarColor = (name: string) => {
  const colors = [
    'from-rose-400 to-red-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-sky-400 to-blue-500',
    'from-indigo-400 to-purple-500',
    'from-pink-400 to-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const MobileBloggerCard: React.FC<MobileBloggerCardProps> = ({
  blogger,
  index,
  isPendingView,
  onOpenHistory,
  onComplete,
  onDelete,
}) => {
  const isBarter = blogger.collaborationType === 'barter';
  const isClickable = !isPendingView;

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        isClickable ? 'cursor-pointer border-slate-200 hover:border-[#F0826D]/40 hover:bg-[#FFF8F6]/70' : 'border-slate-200/90'
      }`}
      onClick={() => isClickable && onOpenHistory(blogger)}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${getAvatarColor(blogger.nickname)} text-xs font-bold text-white`}>
            {blogger.nickname.replace('@', '').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="break-all text-sm font-extrabold leading-5 text-slate-900">{blogger.nickname}</h4>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">ID #{String(index + 1).padStart(2, '0')}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${isBarter ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
          {isBarter ? 'Barter' : 'Pulli'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 text-xs text-slate-600">
        <div className="flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-semibold">Sana:</span>
          <span className="truncate">{formatDate(blogger.date)}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-semibold">Mas’ul:</span>
          <span className="min-w-0 break-words font-bold text-slate-800">{blogger.manager || 'Belgilanmagan'}</span>
        </div>
      </div>

      {isPendingView && (
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onComplete(blogger.id);
            }}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Check className="h-4 w-4" />
            Bajarildi
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(blogger.id);
            }}
            className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            aria-label="O‘chirish"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {!isPendingView && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>Tarixni ko‘rish uchun bosing</span>
        </div>
      )}
    </article>
  );
};

export default MobileBloggerCard;


