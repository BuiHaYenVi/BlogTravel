<?php
require 'D:/laragon/www/Project_DuLichMXH/vendor/autoload.php';
require 'D:/laragon/www/Project_DuLichMXH/app/Models/BaseModel.php';
require 'D:/laragon/www/Project_DuLichMXH/app/Models/Trip.php';
use App\Models\Trip;

try {
    $tripModel = new Trip();
    $result = $tripModel->getAvailableTrips([], 10);
    echo "Success! count: " . count($result) . "\n";
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
} catch (Error $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
