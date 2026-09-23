import React from 'react';
import { motion } from 'motion/react';
import { Handshake, Wallet, Check, ArrowRight } from 'lucide-react';
import { CollaborationType } from '../types';

interface StepCollaborationTypeProps {
  selectedType: CollaborationType | null;
  onSelect: (type: CollaborationType) => void;
  onNext: () => void;
}

export const StepCollaborationType: React.FC<StepCollaborationTypeProps> = ({
  selectedType,
  onSelect,
  onNext,
}) => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl glass-panel-elevated rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden"
      >
        {/* Subtle decorative glow in top right */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

        {/* Step indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-5">
          <span>1-Qadam</span>
          <span className="w-1 h-1 rounded-full bg-blue-500" />
          <span>Yo‘nalish</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Bloger turini tanlang
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto mb-8">
          Hamkorlik qilish uchun bloger turini belgilang. Keyingi qadamda brend tanlanadi.
        </p>

        {/* The 2 Large Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-8 text-left">
          {/* Option 1: Barter bloger */}
          <button
            type="button"
            onClick={() => onSelect('barter')}
            className={`group relative p-6 rounded-2xl border transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer ${
              selectedType === 'barter'
                ? 'bg-blue-50/80 border-blue-500 shadow-md shadow-blue-500/15 ring-1 ring-blue-500'
                : 'bg-white/60 hover:bg-white/90 border-white/80 hover:border-blue-200 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
                  selectedType === 'barter'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-slate-100/90 text-slate-700 group-hover:bg-blue-100/70 group-hover:text-blue-600'
                }`}
              >
                <Handshake className="w-7 h-7 stroke-[1.8]" />
              </div>

              {selectedType === 'barter' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </motion.div>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Barter bloger
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Mahsulot yoki xizmat evaziga reklama va hamkorlik shartnomasi
            </p>
          </button>

          {/* Option 2: Pulli bloger */}
          <button
            type="button"
            onClick={() => onSelect('paid')}
            className={`group relative p-6 rounded-2xl border transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer ${
              selectedType === 'paid'
                ? 'bg-blue-50/80 border-blue-500 shadow-md shadow-blue-500/15 ring-1 ring-blue-500'
                : 'bg-white/60 hover:bg-white/90 border-white/80 hover:border-blue-200 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
                  selectedType === 'paid'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-slate-100/90 text-slate-700 group-hover:bg-blue-100/70 group-hover:text-blue-600'
                }`}
              >
                <Wallet className="w-7 h-7 stroke-[1.8]" />
              </div>

              {selectedType === 'paid' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </motion.div>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Pulli bloger
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Moliyaviy to‘lov asosidagi pullik tijoriy reklama integratsiyasi
            </p>
          </button>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={onNext}
            disabled={!selectedType}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
              selectedType
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-slate-200/80 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Davom etish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
