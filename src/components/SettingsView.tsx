import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Database, Download, RefreshCw, ShieldCheck, Check, Server, ExternalLink } from 'lucide-react';
import { Blogger } from '../types';
import { BrandLogo } from './BrandLogo';

interface SettingsViewProps {
  bloggers: Blogger[];
  onResetDemo: () => Promise<void>;
  onExportData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  bloggers,
  onResetDemo,
  onExportData,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    await onResetDemo();
    setIsResetting(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>Tizim sozlamalari va ma'lumotlar</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Rasmiy brendlar logolari, ma'lumotlar xavfsizligi va tizim sozlamalari
        </p>
      </div>

      {/* Official Brands Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F0826D]" />
            <span>Rasmiy Brendlar va Logolar</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">2 ta faol brend</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Brand 1: MIO Beauty */}
          <div className="p-5 rounded-3xl bg-white/80 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-4 mb-3">
                <BrandLogo brand="mio_beauty" variant="square" size="sm" />
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF0ED] text-[#E06752] text-[10px] font-bold uppercase mb-1 border border-[#F0826D]/30">
                    Rasmiy brend
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">MIO Beauty</h4>
                  <p className="text-xs text-slate-500">Go‘zallik va kosmetika yo‘nalishi</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Kosmetika, terini parvarish qilish va go‘zallik vositalari bo‘yicha blogerlar bilan hamkorlik monitoringi.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">/assets/mio-beauty-logo.svg</span>
              <a
                href="/assets/mio-beauty-logo.svg"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#E06752] hover:underline font-semibold"
              >
                <span>Vektor Logoni ochish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Brand 2: MIO Home */}
          <div className="p-5 rounded-3xl bg-white/80 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-4 mb-3">
                <BrandLogo brand="mio_home" variant="square" size="sm" />
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF0ED] text-[#E06752] text-[10px] font-bold uppercase mb-1 border border-[#F0826D]/30">
                    Rasmiy brend
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">MIO Home</h4>
                  <p className="text-xs text-slate-500">Uy-ro‘zg‘or va shinamlik yo‘nalishi</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Uy-ro‘zg‘or buyumlari, tozalik va xonadon interyeri bo‘yicha blogerlar bilan hamkorlik monitoringi.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">/assets/mio-home-logo.svg</span>
              <a
                href="/assets/mio-home-logo.svg"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#E06752] hover:underline font-semibold"
              >
                <span>Vektor Logoni ochish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Export Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/80 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Ma'lumotlar va Xavfsizlik</span>
        </h3>

        <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Blogerlar bazasini yuklab olish (Eksport)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Barcha {bloggers.length} ta bloger ma'lumotlarini JSON formatda xavfsiz saqlab oling
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExportData}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON Eksport</span>
          </button>
        </div>

        {/* Backend & Security Status */}
        <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Express Backend tizimi</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Faylga asoslangan xavfsiz saqlash (data/bloggers.json) & REST API faol
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Himoyalangan</span>
          </span>
        </div>

        {/* Reset Demo Data */}
        <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Namuna (Demo) ma'lumotlarni qayta tiklash
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Boshlang‘ich realistik o‘zbek blogerlari namunalarini tiklash
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {resetDone ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tiklandi!</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Tiklanmoqda...' : 'Namunani tiklash'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Logic & Policy Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/80 space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Tizim qoidalari (Unique Nickname Logic)</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Tizimda har bir bloger nickname’i butun platforma bo‘ylab bir martalik (unique) hisoblanadi. 
          Case-insensitive tekshiruv tufayli <code>@ali_bloger</code> va <code>@Ali_Bloger</code> bir xil deb tan olinadi va dublikat qo‘shish qat'iyan taqiqlangan.
        </p>
      </div>
    </div>
  );
};
