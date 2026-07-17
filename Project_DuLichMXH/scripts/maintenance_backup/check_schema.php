<?php
require_once __DIR__ . '/../app/config/database.php';
$db = Database::getInstance();
$result = $db->fetchAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'checkins'");
echo json_encode($result);
?>
