import React from 'react';
import { BrandType } from '../types';

export interface BrandLogoProps {
  brand: BrandType;
  variant?: 'square' | 'badge' | 'icon' | 'inline' | 'hero';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Official BrandLogo component for MIO Beauty and MIO Home.
 * Faithfully matches the official logos provided in brand assets:
 * - Coral/Peach brand color: #F0826D (HSL 10, 82%, 68%)
 * - Bold geometric "MIO" wordmark
 * - Refined, tracked "BEAUTY" and "HOME" subtitle typography
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  variant = 'badge',
  size = 'md',
  className = '',
}) => {
  const isBeauty = brand === 'mio_beauty';
  const subtitle = isBeauty ? 'BEAUTY' : 'HOME';
  const brandName = isBeauty ? 'MIO Beauty' : 'MIO Home';

  // Exact brand colors from official visual identity
  const brandColor = '#F0826D';
  const brandLightBg = '#FFF8F6';
  const brandBorder = 'rgba(240, 130, 109, 0.25)';

  // 1. HERO / SELECTION CARD LOGO (large, high-contrast, matches user's uploaded image)
  if (variant === 'hero' || variant === 'square') {
    const sizeDimensions = {
      xs: 'w-14 h-14',
      sm: 'w-20 h-20',
      md: 'w-28 h-28',
      lg: 'w-36 h-36',
      xl: 'w-44 h-44',
    }[size];

    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm transition-all duration-200 select-none overflow-hidden ${sizeDimensions} ${className}`}
        style={{
          boxShadow: '0 4px 16px rgba(240, 130, 109, 0.10), 0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full p-2.5 sm:p-3"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g textAnchor="middle">
            {/* MIO Wordmark */}
            <text
              x="100"
              y="98"
              fill={brandColor}
              fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              fontSize="64"
              fontWeight="800"
              letterSpacing="2"
            >
              MIO
            </text>

            {/* Subtitle: BEAUTY or HOME */}
            {isBeauty ? (
              <text
                x="100"
                y="142"
                fill={brandColor}
                fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                fontSize="23"
                fontWeight="300"
                letterSpacing="8"
              >
                BEAUTY
              </text>
            ) : (
              <text
                x="100"
                y="142"
                fill={brandColor}
                fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                fontSize="24"
                fontWeight="300"
                letterSpacing="13"
              >
                HOME
              </text>
            )}
          </g>
        </svg>
      </div>
    );
  }

  // 2. ICON VARIANT (Compact square emblem)
  if (variant === 'icon') {
    const iconSizes = {
      xs: 'w-6 h-6 rounded-md',
      sm: 'w-8 h-8 rounded-lg',
      md: 'w-10 h-10 rounded-xl',
      lg: 'w-12 h-12 rounded-xl',
      xl: 'w-14 h-14 rounded-2xl',
    }[size];

    return (
      <div
        className={`flex flex-col items-center justify-center bg-white border border-rose-100 shadow-xs shrink-0 select-none overflow-hidden ${iconSizes} ${className}`}
        style={{
          boxShadow: '0 2px 8px rgba(240, 130, 109, 0.12)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g textAnchor="middle">
            <text
              x="50"
              y="52"
              fill={brandColor}
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontSize="38"
              fontWeight="800"
              letterSpacing="1"
            >
              MIO
            </text>
            <text
              x="50"
              y="74"
              fill={brandColor}
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontSize={isBeauty ? '14' : '15'}
              fontWeight="400"
              letterSpacing={isBeauty ? '3' : '5'}
            >
              {isBeauty ? 'BEAUTY' : 'HOME'}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // 3. BADGE VARIANT (Horizontal Pill with Logo Mark + Text)
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border shadow-xs select-none transition-all ${className}`}
        style={{
          borderColor: brandBorder,
          boxShadow: '0 1px 4px rgba(240, 130, 109, 0.08)',
        }}
      >
        {/* Crisp mini square logo emblem */}
        <div
          className="w-6 h-6 rounded-lg bg-white border flex flex-col items-center justify-center shrink-0 p-0.5"
          style={{ borderColor: brandBorder, backgroundColor: brandLightBg }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <g textAnchor="middle">
              <text
                x="50"
                y="52"
                fill={brandColor}
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontSize="40"
                fontWeight="800"
              >
                MIO
              </text>
              <text
                x="50"
                y="74"
                fill={brandColor}
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontSize={isBeauty ? '14' : '15'}
                fontWeight="400"
                letterSpacing={isBeauty ? '2' : '4'}
              >
                {isBeauty ? 'BEAUTY' : 'HOME'}
              </text>
            </g>
          </svg>
        </div>

        {/* Brand Name Typography */}
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className="font-black text-sm tracking-tight"
            style={{ color: brandColor }}
          >
            MIO
          </span>
          <span className="text-xs font-semibold text-slate-800 tracking-wide">
            {subtitle}
          </span>
        </div>
      </div>
    );
  }

  // 4. INLINE VARIANT
  return (
    <span className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <span
        className="font-black tracking-tight"
        style={{ color: brandColor }}
      >
        MIO
      </span>
      <span className="font-semibold text-slate-700 uppercase tracking-wide">
        {subtitle}
      </span>
    </span>
  );
};

/**
 * Top-level official MIO brand header logo replacing external placeholders
 */
export const MioMainBrand: React.FC<{ className?: string; showSubtext?: boolean }> = ({
  className = '',
  showSubtext = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shadow-black/10 shrink-0 p-1 border border-white/80">
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <text
            x="50"
            y="62"
            textAnchor="middle"
            fill="#F0826D"
            fontFamily="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="52"
            fontWeight="900"
            letterSpacing="-1"
          >
            MIO
          </text>
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans lowercase">
            mio<span className="text-[#F0826D]">.</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
            Rasmiy
          </span>
        </div>
        {showSubtext && (
          <span className="text-[10px] text-white/80 font-medium tracking-tight -mt-0.5">
            Beauty & Home Monitoring
          </span>
        )}
      </div>
    </div>
  );
};

