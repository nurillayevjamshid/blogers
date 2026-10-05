import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  Instagram,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
  Calendar,
} from 'lucide-react';
import {
  addBloggerApi,
  completeBloggerApi,
  deleteBloggerApi,
  fetchBloggersApi,
  updateBloggerApi,
  getAuth,
  guestLoginApi,
  loginApi,
} from './api';
import { Blogger, BrandType, CollaborationType, Session, CollaborationHistoryItem } from './types';
import mioHomeLogo from './assets/mio-home-logo.png';
import mioBeautyLogo from './assets/mio-beauty-logo.png';

type Tab = 'directory' | 'working';
type Period = 'all' | 'week' | 'month' | 'year';

const brandLabel = (b: BrandType) => (b === 'mio_beauty' ? 'MIO Beauty' : 'MIO HOME');
const typeLabel = (t: CollaborationType) => (t === 'barter' ? 'Barter' : 'Pulli');
const normalize = (v: string) => v.trim().replace(/^@+/, '').toLowerCase();
const instagramUrl = (n: string) => `https://www.instagram.com/${normalize(n)}/`;

// Format: dd/mm/yyyy
export const formatDdMmYyyy = (d: string | undefined | null) => {
  if (!d) return '';
  const clean = String(d).slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy}`;
  }
  return clean;
};

// Parse input dd/mm/yyyy yoki yyyy-mm-dd
export const toIsoDate = (d: string) => {
  const trimmed = d.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [dd, mm, yyyy] = trimmed.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  return trimmed;
};

const dayDiff = (d: string) => {
  const iso = toIsoDate(d);
  return Math.floor((Date.now() - new Date(`${iso}T00:00:00`).getTime()) / 86400000);
};

const isInPeriod = (d: string, p: Period) =>
  p === 'all' ||
  (p === 'week' ? dayDiff(d) <= 7 : p === 'month' ? dayDiff(d) <= 31 : dayDiff(d) <= 365);

export interface WorkingItem {
  id: string; // blogger id
  historyId: string;
  nickname: string;
  date: string;
  collaborationType: CollaborationType;
  brand: BrandType;
  status: 'pending' | 'completed';
  manager?: string;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => getAuth());
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [tab, setTab] = useState<Tab>('directory');
  const [period, setPeriod] = useState<Period>('all');
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState<'all' | BrandType>('all');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBlogger, setSelectedBlogger] = useState<Blogger | null>(null);
  const [editBlogger, setEditBlogger] = useState<Blogger | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setBloggers(await fetchBloggersApi());
      setError('');
    } catch (e: any) {
      setError(e.message || 'Ma’lumotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      guestLoginApi().then((r) => {
        if (r.session) setSession(r.session);
        else setError(r.error || 'Avtomatik sessiya yaratilmadi.');
      });
    }
  }, [session]);

  useEffect(() => {
    if (session) load();
  }, [session]);

  // Ishlanayotgan alohida hamkorliklar ro'yxati (har bir pending hamkorlik alohida qator bo'lib ko'rinadi)
  const workingItems = useMemo<WorkingItem[]>(() => {
    const list: WorkingItem[] = [];
    for (const b of bloggers) {
      const history = b.history && b.history.length > 0 ? b.history : [
        {
          id: `${b.id}-initial`,
          date: b.date,
          collaborationType: b.collaborationType,
          brand: b.brand,
          status: b.status,
          manager: b.manager,
          createdAt: b.createdAt,
        },
      ];

      for (const h of history) {
        if (h.status === 'pending') {
          list.push({
            id: b.id,
            historyId: h.id,
            nickname: b.nickname,
            date: h.date,
            collaborationType: h.collaborationType,
            brand: h.brand,
            status: h.status,
            manager: h.manager || b.manager,
          });
        }
      }
    }
    // Sana bo'yicha saralash (eng oxirgisi yuqorida)
    return list.sort((a, b) => new Date(toIsoDate(b.date)).getTime() - new Date(toIsoDate(a.date)).getTime());
  }, [bloggers]);

  const overdue = useMemo(() => {
    return workingItems.filter((item) => dayDiff(item.date) >= 5);
  }, [workingItems]);

  // Blogerlar ro'yxati (har bir bloger yagona nickname bilan unikal turadi)
  const directory = useMemo(() => {
    return bloggers.filter((b) => {
      const q =
        !query ||
        `${b.nickname} ${b.manager || ''} ${brandLabel(b.brand)}`.toLowerCase().includes(query.toLowerCase());
      return q && (brand === 'all' || b.brand === brand) && isInPeriod(b.history?.[0]?.date || b.date, period);
    });
  }, [bloggers, query, brand, period]);

  const filteredWorking = useMemo(() => {
    return workingItems.filter(
      (item) =>
        !query ||
        `${item.nickname} ${item.manager || ''} ${brandLabel(item.brand)}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [workingItems, query]);

  const complete = async (id: string, historyId?: string) => {
    setError('');
    const ok = await completeBloggerApi(id, historyId);
    if (!ok) return setError('Blogerni tasdiqlashda xatolik yuz berdi.');
    setBloggers(await fetchBloggersApi());
  };

  const remove = async (id: string) => {
    if (session?.role !== 'admin' || !window.confirm('Ushbu blogerni ro‘yxat va bazadan butunlay o‘chirishni tasdiqlaysizmi?')) return;
    setError('');
    const result = await deleteBloggerApi(id);
    if (!result.success) return setError(result.error || 'O‘chirishda xatolik yuz berdi.');
    setBloggers(await fetchBloggersApi());
    setSelectedBlogger(null);
  };

  const edit = async (id: string, data: Parameters<typeof updateBloggerApi>[1]) => {
    setError('');
    const result = await updateBloggerApi(id, data);
    if (!result.success) throw new Error(result.error || 'Blogerni tahrirlashda xatolik yuz berdi.');
    setBloggers(await fetchBloggersApi());
    setEditBlogger(null);
    setSelectedBlogger(null);
  };

  const add = async (data: Parameters<typeof addBloggerApi>[0]) => {
    const r = await addBloggerApi(data);
    if (!r.success) throw new Error(r.error || 'Saqlashda xatolik yuz berdi.');
    setBloggers(await fetchBloggersApi());
    setAddOpen(false);
  };

  if (!session) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-mark large">m</div>
          <p className="eyebrow mt-6">MIO bloggerlar boshqaruvi</p>
          <h1 className="mt-2 text-3xl font-black">Tizim yuklanmoqda...</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Avtomatik sessiya ochilmoqda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="brand-mark">m</div>
            <div>
              <p className="text-lg font-black">MIO</p>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-400">Bloggerlar boshqaruvi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-black">{session.username === 'jamshid' ? 'Jamshid' : 'Nuriddin'}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {session.role === 'admin' ? 'General admin' : 'Viewer'}
              </p>
            </div>
            <div className="avatar">
              <UserRound className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">MIO work desk</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Blogerlar hamkorligi</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Blogerlarni yagona nickname orqali kuzating, Instagram profiliga bir bosishda o‘ting va reklama holatini
              nazorat qiling.
            </p>
          </div>
          <div className="stats-row">
            <Stat label="Jami bloger" value={bloggers.length} />
            <Stat label="Ishlanmoqda" value={workingItems.length} />
            <Stat label="Ogohlantirish" value={overdue.length} danger={overdue.length > 0} />
          </div>
        </div>

        <div className="tabs">
          <button onClick={() => setTab('directory')} className={tab === 'directory' ? 'tab active' : 'tab'}>
            Blogerlar ro‘yxati <span>{bloggers.length}</span>
          </button>
          <button onClick={() => setTab('working')} className={tab === 'working' ? 'tab active' : 'tab'}>
            Ishlanayotgan blogerlar <span>{workingItems.length}</span>
          </button>
        </div>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e: any) => setQuery(e.target.value)}
                className="control pl-10"
                placeholder="Nickname yoki mas’ul shaxs bo‘yicha qidiring..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {tab === 'directory' && (
                <>
                  <Select
                    value={period}
                    onChange={(e: any) => setPeriod(e.target.value as Period)}
                    options={[
                      ['all', 'Barcha davr'],
                      ['week', 'Haftalik'],
                      ['month', 'Oylik'],
                      ['year', 'Yillik'],
                    ]}
                  />
                  <Select
                    value={brand}
                    onChange={(e: any) => setBrand(e.target.value as any)}
                    options={[
                      ['all', 'Barcha brend'],
                      ['mio_beauty', 'MIO Beauty'],
                      ['mio_home', 'MIO HOME'],
                    ]}
                  />
                </>
              )}
              {tab === 'working' && (
                <>
                  <button onClick={() => setNotifyOpen(true)} className="outline-button relative">
                    <Bell className="h-4 w-4" />
                    Bildirishnoma
                    {overdue.length > 0 && <b className="notification-dot">{overdue.length}</b>}
                  </button>
                  <button
                    onClick={() => setAddOpen(true)}
                    disabled={session.role !== 'admin'}
                    className="primary-button"
                  >
                    <Plus className="h-4 w-4" />
                    Bloger qo‘shish
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="panel mt-5 py-20 text-center text-sm text-slate-500">Ma’lumotlar yuklanmoqda...</div>
        ) : tab === 'directory' ? (
          <Directory rows={directory} admin={session.role === 'admin'} onDelete={remove} onOpen={setSelectedBlogger} />
        ) : (
          <Working rows={filteredWorking} canEdit={session.role === 'admin'} onComplete={complete} />
        )}
      </main>

      {notifyOpen && (
        <NotificationModal
          items={overdue}
          onClose={() => setNotifyOpen(false)}
          onComplete={complete}
          canEdit={session.role === 'admin'}
        />
      )}
      {addOpen && <AddModal onClose={() => setAddOpen(false)} onSubmit={add} existing={bloggers} />}
      {selectedBlogger && (
        <BloggerModal
          blogger={selectedBlogger}
          onClose={() => setSelectedBlogger(null)}
          canDelete={session.role === 'admin'}
          onDelete={remove}
          canEdit={session.role === 'admin'}
          onEdit={() => {
            setEditBlogger(selectedBlogger);
            setSelectedBlogger(null);
          }}
        />
      )}
      {editBlogger && <EditModal blogger={editBlogger} onClose={() => setEditBlogger(null)} onSubmit={edit} />}
    </div>
  );
}

const Stat = ({ label, value, danger }: { label: string; value: number; danger?: boolean }) => (
  <div className="stat">
    <span>{label}</span>
    <b className={danger ? 'text-rose-500' : ''}>{value}</b>
  </div>
);

const Select = ({ value, onChange, options }: any) => (
  <label className="select-wrap">
    <Filter className="h-3.5 w-3.5 text-slate-400" />
    <select value={value} onChange={onChange}>
      {options.map(([v, l]: string[]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
  </label>
);

function Directory({
  rows,
  admin,
  onDelete,
  onOpen,
}: {
  rows: Blogger[];
  admin: boolean;
  onDelete: (id: string) => void;
  onOpen: (blogger: Blogger) => void;
}) {
  return (
    <div className="panel mt-5 overflow-hidden">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Directory</p>
          <h2 className="text-xl font-black">Blogerlar ro‘yxati</h2>
        </div>
        <span className="count-pill">{rows.length} ta natija</span>
      </div>
      <div className="table-wrap directory-table">
        <table>
          <thead>
            <tr>
              <th>Nickname</th>
              <th>Necha marta ishlangan</th>
              <th>Mas’ul shaxs</th>
              <th>Hamkorlik turi</th>
              <th>Brend</th>
              {admin && <th />}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const collabCount = b.history?.length || 1;
              return (
                <tr key={b.id}>
                  <td>
                    <button className="nickname-link" onClick={() => onOpen(b)}>
                      {b.nickname}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <small>Ma’lumotlarni ko‘rish</small>
                  </td>
                  <td>
                    <button className="history-count" onClick={() => onOpen(b)}>
                      <b>{collabCount}</b> marta
                    </button>
                  </td>
                  <td>{b.manager || 'Belgilanmagan'}</td>
                  <td>
                    <Badge type={b.collaborationType} />
                  </td>
                  <td>
                    <BrandBadge brand={b.brand} />
                  </td>
                  {admin && (
                    <td className="text-right">
                      <button
                        onClick={() => onDelete(b.id)}
                        className="danger-button"
                        title="Faqat admin o‘chirishi mumkin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <Empty text="Bu filter bo‘yicha bloger topilmadi." />}
      </div>
      <div className="directory-cards">
        {rows.map((b) => (
          <button key={b.id} className="blogger-card" onClick={() => onOpen(b)}>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0 text-left">
                <strong className="block truncate">{b.nickname}</strong>
                <span className="mt-1 block text-xs text-slate-400">
                  {b.history?.length || 1} marta ishlangan · Batafsil ko‘rish
                </span>
              </div>
              <span className="text-slate-400">›</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge type={b.collaborationType} />
              <BrandBadge brand={b.brand} />
            </div>
          </button>
        ))}
        {rows.length === 0 && <Empty text="Bu filter bo‘yicha bloger topilmadi." />}
      </div>
    </div>
  );
}

function BloggerModal({
  blogger,
  onClose,
  canDelete,
  onDelete,
  canEdit,
  onEdit,
}: {
  blogger: Blogger;
  onClose: () => void;
  canDelete: boolean;
  onDelete: (id: string) => void;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const history = blogger.history || [];
  return (
    <Modal title={blogger.nickname} onClose={onClose}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge type={blogger.collaborationType} />
        <BrandBadge brand={blogger.brand} />
        <span className="count-pill">{history.length} marta ishlangan</span>
      </div>
      <div className="grid gap-3 rounded-2xl bg-white/60 p-4 text-sm">
        <p>
          <b>Mas’ul shaxs:</b> {blogger.manager || 'Belgilanmagan'}
        </p>
        <p>
          <b>Oxirgi yuborilgan sana:</b> {formatDdMmYyyy(blogger.date)}
        </p>
        <p>
          <b>Holati:</b> {blogger.status === 'pending' ? 'Ishlanmoqda' : 'Bajarilgan'}
        </p>
      </div>
      <h3 className="mt-6 mb-3 text-lg font-black">Nabor yuborilgan sanalar</h3>
      {history.length ? (
        <div className="space-y-2">
          {history.map((item, index) => (
            <div key={item.id} className="history-row">
              <div>
                <b>{formatDdMmYyyy(item.date)}</b>
                <p className="text-xs text-slate-500">
                  {item.status === 'pending' ? 'Ishlanmoqda' : 'Bajarilgan'} · {typeLabel(item.collaborationType)} ·{' '}
                  {brandLabel(item.brand)}
                  {item.manager ? ` · Mas’ul: ${item.manager}` : ''}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">#{history.length - index}</span>
            </div>
          ))}
        </div>
      ) : (
        <Empty text="Hamkorlik tarixi mavjud emas." />
      )}
      <div className="mt-7 flex gap-3 border-t border-slate-200 pt-5">
        {canEdit && (
          <button onClick={onEdit} className="outline-button flex-1">
            Tahrirlash
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(blogger.id)} className="delete-modal-button flex-1">
            <Trash2 className="h-4 w-4" />
            Blogerni o‘chirish
          </button>
        )}
      </div>
    </Modal>
  );
}

function EditModal({
  blogger,
  onClose,
  onSubmit,
}: {
  blogger: Blogger;
  onClose: () => void;
  onSubmit: (
    id: string,
    data: {
      nickname: string;
      date: string;
      collaborationType: CollaborationType;
      brand: BrandType;
      manager?: string;
    }
  ) => Promise<void>;
}) {
  const [n, setN] = useState(blogger.nickname);
  // Sana formatini dd/mm/yyyy ga o'giramiz
  const [d, setD] = useState(formatDdMmYyyy(blogger.date));
  const [brand, setBrand] = useState<BrandType>(blogger.brand);
  const [type, setType] = useState<CollaborationType>(blogger.collaborationType);
  const [m, setM] = useState(blogger.manager || '');
  const [e, setE] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (x: React.FormEvent) => {
    x.preventDefault();
    if (!n.trim() || !d.trim()) return setE('Nickname va sanani kiriting.');
    const isoDate = toIsoDate(d);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      return setE('Sanani dd/mm/yyyy formatida kiriting (masalan: 05/10/2026).');
    }
    setBusy(true);
    try {
      await onSubmit(blogger.id, {
        nickname: n,
        date: isoDate,
        brand,
        collaborationType: type,
        manager: m,
      });
    } catch (err: any) {
      setE(err.message || 'Tahrirlashda xatolik yuz berdi.');
      setBusy(false);
    }
  };

  return (
    <Modal title="Blogerni tahrirlash" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="field-label">
          Bloger nickname’i
          <input autoFocus className="control mt-2" value={n} onChange={(x) => setN(x.target.value)} />
        </label>
        <label className="field-label">
          Mahsulot yuborilgan sana (dd/mm/yyyy)
          <div className="relative mt-2">
            <input
              className="control"
              placeholder="dd/mm/yyyy (masalan: 05/10/2026)"
              value={d}
              onChange={(x) => setD(x.target.value)}
            />
          </div>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Brend
            <select className="control mt-2" value={brand} onChange={(x) => setBrand(x.target.value as BrandType)}>
              <option value="mio_beauty">MIO Beauty</option>
              <option value="mio_home">MIO HOME</option>
            </select>
          </label>
          <label className="field-label">
            Hamkorlik turi
            <select className="control mt-2" value={type} onChange={(x) => setType(x.target.value as CollaborationType)}>
              <option value="barter">Barter</option>
              <option value="paid">Pulli</option>
            </select>
          </label>
        </div>
        <label className="field-label">
          Mas’ul shaxs
          <input
            className="control mt-2"
            value={m}
            onChange={(x) => setM(x.target.value)}
            placeholder="Mas’ul xodim ismi"
          />
        </label>
        {e && <p className="text-sm font-semibold text-rose-600">{e}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="outline-button flex-1">
            Bekor qilish
          </button>
          <button disabled={busy} className="primary-button flex-1">
            {busy ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Working({
  rows,
  canEdit,
  onComplete,
}: {
  rows: WorkingItem[];
  canEdit: boolean;
  onComplete: (id: string, historyId?: string) => void;
}) {
  return (
    <div className="panel mt-5 overflow-hidden">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Active collaborations</p>
          <h2 className="text-xl font-black">Ishlanayotgan blogerlar</h2>
        </div>
        <span className="count-pill amber">{rows.length} ta jarayonda</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nickname</th>
              <th>Mahsulot yuborilgan sana</th>
              <th>Hamkorlik turi</th>
              <th>Mas’ul xodim</th>
              <th>Brend</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.historyId}>
                <td>
                  <a className="nickname-link" href={instagramUrl(b.nickname)} target="_blank" rel="noreferrer">
                    {b.nickname}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <small>Instagram profilini ochish</small>
                </td>
                <td>{formatDdMmYyyy(b.date)}</td>
                <td>
                  <Badge type={b.collaborationType} />
                </td>
                <td>{b.manager || 'Belgilanmagan'}</td>
                <td>
                  <BrandBadge brand={b.brand} />
                </td>
                <td>
                  <button
                    disabled={!canEdit}
                    onClick={() => onComplete(b.id, b.historyId)}
                    className="complete-button"
                  >
                    <Check className="h-4 w-4" />
                    Bajarildi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty text="Hozir ishlanayotgan blogerlar yo‘q." />}
      </div>
    </div>
  );
}

const Badge = ({ type }: { type: CollaborationType }) => (
  <span className={type === 'paid' ? 'badge paid' : 'badge barter'}>{typeLabel(type)}</span>
);

const BrandBadge = ({ brand }: { brand: BrandType }) =>
  brand === 'mio_home' ? (
    <span className="brand-badge home">
      <img src={mioHomeLogo} alt="MIO HOME" className="brand-logo" />
      MIO HOME
    </span>
  ) : (
    <span className="brand-badge beauty">
      <img src={mioBeautyLogo} alt="MIO Beauty" className="brand-logo" />
      MIO Beauty
    </span>
  );

const Empty = ({ text }: { text: string }) => (
  <div className="empty">
    <Instagram className="mx-auto mb-2 h-8 w-8 text-slate-300" />
    <p>{text}</p>
  </div>
);

function NotificationModal({ items, onClose, onComplete, canEdit }: any) {
  return (
    <Modal title="Bildirishnomalar" onClose={onClose}>
      <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        Quyidagi blogerlar mahsulot yuborilganidan beri <b>5 kun ichida</b> reklama joylashtirmagan.
      </div>
      {items.length === 0 ? (
        <Empty text="Hozircha tasdiqlanmagan kechikkan blogerlar yo‘q." />
      ) : (
        <div className="space-y-3">
          {items.map((b: WorkingItem) => (
            <div key={b.historyId} className="notice-item">
              <div>
                <a className="font-black text-slate-900" href={instagramUrl(b.nickname)} target="_blank" rel="noreferrer">
                  {b.nickname}
                </a>
                <p className="mt-1 text-xs text-slate-500">
                  Yuborilgan: {formatDdMmYyyy(b.date)} · {dayDiff(b.date)} kun · {brandLabel(b.brand)}
                </p>
              </div>
              <button
                disabled={!canEdit}
                onClick={() => {
                  onComplete(b.id, b.historyId);
                  if (items.length === 1) onClose();
                }}
                className="complete-button"
              >
                Bajarildi
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function AddModal({ onClose, onSubmit, existing }: any) {
  const [n, setN] = useState('');
  const [d, setD] = useState(formatDdMmYyyy(new Date().toISOString().slice(0, 10)));
  const [brand, setBrand] = useState<BrandType>('mio_beauty');
  const [type, setType] = useState<CollaborationType>('barter');
  const [m, setM] = useState('');
  const [nm, setNm] = useState('');
  const [e, setE] = useState('');

  const managers = Array.from(
    new Set(existing.map((b: Blogger) => b.manager).filter(Boolean))
  ) as string[];

  const submit = async (x: React.FormEvent) => {
    x.preventDefault();
    if (!n.trim() || !d.trim()) return setE('Nickname va sanani kiriting.');
    const isoDate = toIsoDate(d);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      return setE('Sanani dd/mm/yyyy formatida kiriting (masalan: 05/10/2026).');
    }
    try {
      await onSubmit({
        nickname: n,
        date: isoDate,
        brand,
        collaborationType: type,
        manager: m || nm,
      });
    } catch (err: any) {
      setE(err.message);
    }
  };

  return (
    <Modal title="Bloger qo‘shish" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="field-label">
          Bloger nickname’i
          <input
            autoFocus
            className="control mt-2"
            value={n}
            onChange={(x: any) => setN(x.target.value)}
            placeholder="@bloger_nickname"
          />
        </label>
        <label className="field-label">
          Mahsulot yuborilgan sana (dd/mm/yyyy)
          <input
            className="control mt-2"
            value={d}
            onChange={(x: any) => setD(x.target.value)}
            placeholder="dd/mm/yyyy (masalan: 05/10/2026)"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Brend
            <select className="control mt-2" value={brand} onChange={(x: any) => setBrand(x.target.value as BrandType)}>
              <option value="mio_beauty">MIO Beauty</option>
              <option value="mio_home">MIO HOME</option>
            </select>
          </label>
          <label className="field-label">
            Hamkorlik turi
            <select className="control mt-2" value={type} onChange={(x: any) => setType(x.target.value as CollaborationType)}>
              <option value="barter">Barter</option>
              <option value="paid">Pulli</option>
            </select>
          </label>
        </div>
        <label className="field-label">
          Mas’ul shaxs
          <select className="control mt-2" value={m} onChange={(x: any) => setM(x.target.value)}>
            <option value="">Hozircha belgilanmagan</option>
            {managers.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Ro‘yxatda bo‘lmasa yangi mas’ul qo‘shish
          <input
            className="control mt-2"
            value={nm}
            onChange={(x: any) => setNm(x.target.value)}
            placeholder="Mas’ul xodim ismi"
          />
        </label>
        {e && <p className="text-sm font-semibold text-rose-600">{e}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="outline-button flex-1">
            Bekor qilish
          </button>
          <button className="primary-button flex-1">
            <Plus className="h-4 w-4" />
            Saqlash
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="eyebrow">MIO workspace</p>
            <h2 className="mt-1 text-2xl font-black">{title}</h2>
          </div>
          <button onClick={onClose} className="icon-button">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
