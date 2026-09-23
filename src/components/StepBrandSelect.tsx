import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { BrandType, CollaborationType } from '../types';
import { BrandLogo } from './BrandLogo';

interface StepBrandSelectProps {
  selectedBrand: BrandType | null;
  collaborationType: CollaborationType | null;
  onSelect: (brand: BrandType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepBrandSelect: React.FC<StepBrandSelectProps> = ({
  selectedBrand,
  collaborationType,
  onSelect,
  onNext,
  onBack,
}) => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl glass-panel-elevated rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden"
      >
        {/* Subtle decorative glow in top left */}
        <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-[#F0826D]/15 blur-2xl pointer-events-none" />

        {/* Header badge & context */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-600 text-xs font-semibold uppercase tracking-wider">
            <span>2-Qadam</span>
            <span className="w-1 h-1 rounded-full bg-blue-500" />
            <span>Brendni tanlang</span>
          </div>
          {collaborationType && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200/70">
              {collaborationType === 'barter' ? 'Barter' : 'Pulli'}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Qaysi brend bilan ishlaymiz?
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto mb-8">
          MIO Beauty yoki MIO Home brendini tanlang. Tanlangan brend bo‘yicha blogerlar bazasi ko‘rsatiladi.
        </p>

        {/* 2 Large Official Brand Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 text-left">
          {/* Brand 1: MIO Beauty */}
          <button
            type="button"
            onClick={() => onSelect('mio_beauty')}
            className={`group relative p-6 rounded-3xl border transition-all duration-200 text-left focus:outline-none cursor-pointer flex flex-col items-center text-center ${
              selectedBrand === 'mio_beauty'
                ? 'bg-[#FFF8F6] border-[#F0826D] shadow-lg shadow-[#F0826D]/15 ring-2 ring-[#F0826D]'
                : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-[#F0826D]/50 shadow-sm'
            }`}
          >
            {/* Selected Check Badge */}
            {selectedBrand === 'mio_beauty' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#F0826D] text-white flex items-center justify-center shadow-xs"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </motion.div>
            )}

            {/* Official MIO Beauty Logo Card */}
            <div className="mb-4">
              <BrandLogo
                brand="mio_beauty"
                variant="hero"
                size="md"
                className="group-hover:scale-105 transition-transform duration-200"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF0ED] text-[#E06752] text-[11px] font-bold uppercase tracking-wider mb-2 border border-[#F0826D]/30">
              <ShieldCheck className="w-3 h-3 text-[#F0826D]" />
              <span>Rasmiy Logo</span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              MIO Beauty
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Kosmetika, terini parvarish qilish, go‘zallik va gigiyena vositalari
            </p>
          </button>

          {/* Brand 2: MIO Home */}
          <button
            type="button"
            onClick={() => onSelect('mio_home')}
            className={`group relative p-6 rounded-3xl border transition-all duration-200 text-left focus:outline-none cursor-pointer flex flex-col items-center text-center ${
              selectedBrand === 'mio_home'
                ? 'bg-[#FFF8F6] border-[#F0826D] shadow-lg shadow-[#F0826D]/15 ring-2 ring-[#F0826D]'
                : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-[#F0826D]/50 shadow-sm'
            }`}
          >
            {/* Selected Check Badge */}
            {selectedBrand === 'mio_home' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#F0826D] text-white flex items-center justify-center shadow-xs"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </motion.div>
            )}

            {/* Official MIO Home Logo Card */}
            <div className="mb-4">
              <BrandLogo
                brand="mio_home"
                variant="hero"
                size="md"
                className="group-hover:scale-105 transition-transform duration-200"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF0ED] text-[#E06752] text-[11px] font-bold uppercase tracking-wider mb-2 border border-[#F0826D]/30">
              <ShieldCheck className="w-3 h-3 text-[#F0826D]" />
              <span>Rasmiy Logo</span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              MIO Home
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Uy-ro‘zg‘or, shinamlik, tozalik va xonadon interyeri mahsulotlari
            </p>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-1/3 py-3.5 px-5 rounded-2xl font-semibold text-slate-700 glass-panel hover:bg-white border-slate-200/80 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ortga</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!selectedBrand}
            className={`w-full sm:w-2/3 py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
              selectedBrand
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
