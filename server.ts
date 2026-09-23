import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// Persistent data directory & file
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bloggers.json');

export interface CollaborationHistoryItem {
  id: string;
  date: string;
  collaborationType: 'barter' | 'paid';
  brand: 'mio_beauty' | 'mio_home';
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string | null;
  notes?: string;
  category?: string;
  manager?: string;
  time?: string;
}

export interface BloggerRecord {
  id: string;
  nickname: string;
  date: string;
  collaborationType: 'barter' | 'paid';
  brand: 'mio_beauty' | 'mio_home';
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string | null;
  notes?: string;
  category?: string;
  manager?: string;
  time?: string;
  audience?: string;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  history: CollaborationHistoryItem[];
}

const initialDemoBloggers: BloggerRecord[] = [
  {
    id: 'demo-1',
    nickname: '@madina_beauty_uz',
    date: '2026-09-22',
    collaborationType: 'barter',
    brand: 'mio_beauty',
    status: 'pending',
    category: 'Namlantiruvchi Sarum & Essensiya',
    manager: 'Kamola Rustamova',
    time: '14:30 (Story seriya)',
    audience: '320k obunachi',
    notes: 'MIO Beauty gialuronli sarum obzori',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    completedAt: null,
    history: [
      {
        id: 'h-1-3',
        date: '2026-09-22',
        collaborationType: 'barter',
        brand: 'mio_beauty',
        status: 'pending',
        category: 'Namlantiruvchi Sarum & Essensiya',
        manager: 'Kamola Rustamova',
        time: '14:30 (Story seriya)',
        notes: 'MIO Beauty gialuronli sarum obzori',
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: 'h-1-2',
        date: '2026-08-15',
        collaborationType: 'paid',
        brand: 'mio_beauty',
        status: 'completed',
        category: 'SPF 50+ Quyoshdan Himoya Kremi',
        manager: 'Kamola Rustamova',
        time: '18:00 (Obzor)',
        notes: 'SPF krem sinovi va video sharh',
        createdAt: '2026-08-15T09:00:00.000Z',
        completedAt: '2026-08-16T15:00:00.000Z',
      },
      {
        id: 'h-1-1',
        date: '2026-07-03',
        collaborationType: 'barter',
        brand: 'mio_beauty',
        status: 'completed',
        category: 'Gialuron Kislotali Penka',
        manager: 'Sevara Karimova',
        time: '11:00 (Reels)',
        notes: 'Birinchi hamkorlik sinovi',
        createdAt: '2026-07-03T10:00:00.000Z',
        completedAt: '2026-07-04T12:00:00.000Z',
      },
    ],
  },
  {
    id: 'demo-2',
    nickname: '@nodira_uy_bekasi',
    date: '2026-09-21',
    collaborationType: 'paid',
    brand: 'mio_home',
    status: 'pending',
    category: 'Kir Yuvish Geli (Universal)',
    manager: 'Javohir Alimov',
    time: '18:00 (Obzor / Review)',
    audience: '185k obunachi',
    notes: 'MIO Home kir yuvish geli va dog‘ ketkazuvchi',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    completedAt: null,
    history: [
      {
        id: 'h-2-2',
        date: '2026-09-21',
        collaborationType: 'paid',
        brand: 'mio_home',
        status: 'pending',
        category: 'Kir Yuvish Geli (Universal)',
        manager: 'Javohir Alimov',
        time: '18:00 (Obzor / Review)',
        notes: 'MIO Home kir yuvish geli va dog‘ ketkazuvchi',
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: 'h-2-1',
        date: '2026-08-10',
        collaborationType: 'barter',
        brand: 'mio_home',
        status: 'completed',
        category: 'Idish Yuvish Vositasi',
        manager: 'Javohir Alimov',
        time: '14:30 (Story)',
        notes: 'Oshxona idish yuvish vositalari',
        createdAt: '2026-08-10T08:00:00.000Z',
        completedAt: '2026-08-11T16:00:00.000Z',
      },
    ],
  },
  {
    id: 'demo-3',
    nickname: '@dilnoza_dermatolog',
    date: '2026-09-22',
    collaborationType: 'barter',
    brand: 'mio_beauty',
    status: 'pending',
    category: 'SPF 50+ Quyoshdan Himoya Kremi',
    manager: 'Kamola Rustamova',
    time: '11:00 (Reels / Post)',
    audience: '410k obunachi',
    notes: 'Tarkibiy tahlil va SPF sinovi',
    createdAt: new Date().toISOString(),
    completedAt: null,
    history: [
      {
        id: 'h-3-1',
        date: '2026-09-22',
        collaborationType: 'barter',
        brand: 'mio_beauty',
        status: 'pending',
        category: 'SPF 50+ Quyoshdan Himoya Kremi',
        manager: 'Kamola Rustamova',
        time: '11:00 (Reels / Post)',
        notes: 'Tarkibiy tahlil va SPF sinovi',
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
    ],
  },
  {
    id: 'demo-4',
    nickname: '@shaxzod_lifestyle',
    date: '2026-09-20',
    collaborationType: 'paid',
    brand: 'mio_home',
    status: 'pending',
    category: 'Konsentrlangan Idish Yuvish Vositasi',
    manager: 'Bobur Mansurov',
    time: '20:00 (Prime time)',
    audience: '290k obunachi',
    notes: 'Yangi olma va limon iforli vositalar',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    completedAt: null,
    history: [
      {
        id: 'h-4-1',
        date: '2026-09-20',
        collaborationType: 'paid',
        brand: 'mio_home',
        status: 'pending',
        category: 'Konsentrlangan Idish Yuvish Vositasi',
        manager: 'Bobur Mansurov',
        time: '20:00 (Prime time)',
        notes: 'Yangi olma va limon iforli vositalar',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        completedAt: null,
      },
    ],
  },
  {
    id: 'demo-5',
    nickname: '@rayhona_cosmetics',
    date: '2026-09-18',
    collaborationType: 'barter',
    brand: 'mio_beauty',
    status: 'completed',
    category: 'Tungi Tiklovchi Yuz Kremi',
    manager: 'Sevara Karimova',
    time: '14:30 (Story seriya)',
    audience: '150k obunachi',
    notes: 'Krem ta\'siri va natijasi haqida',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    history: [
      {
        id: 'h-5-2',
        date: '2026-09-18',
        collaborationType: 'barter',
        brand: 'mio_beauty',
        status: 'completed',
        category: 'Tungi Tiklovchi Yuz Kremi',
        manager: 'Sevara Karimova',
        time: '14:30 (Story seriya)',
        notes: 'Krem ta\'siri va natijasi haqida',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: 'h-5-1',
        date: '2026-08-01',
        collaborationType: 'barter',
        brand: 'mio_beauty',
        status: 'completed',
        category: 'Yuz Sarumi',
        manager: 'Sevara Karimova',
        time: '11:00',
        notes: 'Dastlabki tanishtiruv',
        createdAt: '2026-08-01T10:00:00.000Z',
        completedAt: '2026-08-02T12:00:00.000Z',
      },
    ],
  },
  {
    id: 'demo-6',
    nickname: '@uyim_shinam',
    date: '2026-09-15',
    collaborationType: 'paid',
    brand: 'mio_home',
    status: 'completed',
    category: 'Antibakterial Ko‘pikli Qo‘l Sovuni',
    manager: 'Javohir Alimov',
    time: '18:00 (Obzor / Review)',
    audience: '520k obunachi',
    notes: 'Qo‘l parvarishi va tozaligi',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 180).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    history: [
      {
        id: 'h-6-1',
        date: '2026-09-15',
        collaborationType: 'paid',
        brand: 'mio_home',
        status: 'completed',
        category: 'Antibakterial Ko‘pikli Qo‘l Sovuni',
        manager: 'Javohir Alimov',
        time: '18:00 (Obzor / Review)',
        notes: 'Qo‘l parvarishi va tozaligi',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 180).toISOString(),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      },
    ],
  },
];

function readBloggers(): BloggerRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialDemoBloggers, null, 2), 'utf8');
      return initialDemoBloggers;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const rawList: any[] = JSON.parse(data);

    // Ensure strictly unique bloggers by nickname and populate history
    const uniqueMap = new Map<string, BloggerRecord>();

    for (const item of rawList) {
      const normalizedNick = normalizeNickname(item.nickname || '@noma_lum');
      const cleanKey = normalizedNick.replace(/^@/, '').toLowerCase();

      if (!uniqueMap.has(cleanKey)) {
        // Initialize history
        const history: CollaborationHistoryItem[] = Array.isArray(item.history) && item.history.length > 0
          ? item.history
          : [
              {
                id: `${item.id || 'c'}-init`,
                date: item.date || '2026-09-22',
                collaborationType: item.collaborationType || 'barter',
                brand: item.brand || 'mio_beauty',
                status: item.status || 'completed',
                createdAt: item.createdAt || new Date().toISOString(),
                completedAt: item.completedAt || null,
                notes: item.notes,
                category: item.category,
                manager: item.manager,
                time: item.time,
              },
            ];

        uniqueMap.set(cleanKey, {
          ...item,
          nickname: normalizedNick,
          history,
        });
      } else {
        // Merge into existing blogger's history if duplicate existed
        const existing = uniqueMap.get(cleanKey)!;
        const subHistory: CollaborationHistoryItem[] = Array.isArray(item.history) && item.history.length > 0
          ? item.history
          : [
              {
                id: `${item.id || 'c'}-merged`,
                date: item.date || '2026-09-22',
                collaborationType: item.collaborationType || 'barter',
                brand: item.brand || 'mio_beauty',
                status: item.status || 'completed',
                createdAt: item.createdAt || new Date().toISOString(),
                completedAt: item.completedAt || null,
                notes: item.notes,
                category: item.category,
                manager: item.manager,
                time: item.time,
              },
            ];

        for (const sub of subHistory) {
          if (!existing.history.some((h) => h.id === sub.id)) {
            existing.history.push(sub);
          }
        }
      }
    }

    const result = Array.from(uniqueMap.values());
    return result;
  } catch (err) {
    console.error('Error reading bloggers data:', err);
    return initialDemoBloggers;
  }
}

function writeBloggers(bloggers: BloggerRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(bloggers, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing bloggers data:', err);
  }
}

function normalizeNickname(nick: string): string {
  const clean = nick.trim().replace(/^@+/, '');
  return `@${clean}`;
}

// REST API Endpoints
app.get('/api/bloggers', (_req, res) => {
  const bloggers = readBloggers();
  res.json({ success: true, data: bloggers });
});

app.post('/api/bloggers', (req, res) => {
  const { nickname, date, collaborationType, brand, category, manager, time, audience, notes } = req.body;

  if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
    res.status(400).json({ success: false, error: "Bloger nickname'ini kiriting." });
    return;
  }

  if (!date) {
    res.status(400).json({ success: false, error: 'Sanani tanlang.' });
    return;
  }

  const validTypes = ['barter', 'paid'];
  const validBrands = ['mio_beauty', 'mio_home'];

  const type = validTypes.includes(collaborationType) ? collaborationType : 'barter';
  const br = validBrands.includes(brand) ? brand : 'mio_beauty';

  const normalized = normalizeNickname(nickname);
  const cleanKey = normalized.replace(/^@/, '').toLowerCase();

  const bloggers = readBloggers();

  // Find existing blogger by nickname (case-insensitive)
  const existingIndex = bloggers.findIndex(
    (b) => b.nickname.replace(/^@/, '').toLowerCase() === cleanKey
  );

  const newCollabItem: CollaborationHistoryItem = {
    id: `collab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date,
    collaborationType: type,
    brand: br,
    status: 'pending',
    category: category || undefined,
    manager: manager?.trim() || undefined,
    time: time || '14:30 (Story seriya)',
    notes: notes || undefined,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  if (existingIndex !== -1) {
    // REPEAT COLLABORATION: Update existing blogger and append to history
    const existing = bloggers[existingIndex];

    if (existing.isBlacklisted) {
      res.status(400).json({
        success: false,
        error: 'Ushbu bloger qora ro‘yxatda. Hamkorlik kiritib bo‘lmaydi.',
      });
      return;
    }

    if (!Array.isArray(existing.history)) {
      existing.history = [];
    }

    // Add new collaboration to top of history
    existing.history.unshift(newCollabItem);

    // Update blogger's latest visible fields
    existing.date = date;
    existing.collaborationType = type;
    existing.brand = br;
    existing.status = 'pending'; // Active task in "Ishlanayotganlar"
    existing.completedAt = null;
    if (category !== undefined) existing.category = category || undefined;
    if (manager !== undefined) existing.manager = manager.trim() || undefined;
    if (notes !== undefined) existing.notes = notes || undefined;
    if (audience) existing.audience = audience;

    writeBloggers(bloggers);
    res.status(200).json({ success: true, data: existing, isRepeat: true });
    return;
  }

  // NEW BLOGGER: Create new blogger with single history entry
  const newBlogger: BloggerRecord = {
    id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    nickname: normalized,
    date,
    collaborationType: type,
    brand: br,
    status: 'pending', // active in Ishlanayotganlar, listed in Barchasi
    category: category || undefined,
    manager: manager?.trim() || undefined,
    time: time || '14:30 (Story seriya)',
    audience: audience || '250k obunachi',
    notes: notes || undefined,
    createdAt: new Date().toISOString(),
    completedAt: null,
    history: [newCollabItem],
  };

  bloggers.unshift(newBlogger);
  writeBloggers(bloggers);

  res.status(201).json({ success: true, data: newBlogger, isRepeat: false });
});

app.patch('/api/bloggers/:id/complete', (req, res) => {
  const { id } = req.params;
  const bloggers = readBloggers();
  const index = bloggers.findIndex((b) => b.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Bloger topilmadi.' });
    return;
  }

  const now = new Date().toISOString();
  bloggers[index].status = 'completed';
  bloggers[index].completedAt = now;

  // Mark all pending history items as completed
  if (Array.isArray(bloggers[index].history)) {
    bloggers[index].history.forEach((h) => {
      if (h.status === 'pending') {
        h.status = 'completed';
        h.completedAt = now;
      }
    });
  }

  writeBloggers(bloggers);
  res.json({ success: true, data: bloggers[index] });
});

app.patch('/api/bloggers/:id/reopen', (req, res) => {
  const { id } = req.params;
  const bloggers = readBloggers();
  const index = bloggers.findIndex((b) => b.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Bloger topilmadi.' });
    return;
  }

  bloggers[index].status = 'pending';
  bloggers[index].completedAt = null;

  if (Array.isArray(bloggers[index].history) && bloggers[index].history.length > 0) {
    bloggers[index].history[0].status = 'pending';
    bloggers[index].history[0].completedAt = null;
  }

  writeBloggers(bloggers);
  res.json({ success: true, data: bloggers[index] });
});

app.delete('/api/bloggers/:id', (req, res) => {
  const { id } = req.params;
  let bloggers = readBloggers();
  const initialLength = bloggers.length;
  bloggers = bloggers.filter((b) => b.id !== id);

  if (bloggers.length === initialLength) {
    res.status(404).json({ success: false, error: 'Bloger topilmadi.' });
    return;
  }

  writeBloggers(bloggers);
  res.json({ success: true });
});

app.post('/api/reset-demo', (_req, res) => {
  writeBloggers(initialDemoBloggers);
  res.json({ success: true, data: initialDemoBloggers });
});

// Vite / Static setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MIO Blogger Management Server running on port ${PORT}`);
  });
}

startServer();
