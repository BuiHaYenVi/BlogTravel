<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/app/Models/BaseModel.php';
require_once __DIR__ . '/app/Models/Story.php';

use App\Models\Story;

$model = new Story();
$feed = $model->getActiveFeed(4);
echo json_encode($feed, JSON_PRETTY_PRINT);
