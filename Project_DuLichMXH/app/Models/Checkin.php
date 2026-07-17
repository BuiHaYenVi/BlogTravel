<?php
namespace App\Models;

class Checkin extends BaseModel {
    protected $table = 'checkins';

    public function toggleCheckin($userId, $destinationId, $status) {
        // Kiểm tra xem đã tồn tại chưa
        $existing = $this->first("user_id = :user_id AND destination_id = :dest_id", [
            'user_id' => $userId,
            'dest_id' => $destinationId
        ]);

        if ($existing) {
            if ($existing['status'] === $status) {
                // Nếu cùng status thì xóa (toggle off)
                $this->execute("DELETE FROM checkins WHERE id = :id", ['id' => $existing['id']]);
                return null;
            } else {
                // Nếu khác status thì update
                $this->execute("UPDATE checkins SET status = :status WHERE id = :id", [
                    'status' => $status,
                    'id' => $existing['id']
                ]);
                return $status;
            }
        } else {
            // Chưa tồn tại thì thêm mới
            $this->insert("INSERT INTO checkins (user_id, destination_id, status) VALUES (:user_id, :dest_id, :status)", [
                'user_id' => $userId,
                'dest_id' => $destinationId,
                'status' => $status
            ]);
            return $status;
        }
    }

    public function getStatus($userId, $destinationId) {
        $result = $this->first("user_id = :user_id AND destination_id = :dest_id", [
            'user_id' => $userId,
            'dest_id' => $destinationId
        ]);
        return $result ? $result['status'] : null;
    }

    public function getVisitedCount($userId) {
        $sql = "SELECT COUNT(*) as count FROM checkins WHERE user_id = :user_id AND status = 'visited'";
        $result = $this->query($sql, ['user_id' => $userId]);
        return (int)($result[0]['count'] ?? 0);
    }
}
?>