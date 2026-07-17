<?php
/**
 * API endpoint to list province images (excluding DiemDuLich subfolder).
 * Usage: GET /63TinhThanhVN/list_images.php?province=HaNoi
 * Returns JSON array of image filenames.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$province = $_GET['province'] ?? '';

// Sanitize input to prevent directory traversal
$province = basename($province);

if (empty($province)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing province parameter']);
    exit;
}

$dir = __DIR__ . '/' . $province;

if (!is_dir($dir)) {
    http_response_code(404);
    echo json_encode(['error' => 'Province folder not found', 'images' => []]);
    exit;
}

$images = [];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

$files = scandir($dir);
foreach ($files as $file) {
    // Skip directories (including DiemDuLich, ., ..)
    if (is_dir($dir . '/' . $file)) {
        continue;
    }
    
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (in_array($ext, $allowedExtensions)) {
        $images[] = $file;
    }
}

// Sort for consistent ordering
sort($images);

echo json_encode([
    'province' => $province,
    'count' => count($images),
    'images' => $images
], JSON_UNESCAPED_UNICODE);
