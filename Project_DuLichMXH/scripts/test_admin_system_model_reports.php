<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\AdminSystemModel;

try {
    $model = new AdminSystemModel();
    $result = $model->getReports(1, 10, 'pending');
    
    echo "🔍 KẾT QUẢ TRẢ VỀ CỦA AdminSystemModel->getReports():\n";
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
