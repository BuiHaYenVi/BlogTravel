<?php
namespace App\Models;

use App\Config\Database;
use Exception;

class AdminNotification extends BaseModel {
    protected $table = 'admin_notifications';

    public function getLatest($limit = 10) {
        $sql = "SELECT * FROM {$this->table} ORDER BY created_at DESC LIMIT :limit";
        $results = $this->query($sql, ['limit' => $limit]);
        
        foreach ($results as &$row) {
            $row['data'] = json_decode($row['data'], true);
            $row['time_ago'] = $this->timeAgo($row['created_at']);
        }
        return $results;
    }

    public function markAllAsRead() {
        $sql = "UPDATE {$this->table} SET is_read = TRUE WHERE is_read = FALSE";
        return $this->execute($sql) >= 0;
    }

    public function createNotification($type, $data) {
        $sql = "INSERT INTO {$this->table} (type, data) VALUES (:type, :data) RETURNING id";
        $params = [
            'type' => $type,
            'data' => json_encode($data)
        ];
        return $this->db->insert($sql, $params, 'admin_notifications_id_seq');
    }

    private function timeAgo($timestamp) {
        $time_ago = strtotime($timestamp);
        $cur_time = time();
        $time_elapsed = $cur_time - $time_ago;
        $seconds = $time_elapsed;
        $minutes = round($time_elapsed / 60);
        $hours = round($time_elapsed / 3600);
        $days = round($time_elapsed / 86400);
        $weeks = round($time_elapsed / 604800);
        $months = round($time_elapsed / 2600640);
        $years = round($time_elapsed / 31207680);

        if ($seconds <= 60) return "vừa xong";
        if ($minutes <= 60) return "$minutes phút trước";
        if ($hours <= 24) return "$hours giờ trước";
        if ($days <= 7) return "$days ngày trước";
        if ($weeks <= 4.3) return "$weeks tuần trước";
        if ($months <= 12) return "$months tháng trước";
        return "$years năm trước";
    }
}
