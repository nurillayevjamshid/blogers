import React from 'react';
import { LayoutDashboard, Users, Settings } from 'lucide-react';
import { NavigationTab } from '../types';

interface NavigationProps {
  activeTab: NavigationTab;
  onChangeTab: (tab: NavigationTab) => void;
  pendingBadgeCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  pendingBadgeCount = 0,
}) => {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] sm:w-auto">
      <div className="glass-panel-elevated rounded-full p-1.5 sm:p-2 flex items-center justify-between sm:gap-2 border border-white/90 shadow-xl shadow-slate-900/5">
        {/* Tab 1: Dashboard */}
        <button
          type="button"
          onClick={() => onChangeTab('dashboard')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Tab 2: Blogerlar */}
        <button
          type="button"
          onClick={() => onChangeTab('bloggers')}
          className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'bloggers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Blogerlar</span>
          {pendingBadgeCount > 0 && (
            <span
              className={`w-2 h-2 rounded-full ${
                activeTab === 'bloggers' ? 'bg-white' : 'bg-blue-600'
              }`}
            />
          )}
        </button>

        {/* Tab 3: Settings */}
        <button
          type="button"
          onClick={() => onChangeTab('settings')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Sozlamalar</span>
        </button>
      </div>
    </nav>
  );
};
