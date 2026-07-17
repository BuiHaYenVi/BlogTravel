# Hướng dẫn chi tiết thiết lập hệ thống Gody.vn

Chào bạn, đây là hướng dẫn từng bước để bạn vận hành website với dữ liệu thực từ PostgreSQL.

## 1. Thiết lập Cơ sở dữ liệu (PostgreSQL)

1.  **Cài đặt PostgreSQL**: Nếu bạn dùng Laragon, hãy mở Laragon -> Tools -> Quick add -> PostgreSQL. Hoặc tải bản cài đặt từ [PostgreSQL Official](https://www.postgresql.org/download/windows/).
2.  **Tạo Database**:
    *   Mở công cụ quản lý (pgAdmin hoặc DBeaver).
    *   Kết nối tới Server (thường là localhost:5432).
    *   Tạo một Database mới tên là: `dulichmxh`.
3.  **Chạy Script SQL**:
    *   Mở file `database_schema.sql` trong dự án.
    *   Copy toàn bộ nội dung và dán vào cửa sổ Query Tool của Database `dulichmxh`.
    *   Nhấn **Execute** (F5) để tạo các bảng và dữ liệu mẫu.

> [!TIP]
> **Lưu ý về Laragon**: Trong ảnh bạn gửi, PostgreSQL đang ở cổng 5432 nhưng có vẻ chưa được kích hoạt. Hãy chuột phải vào nút **Start All** (hoặc vùng trống) -> **PostgreSQL** -> **Quick add** -> **postgresql-13** (hoặc bản mới nhất) để Laragon tải và cài đặt tự động nếu nút Start không hiện xanh cho PostgreSQL.

## 2. Cấu hình Backend (PHP MVC)

1.  **Kiểm tra kết nối**: Mở file `Project_DuLichMXH/app/config/database.php` và đảm bảo các thông số `user` và `pass` khớp với tài khoản PostgreSQL của bạn.
2.  **Cài đặt Composer**: Mở terminal tại thư mục `Project_DuLichMXH` và chạy lệnh:
    ```bash
    composer install
    ```
    *(Điều này cần thiết để tải thư viện JWT).*

## 3. Kết nối Frontend (React)

1.  **Cấu hình API URL**: Mở file `.env` ở thư mục gốc của frontend (hoặc tạo mới) và thêm:
    ```env
    VITE_API_URL=http://localhost:90/Project_DuLichMXH/public/api
    ```
    *(Lưu ý: Tôi thấy Laragon của bạn đang chạy Apache ở cổng **90**, nên URL cần có thêm `:90`).*
2.  **Chạy dự án**:
    *   Đảm bảo Laragon đang chạy Apache và PostgreSQL.
    *   Tại thư mục frontend, chạy `npm run dev`.

---

## Các thao tác quan trọng khác

- **JWT Secret**: Bạn có thể thay đổi JWT Secret Key trong file `app/config/app.php` để tăng tính bảo mật.
- **CORS**: File `public/index.php` đã được cấu hình để cho phép React truy cập. Nếu bạn gặp lỗi CORS, hãy kiểm tra lại header `Access-Control-Allow-Origin` trong file đó.
