<?php
namespace App\Utils;

class Env {
    private static $loaded = false;

    public static function load($path) {
        if (self::$loaded) return true;
        if (!file_exists($path)) {
            return false;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                $value = trim($value, '"\''); // Xóa dấu nháy nếu có
                if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                    putenv(sprintf('%s=%s', $name, $value));
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
        self::$loaded = true;
        return true;
    }

    public static function get($key, $default = null) {
        $value = getenv($key);
        if ($value === false) {
            return $_ENV[$key] ?? $_SERVER[$key] ?? $default;
        }
        return $value;
    }
}

// Tự động nạp tệp .env ở thư mục gốc của dự án (Project_DuLichMXH)
Env::load(__DIR__ . '/../../.env');
?>