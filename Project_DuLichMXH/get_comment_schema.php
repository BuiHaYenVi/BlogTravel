<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/app/Config/Database.php';
$db = \App\Config\Database::getInstance()->getConnection();
$stmt = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'comments'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
