<?php
require 'D:/laragon/www/Project_DuLichMXH/vendor/autoload.php';
use App\Config\Database;
$db = Database::getInstance()->getConnection();
$stmt = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trips'");
print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
