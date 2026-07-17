<?php
require_once __DIR__ . '/app/config/database.php';
require_once __DIR__ . '/app/models/BaseModel.php';

class DiagDB extends BaseModel {
    public function checkTable($tableName) {
        try {
            $sql = "SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = :table_name";
            $cols = $this->db->fetchAll($sql, ['table_name' => $tableName]);
            
            if (empty($cols)) {
                echo "Table '$tableName' does NOT exist.\n";
            } else {
                echo "Table '$tableName' columns:\n";
                foreach ($cols as $col) {
                    echo "- {$col['column_name']} ({$col['data_type']})\n";
                }
            }
        } catch (Exception $e) {
            echo "Error: " . $e->getMessage() . "\n";
        }
    }
}

$diag = new DiagDB();
$diag->checkTable('notifications');
