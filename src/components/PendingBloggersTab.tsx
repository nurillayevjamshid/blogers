import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, UserX, Clock } from 'lucide-react';
import { Blogger } from '../types';
import { BloggerCard } from './BloggerCard';

interface PendingBloggersTabProps {
  bloggers: Blogger[];
  onOpenAddModal: () => void;
  onCompleteBlogger: (id: string) => Promise<void>;
  onDeleteBlogger: (id: string) => Promise<void>;
}

export const PendingBloggersTab: React.FC<PendingBloggersTabProps> = ({
  bloggers,
  onOpenAddModal,
  onCompleteBlogger,
  onDeleteBlogger,
}) => {
  return (
    <div className="space-y-6">
      {/* Tab Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Ishlanayotgan blogerlar</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jarayondagi faol hamkorliklar va tracking ro‘yxati
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Bloger qo‘shish</span>
        </button>
      </div>

      {/* Bloggers Grid or Empty State */}
      {bloggers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-12 text-center border border-white/80"
        >
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Clock className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Hozircha ishlanayotgan blogerlar yo‘q.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Yangi bloger qo‘shish uchun yuqoridagi tugmani bosing va hamkorlikni boshlang.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Birinchi blogerni qo‘shish</span>
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {bloggers.map((blogger) => (
              <BloggerCard
                key={blogger.id}
                blogger={blogger}
                onComplete={onCompleteBlogger}
                onDelete={onDeleteBlogger}
                isCompletedView={false}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
