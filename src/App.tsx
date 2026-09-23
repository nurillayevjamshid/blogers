/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CollaborationType,
  BrandType,
  Blogger,
  StepView,
  ActiveTab,
  NavigationTab,
  ToastMessage,
  DashboardStats,
} from './types';
import { BackgroundGradients } from './components/BackgroundGradients';
import { StepCollaborationType } from './components/StepCollaborationType';
import { StepBrandSelect } from './components/StepBrandSelect';
import { DashboardHeader } from './components/DashboardHeader';
import { AddBloggerModal } from './components/AddBloggerModal';
import { SettingsView } from './components/SettingsView';
import { BloggerTableView } from './components/BloggerTableView';
import { ToastContainer } from './components/Toast';
import {
  fetchBloggersApi,
  createBloggerApi,
  completeBloggerApi,
  deleteBloggerApi,
  resetDemoApi,
  reopenBloggerApi,
} from './api';

export default function App() {
  // Step / View state
  // Open the monitoring dashboard immediately; users can still change the
  // collaboration context from the dashboard header when needed.
  const [currentStep, setCurrentStep] = useState<StepView>('dashboard');

  const [collaborationType, setCollaborationType] = useState<CollaborationType | null>(() => {
    return (localStorage.getItem('mio_collab_type') as CollaborationType) || 'barter';
  });

  const [brand, setBrand] = useState<BrandType | null>(() => {
    return (localStorage.getItem('mio_brand') as BrandType) || 'mio_beauty';
  });

  // Dashboard Tab state: 'pending' or 'completed'
  const [activeTab, setActiveTab] = useState<ActiveTab>('pending');

  // Bottom navigation tab state: 'dashboard' | 'bloggers' | 'settings'
  const [navTab, setNavTab] = useState<NavigationTab>('dashboard');

  // Bloggers state
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Blogger Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load bloggers from backend on mount
  const loadBloggers = async () => {
    setIsRefreshing(true);
    const data = await fetchBloggersApi();
    setBloggers(data);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadBloggers();
  }, []);

  // Save selected type & brand to localStorage
  const handleSelectCollaborationType = (type: CollaborationType) => {
    setCollaborationType(type);
    localStorage.setItem('mio_collab_type', type);
  };

  const handleSelectBrand = (b: BrandType) => {
    setBrand(b);
    localStorage.setItem('mio_brand', b);
  };

  // Step transitions
  const handleNextFromType = () => {
    if (collaborationType) {
      setCurrentStep('brand_select');
    }
  };

  const handleNextFromBrand = () => {
    if (brand) {
      setCurrentStep('dashboard');
    }
  };

  const handleChangeContext = () => {
    setCurrentStep('collaboration_select');
    setNavTab('dashboard');
  };

  // Add blogger handler with repeat collaboration support
  const handleAddBlogger = async (data: {
    nickname: string;
    date: string;
    collaborationType: CollaborationType;
    brand: BrandType;
    category?: string;
    manager?: string;
    time?: string;
    audience?: string;
    notes?: string;
  }): Promise<boolean> => {
    const res = await createBloggerApi(data);
    if (!res.success || !res.data) {
      addToast('error', res.error || 'Blogerni qo‘shishda xatolik yuz berdi');
      return false;
    }

    const savedBlogger = res.data;
    const isRepeat = (res as any).isRepeat;

    if (isRepeat) {
      setBloggers((prev) =>
        prev.map((b) => (b.id === savedBlogger.id ? savedBlogger : b))
      );
      addToast('success', `${savedBlogger.nickname} uchun yangi hamkorlik sanasi saqlandi.`);
    } else {
      setBloggers((prev) => [savedBlogger, ...prev]);
      addToast('success', `${savedBlogger.nickname} muvaffaqiyatli qo‘shildi.`);
    }
    return true;
  };

  // Mark blogger completed handler
  const handleCompleteBlogger = async (id: string) => {
    // Optimistic UI update
    setBloggers((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: 'completed', completedAt: new Date().toISOString() }
          : b
      )
    );

    addToast('success', 'Bloger muvaffaqiyatli tekshirildi va bajarildi deb belgilandi.');

    const ok = await completeBloggerApi(id);
    if (!ok) {
      loadBloggers();
      addToast('error', 'Serverda yangilashda xatolik yuz berdi.');
    }
  };

  // Re-open completed blogger back to pending
  const handleReopenBlogger = async (id: string) => {
    setBloggers((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: 'pending', completedAt: null } : b
      )
    );
    addToast('info', 'Bloger jarayondagilar ro‘yxatiga qaytarildi.');
    await reopenBloggerApi(id);
  };

  // Delete blogger handler
  const handleDeleteBlogger = async (id: string) => {
    const target = bloggers.find((b) => b.id === id);
    setBloggers((prev) => prev.filter((b) => b.id !== id));
    addToast('info', `${target?.nickname || 'Bloger'} o‘chirildi.`);

    const ok = await deleteBloggerApi(id);
    if (!ok) {
      loadBloggers();
      addToast('error', 'O‘chirishda xatolik yuz berdi.');
    }
  };

  // Reset Demo handler
  const handleResetDemo = async () => {
    const refreshed = await resetDemoApi();
    setBloggers(refreshed);
    addToast('success', 'Demo ma’lumotlari dastlabki holatga keltirildi.');
  };

  // Export JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bloggers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mio_bloggers_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Ma’lumotlar JSON formatida yuklab olindi.');
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans antialiased text-slate-800 relative selection:bg-[#F0826D]/30 selection:text-[#F0826D]">
      {/* Dynamic Ambient Gradients */}
      <BackgroundGradients />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* STEP 1 & STEP 2: Selection Flow */}
      {currentStep !== 'dashboard' && (
        <>
          <DashboardHeader
            collaborationType={collaborationType || 'barter'}
            brand={brand || 'mio_beauty'}
            stats={{
              pendingCount: bloggers.filter((b) => b.status === 'pending').length,
              completedCount: bloggers.filter((b) => b.status === 'completed').length,
              totalCount: bloggers.length,
              barterCount: bloggers.filter((b) => b.collaborationType === 'barter').length,
              paidCount: bloggers.filter((b) => b.collaborationType === 'paid').length,
              beautyCount: bloggers.filter((b) => b.brand === 'mio_beauty').length,
              homeCount: bloggers.filter((b) => b.brand === 'mio_home').length,
            }}
            onChangeContext={handleChangeContext}
            onOpenSettings={() => setNavTab('settings')}
            onRefresh={loadBloggers}
            isRefreshing={isRefreshing}
          />

          <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-20">
            <AnimatePresence mode="wait">
              {currentStep === 'collaboration_select' && (
                <motion.div
                  key="step-type"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  <StepCollaborationType
                    selectedType={collaborationType}
                    onSelect={handleSelectCollaborationType}
                    onNext={handleNextFromType}
                  />
                </motion.div>
              )}

              {currentStep === 'brand_select' && (
                <motion.div
                  key="step-brand"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  <StepBrandSelect
                    selectedBrand={brand}
                    collaborationType={collaborationType}
                    onSelect={handleSelectBrand}
                    onNext={handleNextFromBrand}
                    onBack={() => setCurrentStep('collaboration_select')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      )}

      {/* STEP 3: Full-fidelity SaaS Dashboard matching reference screenshot */}
      {currentStep === 'dashboard' && (
        <BloggerTableView
          bloggers={bloggers}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onCompleteBlogger={handleCompleteBlogger}
          onReopenBlogger={handleReopenBlogger}
          onDeleteBlogger={handleDeleteBlogger}
          onBackToBrandSelect={handleChangeContext}
          onOpenSettings={() => setNavTab('settings')}
          currentBrand={brand || 'mio_beauty'}
          currentCollabType={collaborationType || 'barter'}
        />
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {navTab === 'settings' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNavTab('dashboard')}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Tizim Sozlamalari</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Ma'lumotlar bazasi va eksport boshqaruvi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNavTab('dashboard')}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <SettingsView
                bloggers={bloggers}
                onResetDemo={handleResetDemo}
                onExportData={handleExportData}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Blogger Glass Modal */}
      <AddBloggerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultType={collaborationType || 'barter'}
        defaultBrand={brand || 'mio_beauty'}
        existingBloggers={bloggers}
        onAddBlogger={handleAddBlogger}
      />
    </div>
  );
}
