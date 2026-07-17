<?php
namespace App\Models;

use Exception;

class Notification extends BaseModel {
    protected $table = 'notifications';

    public function getByUserId($userId, $limit = 20, $offset = 0) {
        $sql = "SELECT n.id, n.user_id, n.actor_id, n.type, n.target_id, n.target_type, n.is_read, n.created_at, n.custom_message, n.redirect_url,
                       COALESCE(NULLIF(u.full_name, ''), u.username) as actor_name, 
                       u.avatar as actor_avatar 
                FROM notifications n
                LEFT JOIN users u ON n.actor_id = u.id
                WHERE n.user_id = :user_id 
                ORDER BY n.created_at DESC 
                LIMIT :limit OFFSET :offset";
        return $this->db->fetchAll($sql, [
            'user_id' => (int)$userId,
            'limit' => (int)$limit,
            'offset' => (int)$offset
        ]);
    }

    public function create($data) {
        // Kiểm tra xem đã có thông báo tương tự chưa đọc chưa (để tránh spam follow/unfollow)
        if (isset($data['type']) && in_array($data['type'], ['follow', 'like'])) {
            $targetId = isset($data['target_id']) ? (int)$data['target_id'] : null;
            
            $checkSql = "SELECT id FROM notifications 
                         WHERE user_id = :user_id 
                         AND actor_id = :actor_id 
                         AND type = :type 
                         AND (is_read = FALSE OR is_read IS NULL)";
            
            $checkParams = [
                'user_id' => (int)$data['user_id'],
                'actor_id' => (int)$data['actor_id'],
                'type' => $data['type']
            ];

            // Build SQL động cho target_id để tránh lỗi Indeterminate datatype của PostgreSQL khi bind NULL
            if ($targetId === null) {
                $checkSql .= " AND target_id IS NULL";
            } else {
                $checkSql .= " AND target_id = :target_id";
                $checkParams['target_id'] = $targetId;
            }

            $checkSql .= " LIMIT 1";
            
            $existing = $this->db->fetchAll($checkSql, $checkParams);

            if (!empty($existing)) {
                // Nếu đã có thông báo chưa đọc, chỉ cập nhật thời gian created_at để nó nổi lên đầu
                $updateSql = "UPDATE notifications SET created_at = NOW() WHERE id = :id";
                $this->db->execute($updateSql, ['id' => $existing[0]['id']]);
                return $existing[0]['id'];
            }
        }

        error_log("🔔 Đang tạo thông báo mới: " . json_encode($data));
        $sql = "INSERT INTO notifications (user_id, actor_id, type, target_id, target_type, custom_message, redirect_url, is_read, created_at) 
                VALUES (:user_id, :actor_id, :type, :target_id, :target_type, :custom_message, :redirect_url, FALSE, NOW())";
        try {
            return $this->db->insert($sql, [
                'user_id' => (int)$data['user_id'],
                'actor_id' => (int)$data['actor_id'],
                'type' => $data['type'],
                'target_id' => isset($data['target_id']) ? (int)$data['target_id'] : null,
                'target_type' => $data['target_type'] ?? 'general',
                'custom_message' => $data['custom_message'] ?? null,
                'redirect_url' => $data['redirect_url'] ?? null
            ]);
        } catch (Exception $e) {
            error_log("❌ Lỗi insert thông báo: " . $e->getMessage());
            throw $e;
        }
    }

    public function markAsRead($id, $userId) {
        $sql = "UPDATE notifications SET is_read = TRUE WHERE id = :id AND user_id = :user_id";
        return $this->db->execute($sql, ['id' => (int)$id, 'user_id' => (int)$userId]);
    }

    public function markAllAsRead($userId) {
        $sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = :user_id";
        return $this->db->execute($sql, ['user_id' => (int)$userId]);
    }

    public function getUnreadCount($userId) {
        $sql = "SELECT COUNT(*) as count FROM notifications 
                WHERE user_id = :user_id AND (is_read = FALSE OR is_read IS NULL)";
        $result = $this->db->fetchAll($sql, ['user_id' => (int)$userId]);
        return (int)($result[0]['count'] ?? 0);
    }

    public function getTotalCount($userId) {
        $sql = "SELECT COUNT(*) as count FROM notifications WHERE user_id = :user_id";
        $result = $this->db->fetchAll($sql, ['user_id' => (int)$userId]);
        return (int)($result[0]['count'] ?? 0);
    }

    public function delete($id, $userId) {
        $sql = "DELETE FROM notifications WHERE id = :id AND user_id = :user_id";
        return $this->db->execute($sql, ['id' => (int)$id, 'user_id' => (int)$userId]);
    }

    /**
     * Tự động quét nội dung để gửi thông báo nhắc tên (Mention)
     */
    public static function processMentions($content, $actorId, $targetId, $targetType) {
        // Regex tìm @username (ví dụ: @alex123)
        preg_match_all('/@([a-zA-Z0-9_]+)/', $content, $matches);
        
        if (empty($matches[1])) return;
        
        $usernames = array_unique($matches[1]);
        $userModel = new User();
        $notification = new Notification();
        
        foreach ($usernames as $username) {
            $user = $userModel->findByUsername($username);
            if ($user && (int)$user['id'] !== (int)$actorId) {
                $notification->create([
                    'user_id' => $user['id'],
                    'actor_id' => $actorId,
                    'type' => 'mention',
                    'target_id' => $targetId,
                    'target_type' => $targetType
                ]);
            }
        }
    }
}
?>