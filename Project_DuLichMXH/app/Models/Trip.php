<?php
namespace App\Models;

use Exception;

class Trip extends BaseModel {
    protected $table = 'trips';

    public function getAvailableTrips($filters = [], $limit = 20, $currentUserId = null) {
        $params = [];
        
        $selectCommonTags = "0 as common_tags_count";
        $withClause = "";
        
        if ($currentUserId) {
            $withClause = "
                WITH current_user_tags AS (
                    SELECT tag_id 
                    FROM user_interests 
                    WHERE user_id = :current_user_id
                )
            ";
            $selectCommonTags = "
                (
                    SELECT COUNT(*) 
                    FROM trip_tags tt
                    WHERE tt.trip_id = t.id 
                      AND tt.tag_id IN (SELECT tag_id FROM current_user_tags)
                ) as common_tags_count
            ";
            $params['current_user_id'] = (int)$currentUserId;
        }

        $sql = "
            $withClause
            SELECT 
                t.id, 
                t.user_id, 
                t.title, 
                t.description, 
                COALESCE(l.name, t.location, '') as destination_name, 
                t.start_date, 
                t.end_date,
                t.budget,
                t.category_tag, 
                t.max_members as max_participants, 
                t.current_members as current_participants, 
                t.status,
                t.itinerary,
                u.full_name as creator_name, 
                u.avatar as creator_avatar, 
                u.username,
                $selectCommonTags
            FROM trips t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN locations l ON t.destination_id = l.id
            WHERE t.is_public = TRUE
        ";
        
        if (!empty($filters['status'])) {
            $sql .= " AND t.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['category_tag']) && $filters['category_tag'] !== 'Tất cả') {
            $sql .= " AND EXISTS (
                SELECT 1 FROM trip_tags tt 
                JOIN tags tag ON tt.tag_id = tag.id 
                WHERE tt.trip_id = t.id AND tag.name = :filter_tag
            )";
            $params['filter_tag'] = $filters['category_tag'];
        }
        
        if (!empty($filters['location'])) {
            $sql .= " AND (t.location ILIKE :location OR l.name ILIKE :location OR t.title ILIKE :location)";
            $params['location'] = '%' . $filters['location'] . '%';
        }
        
        if ($currentUserId) {
            $sql .= " ORDER BY common_tags_count DESC, t.created_at DESC LIMIT :limit";
        } else {
            $sql .= " ORDER BY t.created_at DESC LIMIT :limit";
        }
        
        $params['limit'] = (int)$limit;
        
        $results = $this->query($sql, $params);

        // Tính toán matching_score trong PHP
        if ($currentUserId) {
            $userModel = new User();
            $currentUser = $userModel->findById($currentUserId);
            $currentInterestsStr = $currentUser ? ($currentUser['interests'] ?? '') : '';
            $currentInterests = array_filter(array_map('trim', explode(',', str_replace(', ', ',', $currentInterestsStr))));
            $totalInterests = count($currentInterests);
            
            $followingIds = $userModel->getFollowingIds($currentUserId);
            
            foreach ($results as &$row) {
                $row['matching_score'] = 0;
                $commonCount = (int)$row['common_tags_count'];
                
                $tripTagsStr = $row['category_tag'] ?? '';
                $tripTags = array_filter(array_map('trim', explode(',', str_replace(', ', ',', $tripTagsStr))));
                $tripTagsCount = count($tripTags);
                
                // Jaccard Similarity
                $unionCount = $totalInterests + $tripTagsCount - $commonCount;
                if ($unionCount > 0 && $commonCount > 0) {
                    $row['matching_score'] = round(($commonCount / $unionCount) * 100);
                }
                
                if ($row['matching_score'] == 0) {
                    // Nếu ko trùng tag, xem có follow creator ko
                    $creatorId = (string)$row['user_id'];
                    $isFollowingCreator = in_array($creatorId, $followingIds);
                    if ($isFollowingCreator) {
                        $row['matching_score'] = 35;
                    } else {
                        $row['matching_score'] = rand(10, 30);
                    }
                }
            }
        } else {
            foreach ($results as &$row) {
                $row['matching_score'] = rand(10, 30);
            }
        }

        return $results;
    }

    public function create($data) {
        $fields = array_keys($data);
        $placeholders = array_map(fn($f) => ":$f", $fields);
        
        $sql = "INSERT INTO trips (" . implode(', ', $fields) . ") 
                VALUES (" . implode(', ', $placeholders) . ")";
        
        $tripId = $this->insert($sql, $data, 'trips_id_seq');
        
        // Cập nhật bảng trung gian trip_tags
        if ($tripId && !empty($data['category_tag'])) {
            $tags = array_filter(array_map('trim', explode(',', str_replace(', ', ',', $data['category_tag']))));
            $tagModel = new Tag();
            foreach ($tags as $tagName) {
                if (empty($tagName)) continue;
                $tagId = $tagModel->findOrCreate($tagName, 'interest');
                $this->execute(
                    "INSERT INTO trip_tags (trip_id, tag_id) VALUES (:trip_id, :tag_id) ON CONFLICT DO NOTHING",
                    ['trip_id' => $tripId, 'tag_id' => $tagId]
                );
            }
        }
        
        return $tripId;
    }

    public function findById($id) {
        $sql = "SELECT 
                    t.id, 
                    t.user_id, 
                    t.title, 
                    t.description, 
                    COALESCE(l.name, t.location, '') as destination_name, 
                    t.start_date, 
                    t.end_date,
                    t.budget,
                    t.category_tag, 
                    t.max_members as max_participants, 
                    t.current_members as current_participants, 
                    t.status,
                    t.itinerary,
                    u.full_name as creator_name, 
                    u.avatar as creator_avatar, 
                    u.username 
                FROM trips t
                JOIN users u ON t.user_id = u.id
                LEFT JOIN locations l ON t.destination_id = l.id
                WHERE t.id = :id";
        $res = $this->query($sql, ['id' => $id]);
        return $res[0] ?? null;
    }

    public function addParticipant($tripId, $userId, $note = '') {
        $existing = $this->query("SELECT status FROM trip_participants WHERE trip_id = :trip_id AND user_id = :user_id", [
            'trip_id' => $tripId,
            'user_id' => $userId
        ]);

        if (!empty($existing)) {
            $status = $existing[0]['status'];
            if ($status === 'rejected') {
                $sql = "UPDATE trip_participants SET status = 'pending', note = :note, responded_at = NULL 
                        WHERE trip_id = :trip_id AND user_id = :user_id";
                return $this->execute($sql, [
                    'trip_id' => $tripId,
                    'user_id' => $userId,
                    'note' => $note
                ]);
            }
            return 0;
        }

        $sql = "INSERT INTO trip_participants (trip_id, user_id, status, role, note) 
                VALUES (:trip_id, :user_id, 'pending', 'member', :note)";
        return $this->execute($sql, [
            'trip_id' => $tripId,
            'user_id' => $userId,
            'note' => $note
        ]);
    }

    public function getParticipants($tripId, $status = null) {
        $sql = "SELECT tp.*, u.full_name, u.avatar, u.username 
                FROM trip_participants tp
                JOIN users u ON tp.user_id = u.id
                WHERE tp.trip_id = :trip_id";
        $params = ['trip_id' => $tripId];
        if ($status) {
            $sql .= " AND tp.status = :status";
            $params['status'] = $status;
        }
        return $this->query($sql, $params);
    }

    public function updateParticipantStatus($tripId, $userId, $status) {
        $this->db->beginTransaction();
        try {
            $sql = "UPDATE trip_participants SET status = :status, responded_at = NOW() 
                    WHERE trip_id = :trip_id AND user_id = :user_id";
            $this->execute($sql, [
                'status' => $status,
                'trip_id' => (int)$tripId,
                'user_id' => (int)$userId
            ]);

            if ($status === 'accepted') {
                $sql = "UPDATE trips SET current_members = current_members + 1 
                        WHERE id = :trip_id AND current_members < max_members";
                $this->execute($sql, ['trip_id' => (int)$tripId]);
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("❌ Error updating participant status: " . $e->getMessage());
            return false;
        }
    }

    public function removeParticipant($tripId, $userId) {
        $this->db->beginTransaction();
        try {
            $participant = $this->query("SELECT status FROM trip_participants WHERE trip_id = :trip_id AND user_id = :user_id", [
                'trip_id' => (int)$tripId,
                'user_id' => (int)$userId
            ]);

            if (!empty($participant)) {
                $status = $participant[0]['status'];

                $sql = "DELETE FROM trip_participants WHERE trip_id = :trip_id AND user_id = :user_id";
                $this->execute($sql, [
                    'trip_id' => (int)$tripId,
                    'user_id' => (int)$userId
                ]);

                if ($status === 'accepted') {
                    $this->execute("UPDATE trips SET current_members = current_members - 1 WHERE id = :id AND current_members > 1", ['id' => (int)$tripId]);
                }
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("❌ Error removing participant: " . $e->getMessage());
            return false;
        }
    }

    public function deleteTrip($tripId) {
        return $this->execute("DELETE FROM trips WHERE id = :id", ['id' => (int)$tripId]);
    }

    /**
     * Lấy tất cả các tag chủ đề (topic) từ bảng tags
     */
    public function getAllTags() {
        $sql = "SELECT name FROM tags WHERE type = 'topic' ORDER BY name ASC";
        $results = $this->query($sql);
        return array_column($results, 'name');
    }

    /**
     * Lấy danh sách chuyến đi của một user cụ thể (chủ trì hoặc tham gia)
     */
    public function getUserTrips($userId) {
        $sql = "SELECT 
                    t.id, 
                    t.user_id, 
                    t.title, 
                    t.description, 
                    COALESCE(l.name, t.location, '') as destination_name, 
                    t.start_date, 
                    t.end_date,
                    t.budget,
                    t.category_tag, 
                    t.max_members as max_participants, 
                    t.current_members as current_participants, 
                    t.status,
                    t.itinerary,
                    u.full_name as creator_name, 
                    u.avatar as creator_avatar, 
                    u.username 
                FROM trips t
                JOIN users u ON t.user_id = u.id
                LEFT JOIN locations l ON t.destination_id = l.id
                WHERE t.user_id = :user_id
                OR EXISTS (
                    SELECT 1 FROM trip_participants tp 
                    WHERE tp.trip_id = t.id 
                    AND tp.user_id = :user_id 
                    AND tp.status = 'accepted'
                )
                ORDER BY t.created_at DESC";
        
        return $this->query($sql, ['user_id' => (int)$userId]);
    }

    public function updateActivityStatus($tripId, $activityId, $isCompleted) {
        $trip = $this->findById($tripId);
        if (!$trip) return false;

        $itinerary = is_string($trip['itinerary']) ? json_decode($trip['itinerary'], true) : $trip['itinerary'];
        if (!$itinerary) return false;

        $totalActivities = 0;
        $completedCount = 0;

        foreach ($itinerary as &$day) {
            if (isset($day['activities'])) {
                foreach ($day['activities'] as &$activity) {
                    $totalActivities++;
                    // SỬA: Dùng so sánh tương đối == thay vì === để tránh lệch kiểu dữ liệu (string vs int)
                    if ($activity['id'] == $activityId) {
                        $activity['completed'] = $isCompleted;
                    }
                    if (!empty($activity['completed'])) {
                        $completedCount++;
                    }
                }
            }
        }

        $newStatus = 'preparing';
        if ($completedCount === $totalActivities && $totalActivities > 0) {
            $newStatus = 'completed';
        } elseif ($completedCount > 0) {
            $newStatus = 'ongoing';
        }

        $sql = "UPDATE trips SET itinerary = :itinerary, status = :status WHERE id = :id";
        return $this->execute($sql, [
            'itinerary' => json_encode($itinerary),
            'status' => $newStatus,
            'id' => (int)$tripId
        ]);
    }

    /**
     * Cập nhật thông tin chi tiết chuyến đi
     */
    public function updateTrip($id, $data) {
        $fields = [];
        $params = ['id' => (int)$id];
        
        $allowedFields = [
            'title', 'location', 'description', 'destination_id', 
            'start_date', 'end_date', 'budget', 'max_members', 
            'category_tag', 'itinerary', 'status'
        ];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        
        if (empty($fields)) return true;
        
        $sql = "UPDATE trips SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = :id";
        return $this->execute($sql, $params) >= 0;
    }

    public function checkParticipantStatus($tripId, $userId) {
        $sql = "SELECT status FROM trip_participants WHERE trip_id = :trip_id AND user_id = :user_id";
        $res = $this->query($sql, ['trip_id' => (int)$tripId, 'user_id' => (int)$userId]);
        return $res[0]['status'] ?? null;
    }

    public function addInvitation($tripId, $userId) {
        $status = $this->checkParticipantStatus($tripId, $userId);
        if ($status === 'accepted' || $status === 'invited') {
            return false;
        }
        
        if ($status) {
            $sql = "UPDATE trip_participants SET status = 'invited', role = 'member', responded_at = NULL 
                    WHERE trip_id = :trip_id AND user_id = :user_id";
            return $this->execute($sql, [
                'trip_id' => (int)$tripId,
                'user_id' => (int)$userId
            ]) >= 0;
        } else {
            $sql = "INSERT INTO trip_participants (trip_id, user_id, status, role) 
                    VALUES (:trip_id, :user_id, 'invited', 'member')";
            return $this->execute($sql, [
                'trip_id' => (int)$tripId,
                'user_id' => (int)$userId
            ]) >= 0;
        }
    }

    public function acceptInvitation($tripId, $userId) {
        $this->db->beginTransaction();
        try {
            $sql = "UPDATE trip_participants SET status = 'accepted', responded_at = NOW() 
                    WHERE trip_id = :trip_id AND user_id = :user_id AND status = 'invited'";
            $updated = $this->execute($sql, [
                'trip_id' => (int)$tripId,
                'user_id' => (int)$userId
            ]);
            
            if ($updated) {
                $sql = "UPDATE trips SET current_members = current_members + 1 
                        WHERE id = :trip_id AND current_members < max_members";
                $this->execute($sql, ['trip_id' => (int)$tripId]);
            }
            
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("acceptInvitation error: " . $e->getMessage());
            return false;
        }
    }

    public function rejectInvitation($tripId, $userId) {
        $sql = "UPDATE trip_participants SET status = 'rejected', responded_at = NOW() 
                WHERE trip_id = :trip_id AND user_id = :user_id AND status = 'invited'";
        return $this->execute($sql, [
            'trip_id' => (int)$tripId,
            'user_id' => (int)$userId
        ]) >= 0;
    }
}
