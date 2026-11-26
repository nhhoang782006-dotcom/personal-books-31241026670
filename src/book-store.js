export const STORAGE_KEY = 'personal-books:v1';
export const STATUSES = Object.freeze(['unread', 'reading', 'read']);

export function normalizeBook(input, now = new Date().toISOString()) {
  const title = String(input.title ?? '').trim();
  const author = String(input.author ?? '').trim();
  if (!title) throw new TypeError('Vui lòng nhập tên sách.');
  if (!author) throw new TypeError('Vui lòng nhập tên tác giả.');
  const status = STATUSES.includes(input.status) ? input.status : 'unread';
  return {
    id: input.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    author,
    genre: String(input.genre ?? '').trim() || 'Khác',
    status,
    notes: String(input.notes ?? '').trim(),
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

export function parseBooks(raw) {
  if (raw === null || raw === '') return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new TypeError('Dữ liệu tủ sách không đúng định dạng.');
  return parsed.map((book) => normalizeBook(book, book.updatedAt || book.createdAt || new Date().toISOString()));
}

export function addBook(books, input, now) {
  return [normalizeBook(input, now), ...books];
}

export function updateBook(books, id, changes, now) {
  let found = false;
  const next = books.map((book) => {
    if (book.id !== id) return book;
    found = true;
    return normalizeBook({ ...book, ...changes, id, createdAt: book.createdAt }, now);
  });
  if (!found) throw new RangeError('Không tìm thấy sách cần cập nhật.');
  return next;
}

export function removeBook(books, id) {
  return books.filter((book) => book.id !== id);
}

export function calculateStats(books) {
  const byStatus = { unread: 0, reading: 0, read: 0 };
  const byGenre = {};
  for (const book of books) {
    if (STATUSES.includes(book.status)) byStatus[book.status] += 1;
    const genre = book.genre || 'Khác';
    byGenre[genre] = (byGenre[genre] || 0) + 1;
  }
  return {
    total: books.length,
    ...byStatus,
    readRate: books.length ? Math.round((byStatus.read / books.length) * 100) : 0,
    byGenre: Object.entries(byGenre).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi')),
  };
}

export function loadBooks(storage = globalThis.localStorage) {
  return parseBooks(storage.getItem(STORAGE_KEY));
}

export function saveBooks(books, storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(books));
}
