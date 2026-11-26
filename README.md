# Tủ Sách — Quản lý sách cá nhân

Ứng dụng web tiếng Việt để quản lý danh sách sách cá nhân, theo dõi trạng thái đọc và xem thống kê theo thể loại.

## Chức năng

- Thêm, sửa, xóa sách; cập nhật trạng thái Chưa đọc / Đang đọc / Đã đọc.
- Tìm kiếm theo tên, tác giả, thể loại; lọc theo trạng thái và sắp xếp danh sách.
- Thống kê số sách theo trạng thái, tỷ lệ đã đọc và số lượng theo thể loại.
- Lưu dữ liệu trong `localStorage` của trình duyệt hiện tại. Dữ liệu không tự đồng bộ giữa thiết bị hoặc trình duyệt.

## Chạy tại máy

Cần có Python 3 hoặc Node.js. Từ thư mục dự án, chạy một trong lệnh sau rồi mở địa chỉ hiện ra:

```powershell
python -m http.server 5173
```

hoặc:

```powershell
npx serve .
```

Mở `http://localhost:5173` khi dùng Python. Không mở `index.html` trực tiếp bằng `file://`, vì trình duyệt chặn JavaScript module trong chế độ đó.

## Kiểm tra

```powershell
node --test
```

## Triển khai

Đây là web tĩnh, có thể xuất bản từ nhánh `main` trên GitHub Pages. Không có backend hoặc cơ sở dữ liệu dùng chung; dữ liệu chỉ nằm trên trình duyệt của người sử dụng.
