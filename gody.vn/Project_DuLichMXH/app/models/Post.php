<?php
require_once __DIR__ . '/BaseModel.php';

class Post extends BaseModel {
    protected $table = 'posts';
    
    /**
     * Lấy danh sách post (list view - tóm tắt)
     */
    public function getPostsList($limit = 20) {
        $sql = "SELECT 
                    p.id, p.title, 
                    SUBSTRING(p.content, 1, 150) || '...' as excerpt,
                    p.created_at, p.updated_at,
                    u.id as user_id, u.username, u.avatar,
                    l.id as location_id, l.name as location_name,
                    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN locations l ON p.location_id = l.id
                WHERE p.status = 'published'
                ORDER BY p.created_at DESC
                LIMIT :limit";
        
        return $this->query($sql, ['limit' => $limit]);
    }
    
    /**
     * Lấy chi tiết post (detail view - đầy đủ)
     */
    public function getPostDetail($postId, $currentUserId = null) {
        $sql = "SELECT 
                    p.*, 
                    u.id as user_id, u.username, u.avatar, u.bio, u.created_at as user_joined,
                    l.id as location_id, l.name as location_name, l.address, l.lat, l.lng,
                    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
                    EXISTS(
                        SELECT 1 FROM likes 
                        WHERE post_id = p.id AND user_id = :current_user_id
                    ) as is_liked
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN locations l ON p.location_id = l.id
                WHERE p.id = :post_id AND p.status = 'published'
                LIMIT 1";
        
        $params = ['post_id' => $postId, 'current_user_id' => $currentUserId];
        $result = $this->query($sql, $params);
        
        return $result[0] ?? null;
    }
    
    /**
     * Tạo post mới
     */
    public function create($userId, $data) {
        $sql = "INSERT INTO posts (
                    user_id, title, content, location_id, 
                    post_type, status, created_at
                ) VALUES (
                    :user_id, :title, :content, :location_id, 
                    :post_type, 'published', NOW()
                ) RETURNING id";
        
        $params = [
            'user_id' => $userId,
            'title' => $data['title'],
            'content' => $data['content'],
            'location_id' => $data['location_id'] ?? null,
            'post_type' => $data['post_type'] ?? 'blog'
        ];
        
        $result = $this->query($sql, $params);
        return $result[0]['id'] ?? null;
    }
    
    /**
     * Cập nhật post (chỉ update các field được gửi lên)
     */
    public function update($postId, $userId, $data) {
        // Kiểm tra ownership trước khi update
        if (!$this->isOwner($postId, $userId)) {
            return false;
        }
        
        $fields = [];
        $params = ['id' => $postId, 'user_id' => $userId];
        
        // Dynamic build fields chỉ update những gì client gửi
        $allowedFields = ['title', 'content', 'location_id', 'post_type'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return 0; // Không có field nào để update
        }
        
        $params['id'] = $postId;
        $params['user_id'] = $userId;
        
        $sql = "UPDATE posts SET " . implode(', ', $fields) . ", updated_at = NOW() 
                WHERE id = :id AND user_id = :user_id";
        
        return $this->execute($sql, $params);
    }
    
    /**
     * Xóa mềm post
     */
    public function softDelete($postId, $userId) {
        if (!$this->isOwner($postId, $userId)) {
            return false;
        }
        
        $sql = "UPDATE posts SET status = 'deleted', updated_at = NOW() 
                WHERE id = :id AND user_id = :user_id";
        
        return $this->execute($sql, ['id' => $postId, 'user_id' => $userId]);
    }
    
    /**
     * Like post
     */
    public function like($postId, $userId) {
        try {
            $sql = "INSERT INTO likes (user_id, post_id) VALUES (:user_id, :post_id)";
            $this->execute($sql, ['user_id' => $userId, 'post_id' => $postId]);
            return true;
        } catch (Exception $e) {
            // Duplicate entry = đã like rồi
            return false;
        }
    }
    
    /**
     * Unlike post
     */
    public function unlike($postId, $userId) {
        $sql = "DELETE FROM likes WHERE user_id = :user_id AND post_id = :post_id";
        return $this->execute($sql, ['user_id' => $userId, 'post_id' => $postId]);
    }
    
    /**
     * Kiểm tra post có tồn tại không
     */
    public function exists($postId) {
        $result = $this->query(
            "SELECT id FROM posts WHERE id = :id LIMIT 1", 
            ['id' => $postId]
        );
        return !empty($result);
    }
    
    /**
     * Kiểm tra user có phải owner của post không
     */
    public function isOwner($postId, $userId) {
        $result = $this->query(
            "SELECT id FROM posts WHERE id = :id AND user_id = :user_id LIMIT 1",
            ['id' => $postId, 'user_id' => $userId]
        );
        return !empty($result);
    }
}
?>