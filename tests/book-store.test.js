import test from 'node:test';
import assert from 'node:assert/strict';
import { addBook, calculateStats, loadBooks, normalizeBook, parseBooks, removeBook, saveBooks, updateBook, STORAGE_KEY } from '../src/book-store.js';

test('add trims required fields, applies defaults, and records creation time', () => {
  const [book] = addBook([], { title: '  Dế Mèn  ', author: '  Tô Hoài  ' }, '2026-11-26T01:00:00.000Z');
  assert.equal(book.title, 'Dế Mèn');
  assert.equal(book.author, 'Tô Hoài');
  assert.equal(book.genre, 'Khác');
  assert.equal(book.status, 'unread');
  assert.equal(book.createdAt, '2026-11-26T01:00:00.000Z');
});

test('rejects blank title and author', () => {
  assert.throws(() => normalizeBook({ title: ' ', author: 'Tác giả' }), /tên sách/);
  assert.throws(() => normalizeBook({ title: 'Tên sách', author: ' ' }), /tên tác giả/);
});

test('update preserves ID and created time while changing status', () => {
  const [book] = addBook([], { title: 'Nhà giả kim', author: 'Paulo Coelho' }, '2026-01-01');
  const [updated] = updateBook([book], book.id, { status: 'read', title: ' Nhà giả kim ' }, '2026-02-01');
  assert.equal(updated.id, book.id);
  assert.equal(updated.createdAt, '2026-01-01');
  assert.equal(updated.updatedAt, '2026-02-01');
  assert.equal(updated.title, 'Nhà giả kim');
  assert.equal(updated.status, 'read');
});

test('remove affects only the matching book', () => {
  const books = addBook([], { title: 'A', author: 'Tác giả A' });
  const [first] = books;
  const second = addBook(books, { title: 'B', author: 'Tác giả B' });
  assert.deepEqual(removeBook(second, first.id).map((book) => book.title), ['B']);
});

test('calculates all status, read-rate, and genre totals', () => {
  let books = addBook([], { title: 'A', author: 'A', genre: 'Văn học', status: 'read' });
  books = addBook(books, { title: 'B', author: 'B', genre: 'Văn học', status: 'reading' });
  books = addBook(books, { title: 'C', author: 'C', genre: 'Khoa học' });
  assert.deepEqual(calculateStats(books), { total: 3, unread: 1, reading: 1, read: 1, readRate: 33, byGenre: [['Văn học', 2], ['Khoa học', 1]] });
  assert.equal(calculateStats([]).readRate, 0);
});

test('reads and writes the namespaced localStorage key', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const books = addBook([], { title: 'Sách', author: 'Bạn đọc' });
  saveBooks(books, storage);
  assert.equal(values.has(STORAGE_KEY), true);
  assert.equal(loadBooks(storage)[0].title, 'Sách');
});

test('empty storage loads an empty shelf and malformed data is reported', () => {
  assert.deepEqual(parseBooks(null), []);
  assert.throws(() => parseBooks('{'), SyntaxError);
  assert.throws(() => parseBooks('{"books":[]}'), /định dạng/);
});
