<?php
// Không cần require database nếu đã có trong Controller, nhưng để an toàn:
if (!class_exists('Database')) {
    require_once __DIR__ . '/../../../config/database.php';
}

class Trip {
    private $db;
    
    public function __construct() {
        $this->db = \Database::getInstance();
    }

    public function create($data) {
        // Dùng fetchAll vì RETURNING id trả về 1 dòng dưới dạng mảng
        $result = $this->db->fetchAll(
            "INSERT INTO trips (user_id, title, destination_id, start_date, end_date, 
                                budget, description, status, max_participants, 
                                itinerary, category_tag, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) RETURNING id",
            [
                $data['user_id'], 
                $data['title'], 
                $data['destination_id'],
                $data['start_date'] ?? null, 
                $data['end_date'] ?? null, 
                $data['budget'] ?? 0, 
                $data['description'] ?? '', 
                $data['status'] ?? 'preparing', 
                $data['max_participants'] ?? 10,
                $data['itinerary'] ?? null,
                $data['category_tag'] ?? null
            ]
        );
        
        // Trả về id của trip mới tạo (vd: ['id' => 1])
        return $result[0] ?? null;
    }

    public function getAll($status = 'open', $limit = 20, $currentUserId = null) {
        $params = [];
        $whereClauses = [];

        // Xử lý status: Nếu là 'open' thì lấy cả 'preparing'
        if ($status === 'open') {
            $whereClauses[] = "t.status IN ('open', 'preparing')";
        } else {
            $whereClauses[] = "t.status = ?";
            $params[] = $status;
        }

        // Luôn ưu tiên chuyến đi công khai hoặc của chính mình
        if ($currentUserId) {
            $whereClauses[] = "(t.is_public = TRUE OR t.user_id = ?)";
            $params[] = (int)$currentUserId;
        } else {
            $whereClauses[] = "t.is_public = TRUE";
        }

        $whereSql = implode(' AND ', $whereClauses);
        $params[] = (int)$limit;

        $sql = "SELECT t.*, l.name as destination_name, u.username as creator_name, u.avatar as creator_avatar,
                       (SELECT COUNT(*) FROM trip_participants 
                        WHERE trip_id = t.id AND status = 'accepted') as current_participants
                FROM trips t
                JOIN locations l ON t.destination_id = l.id
                JOIN users u ON t.user_id = u.id
                WHERE {$whereSql}
                ORDER BY t.created_at DESC
                LIMIT ?";
        
        return $this->db->fetchAll($sql, $params);
    }

    public function findById($id) {
        $result = $this->db->fetchAll("SELECT * FROM trips WHERE id = ?", [$id]);
        return $result[0] ?? null;
    }

    public function joinRequest($tripId, $userId, $note = null) {
        try {
            $this->db->execute(
                "INSERT INTO trip_participants (trip_id, user_id, status, note) 
                 VALUES (?, ?, 'pending', ?)",
                [$tripId, $userId, $note]
            );
            return true;
        } catch (Exception $e) {
            return false; // Duplicate key
        }
    }

    public function acceptParticipant($tripId, $participantId, $ownerId) {
        $trip = $this->findById($tripId);
        // Kiểm tra quyền owner
        if (!$trip || $trip['user_id'] != $ownerId) return false;

        return $this->db->execute(
            "UPDATE trip_participants SET status = 'accepted' WHERE id = ? AND trip_id = ?",
            [$participantId, $tripId]
        ) > 0;
    }

    public function rejectParticipant($tripId, $participantId, $ownerId) {
        $trip = $this->findById($tripId);
        if (!$trip || $trip['user_id'] != $ownerId) return false;

        return $this->db->execute(
            "UPDATE trip_participants SET status = 'rejected' WHERE id = ? AND trip_id = ?",
            [$participantId, $tripId]
        ) > 0;
    }
}