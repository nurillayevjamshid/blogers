import React from 'react';

export const BackgroundGradients: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Soft cool-blue ambient sphere */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      {/* Soft warm-indigo ambient sphere */}
      <div 
        className="absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-indigo-100/50 blur-3xl"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      {/* Soft emerald/teal whisper near bottom */}
      <div 
        className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-emerald-100/30 blur-3xl"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      {/* Subtle fine mesh pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
    </div>
  );
};
