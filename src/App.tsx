import React, { useEffect, useState } from 'react';
import { Blogger, BrandType, CollaborationType } from './types';
import MioMonitoringDashboard from './components/MioMonitoringDashboard';
import { AddBloggerModal } from './components/AddBloggerModal';
import { fetchBloggersApi, createBloggerApi, completeBloggerApi, deleteBloggerApi, reopenBloggerApi } from './api';

export default function App() {
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [defaultType] = useState<CollaborationType>('barter');
  const [defaultBrand] = useState<BrandType>('mio_beauty');

  const load = async () => {
    setIsLoading(true);
    setBloggers(await fetchBloggersApi());
    setIsLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async (data: any) => {
    const res = await createBloggerApi(data);
    if (!res.success || !res.data) return false;
    setBloggers(prev => [res.data!, ...prev]);
    return true;
  };
  const complete = async (id: string) => {
    setBloggers(prev => prev.map(b => b.id === id ? { ...b, status: 'completed', completedAt: new Date().toISOString() } : b));
    await completeBloggerApi(id);
  };
  const reopen = async (id: string) => {
    setBloggers(prev => prev.map(b => b.id === id ? { ...b, status: 'pending', completedAt: null } : b));
    await reopenBloggerApi(id);
  };
  const remove = async (id: string) => {
    setBloggers(prev => prev.filter(b => b.id !== id));
    await deleteBloggerApi(id);
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f5f6fb]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f7b2a3] border-t-transparent" /></div>;
  return <>
    <MioMonitoringDashboard bloggers={bloggers} onOpenAddModal={() => setIsAddOpen(true)} onAddBlogger={add} onCompleteBlogger={complete} onReopenBlogger={reopen} onDeleteBlogger={remove} onRefresh={load} />
    <AddBloggerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} defaultType={defaultType} defaultBrand={defaultBrand} existingBloggers={bloggers} onAddBlogger={add} />
  </>;
}
