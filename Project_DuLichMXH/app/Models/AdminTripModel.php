<?php
namespace App\Models;

class AdminTripModel extends BaseModel {
    
    public function getTrips($page, $limit, $search = '', $status = 'All') {
        $offset = ($page - 1) * $limit;
        $where = ["1=1"];
        $params = [];

        if (!empty($search)) {
            $where[] = "(t.title ILIKE ? OR u.username ILIKE ? OR u.full_name ILIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($status !== 'All') {
            $where[] = "t.status = ?";
            $params[] = $status;
        }

        $whereClause = implode(' AND ', $where);
        
        $totalResult = $this->query("SELECT COUNT(*) as total FROM trips t JOIN users u ON t.user_id = u.id WHERE $whereClause", $params);
        $total = (int)($totalResult[0]['total'] ?? 0);
        
        $sql = "SELECT t.id, t.title, COALESCE(l.name, t.location, '') as destination_name, t.start_date, t.end_date, t.status, t.created_at, 
                       u.username as creator_name, u.avatar as creator_avatar,
                       (SELECT COUNT(*) FROM trip_participants tp WHERE tp.trip_id = t.id AND tp.status = 'accepted') as participant_count
                FROM trips t
                JOIN users u ON t.user_id = u.id
                LEFT JOIN locations l ON t.destination_id = l.id
                WHERE $whereClause
                ORDER BY t.created_at DESC
                LIMIT $limit OFFSET $offset";
        
        return [
            'data' => $this->query($sql, $params),
            'pagination' => [
                'total' => $total, 'page' => $page, 'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ]
        ];
    }

    public function updateStatus($id, $status) {
        return $this->execute("UPDATE trips SET status = ?, updated_at = NOW() WHERE id = ?", [$status, $id]) > 0;
    }

    public function deleteTrip($id) {
        // Since we have foreign keys, trip_participants might need cascade delete or we delete them here.
        // Assuming ON DELETE CASCADE is set. If not, delete participants first:
        $this->execute("DELETE FROM trip_participants WHERE trip_id = ?", [$id]);
        return $this->execute("DELETE FROM trips WHERE id = ?", [$id]) > 0;
    }
}