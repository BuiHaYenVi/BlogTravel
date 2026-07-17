<?php
require_once __DIR__ . '/app/models/Location.php';
require_once __DIR__ . '/app/config/database.php';

$locationModel = new Location();
$slug = 'ha-noi'; // Thử nghiệm với Hà Nội (ID: 1)
$data = $locationModel->getFullDetail($slug);

echo "--- API Data for $slug ---\n";
if ($data) {
    echo "ID: {$data['id']}, Name: {$data['name']}\n";
    echo "Blogs count: " . count($data['blogs'] ?? []) . "\n";
    if (!empty($data['blogs'])) {
        foreach ($data['blogs'] as $b) {
            echo " - Blog ID: {$b['id']}, Title: {$b['title']}, Status: {$b['status']}\n";
        }
    }
} else {
    echo "Location not found!\n";
}
