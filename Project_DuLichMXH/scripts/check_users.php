<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    $sql = "SELECT id, full_name FROM users WHERE id IN (22, 23)";
    $rows = $db->query($sql)->fetchAll();
    print_r($rows);
} catch (Exception $e) {
    echo $e->getMessage();
}
