<?php
require_once __DIR__ . '/app/config/database.php';
require_once __DIR__ . '/app/models/Location.php';

$slug = 'ba-ria-vung-tau';
$locationModel = new Location();
$location = $locationModel->findBySlug($slug);

header('Content-Type: application/json');
echo json_encode($location, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
