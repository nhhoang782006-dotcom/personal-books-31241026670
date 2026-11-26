import { addBook, calculateStats, loadBooks, removeBook, saveBooks, updateBook } from './book-store.js';

const $ = (selector) => document.querySelector(selector);
const list = $('#book-list');
const bookDialog = $('#book-dialog');
const deleteDialog = $('#delete-dialog');
const form = $('#book-form');
const toast = $('#toast');
const statusLabels = { unread: 'Chưa đọc', reading: 'Đang đọc', read: 'Đã đọc' };
const covers = ['cover-olive', '', 'cover-rust', 'cover-gold', 'cover-blue', 'cover-plum'];
let books = [];
let activeFilter = 'all';
let deleteId = null;
let toastTimer;

function notify(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function setStorageError(message = '') {
  const error = $('#storage-error');
  error.textContent = message;
  error.hidden = !message;
}

function persist(nextBooks) {
  try {
    saveBooks(nextBooks);
    books = nextBooks;
    render();
    setStorageError();
    return true;
  } catch {
    setStorageError('Không thể lưu vào trình duyệt. Hãy bật bộ nhớ trang web rồi thử lại.');
    return false;
  }
}

function clearErrors() {
  $('#title-error').textContent = '';
  $('#author-error').textContent = '';
  $('#book-title').removeAttribute('aria-invalid');
  $('#book-author').removeAttribute('aria-invalid');
  setStorageError();
}

function openForm(book = null) {
  form.reset();
  clearErrors();
  $('#book-id').value = book?.id ?? '';
  $('#book-title').value = book?.title ?? '';
  $('#book-author').value = book?.author ?? '';
  $('#book-genre').value = book?.genre ?? 'Khác';
  $('#book-status').value = book?.status ?? 'unread';
  $('#book-notes').value = book?.notes ?? '';
  $('#dialog-title').textContent = book ? 'Chỉnh sửa thông tin' : 'Cuốn sách mới';
  $('.dialog-heading .eyebrow').textContent = book ? 'CẬP NHẬT BỘ SƯU TẬP' : 'THÊM VÀO BỘ SƯU TẬP';
  $('#save-book').textContent = book ? 'Lưu thay đổi' : 'Lưu vào kệ sách';
  bookDialog.showModal();
  requestAnimationFrame(() => $('#book-title').focus());
}

function closeForm() {
  bookDialog.close();
  clearErrors();
}

function makeIcon(name) {
  const paths = {
    edit: '<path d="M11 5H6a2 2 0 0 0-2 2v11h11a2 2 0 0 0 2-2v-5"/><path d="m9 15 1-.2 7.8-7.8a2.1 2.1 0 0 0-3-3L7 11l-.2 1L6.5 15 9 15Z"/>',
    trash: '<path d="M4 6h12M8 6V4h4v2m3 0-.8 11H6.8L6 6m3 3v5m3-5v5"/>',
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = paths[name];
  return svg;
}

function addCard(book, index) {
  const article = document.createElement('article');
  article.className = 'book-card';
  const cover = document.createElement('div');
  cover.className = `book-cover ${covers[index % covers.length]}`;
  const coverTitle = document.createElement('span');
  coverTitle.textContent = book.title;
  cover.append(coverTitle);
  article.append(cover);

  const menu = document.createElement('div');
  menu.className = 'book-menu';
  const top = document.createElement('div');
  top.className = 'book-card-top';
  top.append(document.createElement('span'));
  const edit = document.createElement('button');
  edit.type = 'button'; edit.className = 'icon-button'; edit.setAttribute('aria-label', `Sửa ${book.title}`); edit.append(makeIcon('edit'));
  edit.addEventListener('click', () => openForm(book));
  const remove = document.createElement('button');
  remove.type = 'button'; remove.className = 'icon-button'; remove.setAttribute('aria-label', `Xóa ${book.title}`); remove.append(makeIcon('trash'));
  remove.addEventListener('click', () => { deleteId = book.id; deleteDialog.showModal(); $('#cancel-delete').focus(); });
  menu.append(edit, remove); top.append(menu); article.append(top);

  const title = document.createElement('h3'); title.textContent = book.title;
  const author = document.createElement('p'); author.className = 'book-author'; author.textContent = `Tác giả: ${book.author}`;
  article.append(title, author);
  const meta = document.createElement('div'); meta.className = 'book-meta';
  const genre = document.createElement('span'); genre.className = 'genre-tag'; genre.textContent = book.genre;
  const status = document.createElement('select'); status.className = 'status-select'; status.setAttribute('aria-label', `Trạng thái đọc của ${book.title}`);
  for (const value of ['unread', 'reading', 'read']) {
    const option = document.createElement('option'); option.value = value; option.textContent = statusLabels[value]; option.selected = book.status === value; status.append(option);
  }
  status.addEventListener('change', () => {
    try { const next = updateBook(books, book.id, { status: status.value }); if (persist(next)) notify('Đã cập nhật trạng thái đọc.'); }
    catch (error) { notify(error.message); render(); }
  });
  meta.append(genre, status); article.append(meta);
  if (book.notes) { const notes = document.createElement('p'); notes.className = 'book-notes'; notes.textContent = book.notes; article.append(notes); }
  return article;
}

function renderEmpty(message, description, action = true) {
  const box = document.createElement('div'); box.className = 'empty-state';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 40 40'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M7 9c5-2 9-1 13 2v21c-4-3-8-4-13-2V9Zm26 0c-5-2-9-1-13 2v21c4-3 8-4 13-2V9Z" stroke-linejoin="round"/><path d="M11 15c2-.5 4-.2 6 1m12-1c-2-.5-4-.2-6 1" stroke-linecap="round"/>';
  const heading = document.createElement('h3'); heading.textContent = message;
  const text = document.createElement('p'); text.textContent = description;
  box.append(svg, heading, text);
  if (action) { const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Thêm cuốn sách đầu tiên'; button.addEventListener('click', () => openForm()); box.append(button); }
  list.append(box);
}

function renderGenres(stats) {
  const target = $('#genre-stats'); target.replaceChildren();
  if (!stats.byGenre.length) { const empty = document.createElement('p'); empty.className = 'genre-empty'; empty.textContent = 'Thể loại sẽ hiện ở đây khi bạn thêm sách.'; target.append(empty); return; }
  for (const [name, count] of stats.byGenre.slice(0, 8)) {
    const item = document.createElement('div'); item.className = 'genre-item';
    const label = document.createElement('span'); label.textContent = name;
    const value = document.createElement('strong'); value.textContent = String(count);
    item.append(label, value); target.append(item);
  }
}

function render() {
  const stats = calculateStats(books);
  $('#stat-total').textContent = stats.total;
  $('#stat-unread').textContent = stats.unread;
  $('#stat-reading').textContent = stats.reading;
  $('#stat-read').textContent = stats.read;
  $('#stat-read-rate').textContent = `${stats.readRate}%`;
  $('#count-all').textContent = stats.total;
  $('#count-unread').textContent = stats.unread;
  $('#count-reading').textContent = stats.reading;
  $('#count-read').textContent = stats.read;
  const query = $('#search-input').value.trim().toLocaleLowerCase('vi');
  const filtered = books.filter((book) => (activeFilter === 'all' || book.status === activeFilter) && `${book.title} ${book.author} ${book.genre}`.toLocaleLowerCase('vi').includes(query));
  const sort = $('#sort-select').value;
  filtered.sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'vi') : sort === 'author' ? a.author.localeCompare(b.author, 'vi') : b.updatedAt.localeCompare(a.updatedAt));
  $('#visible-count').textContent = `(${filtered.length})`;
  list.replaceChildren();
  if (!books.length) renderEmpty('Kệ sách còn đang chờ.', 'Bắt đầu bằng cuốn sách bạn đang đọc, hoặc cuốn luôn muốn đọc.', true);
  else if (!filtered.length) renderEmpty(query ? 'Chưa tìm thấy cuốn phù hợp.' : 'Kệ này chưa có sách.', query ? 'Thử từ khóa khác hoặc chọn bộ lọc khác.' : 'Những cuốn sách ở trạng thái này sẽ xuất hiện tại đây.', false);
  else filtered.forEach((book, index) => list.append(addCard(book, index)));
  renderGenres(stats);
  for (const button of document.querySelectorAll('.filter-button')) {
    const active = button.dataset.filter === activeFilter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function validate() {
  clearErrors();
  const title = $('#book-title').value.trim();
  const author = $('#book-author').value.trim();
  let valid = true;
  if (!title) { $('#title-error').textContent = 'Vui lòng nhập tên sách.'; $('#book-title').setAttribute('aria-invalid', 'true'); valid = false; }
  if (!author) { $('#author-error').textContent = 'Vui lòng nhập tên tác giả.'; $('#book-author').setAttribute('aria-invalid', 'true'); valid = false; }
  if (!valid) (title ? $('#book-author') : $('#book-title')).focus();
  return valid;
}

function saveForm(event) {
  event.preventDefault();
  if (!validate()) return;
  const id = $('#book-id').value;
  const changes = { title: $('#book-title').value, author: $('#book-author').value, genre: $('#book-genre').value, status: $('#book-status').value, notes: $('#book-notes').value };
  try {
    const next = id ? updateBook(books, id, changes) : addBook(books, changes);
    if (persist(next)) { closeForm(); notify(id ? 'Đã lưu thay đổi.' : 'Đã thêm sách vào tủ.'); }
  } catch (error) { setStorageError(error.message); }
}

$('#add-book-button').addEventListener('click', () => openForm());
$('#close-dialog').addEventListener('click', closeForm);
$('#cancel-dialog').addEventListener('click', closeForm);
form.addEventListener('submit', saveForm);
$('#search-input').addEventListener('input', render);
$('#sort-select').addEventListener('change', render);
document.querySelectorAll('.filter-button').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; render(); }));
$('#cancel-delete').addEventListener('click', () => { deleteDialog.close(); deleteId = null; });
$('#confirm-delete').addEventListener('click', () => {
  if (!deleteId) return;
  if (persist(removeBook(books, deleteId))) { deleteDialog.close(); deleteId = null; notify('Đã xóa sách khỏi tủ.'); }
});
bookDialog.addEventListener('click', (event) => { if (event.target === bookDialog) closeForm(); });
deleteDialog.addEventListener('click', (event) => { if (event.target === deleteDialog) { deleteDialog.close(); deleteId = null; } });
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); $('#search-input').focus(); }
});
$('#today-label').textContent = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()).toUpperCase();
try { books = loadBooks(); }
catch { books = []; notify('Không đọc được dữ liệu đã lưu. Hãy xuất dữ liệu cũ trước khi xóa bộ nhớ trang.'); }
render();
