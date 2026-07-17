-- Thêm các cột thiếu cho bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Cập nhật kiểu dữ liệu nếu cột đã tồn tại nhưng sai kiểu (tùy chọn)
ALTER TABLE users ALTER COLUMN interests TYPE TEXT;
ALTER TABLE users ALTER COLUMN bio TYPE TEXT;
