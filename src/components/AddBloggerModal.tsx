import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  AtSign,
  User,
  Clock,
  Sparkles,
  Handshake,
  Wallet,
  AlertCircle,
  Plus,
  UserPlus,
} from 'lucide-react';
import { CollaborationType, BrandType, Blogger } from '../types';
import { BrandLogo } from './BrandLogo';

interface AddBloggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: CollaborationType;
  defaultBrand: BrandType;
  existingBloggers: Blogger[];
  onAddBlogger: (data: {
    nickname: string;
    date: string;
    collaborationType: CollaborationType;
    brand: BrandType;
    notes?: string;
    manager?: string;
    time?: string;
    audience?: string;
  }) => Promise<boolean>;
}

const TIME_SLOTS = [
  '11:00 (Reels / Post)',
  '14:30 (Story seriya)',
  '18:00 (Obzor / Review)',
  '20:00 (Prime time)',
];

export const AddBloggerModal: React.FC<AddBloggerModalProps> = ({
  isOpen,
  onClose,
  defaultType,
  defaultBrand,
  existingBloggers,
  onAddBlogger,
}) => {
  const [nickname, setNickname] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState(TIME_SLOTS[1]);
  const [collaborationType, setCollaborationType] = useState<CollaborationType>(defaultType);
  const [brand, setBrand] = useState<BrandType>(defaultBrand);

  // Managers management: Initially empty ("hozircha hech kim bo'lmasin"), with ability to add new
  const [managers, setManagers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mio_staff_managers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [manager, setManager] = useState('');
  const [isAddingNewManager, setIsAddingNewManager] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');

  const [audience, setAudience] = useState('250k obunachi');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNickname('');
      const today = new Date();
      setDate(today.toISOString().split('T')[0]);
      setTime(TIME_SLOTS[1]);
      setCollaborationType(defaultType);
      setBrand(defaultBrand);
      setManager('');
      setIsAddingNewManager(false);
      setNewManagerName('');
      setAudience('250k obunachi');
      setNotes('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultType, defaultBrand]);

  const handleAddManager = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newManagerName.trim();
    if (!trimmed) return;

    let updated = managers;
    if (!managers.includes(trimmed)) {
      updated = [...managers, trimmed];
      setManagers(updated);
      try {
        localStorage.setItem('mio_staff_managers', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving managers:', err);
      }
    }

    setManager(trimmed);
    setNewManagerName('');
    setIsAddingNewManager(false);
  };

  const cleanKey = nickname.trim().replace(/^@+/, '').toLowerCase();
  const existingMatch = existingBloggers.find(
    (b) => b.nickname.replace(/^@+/, '').toLowerCase() === cleanKey && cleanKey.length > 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNick = nickname.trim().replace(/^@+/, '');
    if (!cleanNick) {
      setError("Iltimos, bloger nickname'ini kiriting.");
      return;
    }

    if (!date) {
      setError('Iltimos, hamkorlik sanasini belgilang.');
      return;
    }

    if (existingMatch?.isBlacklisted) {
      setError('Ushbu bloger qora ro‘yxatda. Hamkorlik kiritib bo‘lmaydi.');
      return;
    }

    const formattedNick = `@${cleanNick}`;

    setIsSubmitting(true);
    const success = await onAddBlogger({
      nickname: formattedNick,
      date,
      collaborationType,
      brand,
      notes: notes.trim() || undefined,
      manager: manager.trim() || undefined,
      time,
      audience,
    });
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 z-10 shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Yangi bloger hamkorligini qo‘shish
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  MIO Beauty yoki MIO Home mahsulotlari uchun hamkorlik parametrlarini kiriting
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Bloger Nickname & Sana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bloger nikneymi (@)
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="madina_beauty"
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F0826D]/30 transition-all ${
                        existingMatch
                          ? 'border-indigo-300 bg-indigo-50/30'
                          : 'border-slate-200 focus:border-[#F0826D]'
                      }`}
                      autoFocus
                    />
                  </div>
                  {existingMatch && (
                    <div className="mt-1.5 p-2 rounded-xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-700 font-medium">
                      🔁 <span className="font-bold">{existingMatch.nickname}</span> allaqachon mavjud ({existingMatch.history?.length || 1} marta ishlangan). Yangi sana bloger tarixiga qo‘shiladi.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hamkorlik sanasi
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F0826D]/30 focus:border-[#F0826D] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Format / Vaqt & Obunachilar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Format & Joylash vaqti
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F0826D]/30 focus:border-[#F0826D] transition-all cursor-pointer"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Auditoriya / Obunachilar
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Masalan: 320k obunachi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F0826D]/30 focus:border-[#F0826D] transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Brend tanlash (MIO Beauty / MIO Home) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Brend yo‘nalishi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBrand('mio_beauty')}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      brand === 'mio_beauty'
                        ? 'bg-[#FFF8F6] border-[#F0826D] text-slate-900 shadow-sm ring-2 ring-[#F0826D]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BrandLogo brand="mio_beauty" variant="icon" size="sm" />
                    <div className="text-left">
                      <div className="font-bold">MIO Beauty</div>
                      <div className="text-[10px] text-slate-500">Uxodoviy kosmetika</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrand('mio_home')}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      brand === 'mio_home'
                        ? 'bg-[#FFF8F6] border-[#F0826D] text-slate-900 shadow-sm ring-2 ring-[#F0826D]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BrandLogo brand="mio_home" variant="icon" size="sm" />
                    <div className="text-left">
                      <div className="font-bold">MIO Home</div>
                      <div className="text-[10px] text-slate-500">Kir, idish & qo‘l vositalari</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Row 4: Hamkorlik turi (Barter / Pulli) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hamkorlik formati
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCollaborationType('barter')}
                    className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      collaborationType === 'barter'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Handshake className="w-4 h-4" />
                    <span>Barter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollaborationType('paid')}
                    className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      collaborationType === 'paid'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Pulli hamkorlik</span>
                  </button>
                </div>
              </div>

              {/* Row 5: Mas'ul xodim belgilash & Qo'shish */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Mas'ul xodim belgilash
                  </label>
                  {managers.length > 0 && !isAddingNewManager && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewManager(true)}
                      className="text-[11px] font-bold text-[#E06D57] hover:text-[#d45842] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Yangi xodim qo‘shish</span>
                    </button>
                  )}
                </div>

                {managers.length === 0 || isAddingNewManager ? (
                  <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-[#F0826D]" />
                        <span>Yangi mas'ul xodim qo‘shish</span>
                      </span>
                      {managers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewManager(false)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Bekor qilish
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={newManagerName}
                          onChange={(e) => setNewManagerName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddManager();
                            }
                          }}
                          placeholder="Xodim ismi va familiyasi (masalan: Kamola Rustamova)"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F0826D]/30 focus:border-[#F0826D]"
                          autoFocus={isAddingNewManager || managers.length === 0}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddManager()}
                        disabled={!newManagerName.trim()}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                      >
                        Qo‘shish
                      </button>
                    </div>

                    {managers.length === 0 && (
                      <p className="text-[10px] text-slate-400 mt-2">
                        ℹ️ Hozircha tizimda xodimlar mavjud emas. Mas'ul xodim qo‘shing yoki blogerni biriktirmasdan saqlashingiz mumkin.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F0826D]/30 focus:border-[#F0826D] transition-all cursor-pointer"
                    >
                      <option value="">— Belgilanmagan (Hech kim) —</option>
                      {managers.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Row 6: Qo‘shimcha izohlar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qo‘shimcha izoh yoki vazifa
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Masalan: SPF va sarumni birgalikda qo‘llash bo‘yicha 3 ta video story..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#F0826D]/30 focus:border-[#F0826D] transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#F0826D]" />
                  <span>
                    {isSubmitting
                      ? 'Saqlanmoqda...'
                      : existingMatch
                      ? 'Qayta hamkorlikni saqlash'
                      : 'Hamkorlikni saqlash'}
                  </span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
