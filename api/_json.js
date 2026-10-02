import fs from 'node:fs';
import path from 'node:path';

const DATA_FILE = path.join(process.cwd(), 'data', 'bloggers.json');

export function normalizeNickname(nickname) {
  return `@${String(nickname || '').trim().replace(/^@+/, '')}`;
}

export function getBloggers() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveBloggers(bloggers) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(bloggers, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

export function jsonError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}
