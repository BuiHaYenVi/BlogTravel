<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    echo "--- CHECKING group_members SCHEMA ---\n";
    $result = $db->query("SELECT column_name, data_type, column_default, is_nullable 
                          FROM information_schema.columns 
                          WHERE table_name='group_members'");
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
    
    echo "\n--- CHECKING DISTINCT ROLES ---\n";
    $rolesRes = $db->query("SELECT distinct role FROM group_members");
    while ($row = $rolesRes->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
