-- 1. Cập nhật bảng users để hỗ trợ Auth Provider và Trạng thái xác thực
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2. Bảo vệ dữ liệu Mock: Tự động xác thực và gán provider 'mock' cho các tài khoản cũ
-- Điều kiện: ID <= 25 (theo yêu cầu) hoặc email không phải gmail (thường là dữ liệu mẫu)
UPDATE users 
SET auth_provider = 'mock', is_verified = TRUE 
WHERE id <= 25 OR email NOT LIKE '%@gmail.com';

-- 3. Tạo bảng quản lý mã OTP khôi phục mật khẩu
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(5) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index để tìm kiếm nhanh theo email
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
