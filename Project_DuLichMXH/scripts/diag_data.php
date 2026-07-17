<?php
require_once __DIR__ . '/app/config/database.php';
require_once __DIR__ . '/app/models/BaseModel.php';

class DiagDB extends BaseModel {
    public function checkNotifications() {
        try {
            $sql = "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5";
            $rows = $this->db->fetchAll($sql);
            
            if (empty($rows)) {
                echo "No notifications found in table.\n";
            } else {
                echo "Last 5 notifications:\n";
                foreach ($rows as $row) {
                    print_r($row);
                }
            }
        } catch (Exception $e) {
            echo "Error: " . $e->getMessage() . "\n";
        }
    }
}

$diag = new DiagDB();
$diag->checkNotifications();
