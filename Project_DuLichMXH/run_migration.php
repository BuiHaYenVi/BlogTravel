<?php

$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $_ENV[trim($parts[0])] = trim($parts[1]);
        }
    }
}

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '5432';
$dbname = $_ENV['DB_NAME'] ?? 'dulichmxh';
$user = $_ENV['DB_USER'] ?? 'postgres';
$password = $_ENV['DB_PASSWORD'] ?? '';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $sql = "
    -- 1. Cập nhật bảng users để hỗ trợ Auth Provider và Trạng thái xác thực
    ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
    
    -- 2. Bảo vệ dữ liệu Mock: Tự động xác thực và gán provider 'mock' cho các tài khoản cũ
    UPDATE users SET auth_provider = 'mock', is_verified = TRUE WHERE id <= 25 OR email NOT LIKE '%@gmail.com';
    
    -- 3. Tạo bảng quản lý mã OTP khôi phục mật khẩu
    CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(5) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
    ";

    $pdo->exec($sql);
    echo "👉 Nâng cấp Database thành công rực rỡ!\n";
} catch (PDOException $e) {
    echo "Lỗi CSDL: " . $e->getMessage() . "\n";
}
