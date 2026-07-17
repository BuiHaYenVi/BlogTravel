<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\Report;

// Mock session hoặc dùng direct model call
try {
    $reportModel = new Report();
    $result = $reportModel->getReportsForAdmin([], 1, 10);
    
    echo "🔍 DỮ LIỆU ĐẦU RA CỦA MODEL getReportsForAdmin():\n";
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
