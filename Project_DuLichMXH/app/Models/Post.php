<?php
namespace App\Models;

use Exception;

class Post extends BaseModel {
    protected $table = 'posts';
    
    /**
     * Lấy danh sách post (list view - tóm tắt)
     */
    public function getPostsList($limit = 20, $groupId = null, $currentUserId = null) {
        $where = "WHERE p.status IN ('approved', 'published')";
        $params = ['limit' => $limit];
        
        if ($groupId) {
            $where .= " AND p.group_id = :group_id";
            $params['group_id'] = $groupId;
        } else {
            $where .= " AND p.group_id IS NULL"; // Chỉ lấy bài viết công khai không thuộc nhóm nào
        }

        $sql = "SELECT 
                    p.*,
                    u.username, u.avatar, u.full_name, u.is_verified, u.badge_title,
                    l.name as location_name,
                    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active' AND parent_id IS NULL) as comment_count,
                    (SELECT json_agg(pm.url) FROM post_media pm WHERE pm.post_id = p.id) as images,
                    EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = :user_id) as is_liked,
                    CASE 
                        WHEN p.group_id IS NULL THEN TRUE
                        ELSE EXISTS(
                            SELECT 1 FROM group_members 
                            WHERE group_id = p.group_id 
                              AND user_id = :user_id 
                              AND status = 'accepted'
                        )
                    END as is_group_member,

                    
                    -- Thông tin bài gốc (nếu là share)
                    orig.content as original_content,
                    orig_u.username as original_username,
                    orig_u.full_name as original_full_name,
                    orig_u.avatar as original_avatar,
                    orig_u.is_verified as original_is_verified,
                    orig_u.badge_title as original_badge_title,
                    (SELECT json_agg(opm.url) FROM post_media opm WHERE opm.post_id = p.shared_from_id) as original_images
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN locations l ON p.location_id = l.id
                LEFT JOIN posts orig ON p.shared_from_id = orig.id
                LEFT JOIN users orig_u ON orig.user_id = orig_u.id
                $where
                ORDER BY p.created_at DESC
                LIMIT :limit";
        
        $params['user_id'] = $currentUserId;
        $res = $this->query($sql, $params);
        foreach ($res as &$post) {
            if (isset($post['images']) && is_string($post['images'])) {
                $post['images'] = json_decode($post['images'], true);
            }
            if (isset($post['original_images']) && is_string($post['original_images'])) {
                $post['original_images'] = json_decode($post['original_images'], true);
            }
        }
        return $res;
    }
    
    /**
     * Lấy chi tiết post (detail view - đầy đủ)
     */
    public function getPostDetail($postId, $currentUserId = null) {
        $sql = "SELECT 
                    p.*, 
                    u.username, u.avatar, u.full_name, u.bio, u.is_verified, u.badge_title,
                    l.name as location_name, l.address,
                    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active' AND parent_id IS NULL) as comment_count,
                    (SELECT json_agg(pm.url) FROM post_media pm WHERE pm.post_id = p.id) as images,
                    EXISTS(
                        SELECT 1 FROM post_likes 
                        WHERE post_id = p.id AND user_id = :current_user_id
                    ) as is_liked,
                    CASE 
                        WHEN p.group_id IS NULL THEN TRUE
                        ELSE EXISTS(
                            SELECT 1 FROM group_members 
                            WHERE group_id = p.group_id 
                              AND user_id = :current_user_id 
                              AND status = 'accepted'
                        )
                    END as is_group_member
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN locations l ON p.location_id = l.id
                WHERE p.id = :post_id AND p.status IN ('approved', 'published')
                LIMIT 1";
        
        $params = ['post_id' => $postId, 'current_user_id' => $currentUserId];
        $result = $this->query($sql, $params);
        $post = $result[0] ?? null;
        if ($post && isset($post['images']) && is_string($post['images'])) {
            $post['images'] = json_decode($post['images'], true);
        }
        return $post;
    }

    public function getPostDetailRaw($postId) {
        $sql = "SELECT p.*, (SELECT json_agg(pm.url) FROM post_media pm WHERE pm.post_id = p.id) as images 
                FROM posts p WHERE p.id = :id";
        $res = $this->query($sql, ['id' => $postId]);
        $post = $res[0] ?? null;
        if ($post && isset($post['images']) && is_string($post['images'])) {
            $post['images'] = json_decode($post['images'], true);
        }
        return $post;
    }

    /**
     * Lấy bài viết của một user cụ thể
     */
    public function getByUser($userId, $limit = 20, $currentUserId = null) {
        try {
            $sql = "SELECT 
                        p.*,
                        u.username, u.avatar, u.full_name, u.is_verified, u.badge_title,
                        l.name as location_name,
                        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
                        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active' AND parent_id IS NULL) as comment_count,
                        (SELECT json_agg(pm.url) FROM post_media pm WHERE pm.post_id = p.id) as images,
                        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = :current_user_id) as is_liked,
                        CASE 
                            WHEN p.group_id IS NULL THEN TRUE
                            ELSE EXISTS(
                                SELECT 1 FROM group_members 
                                WHERE group_id = p.group_id 
                                  AND user_id = :current_user_id 
                                  AND status = 'accepted'
                            )
                        END as is_group_member
                    FROM posts p
                    JOIN users u ON p.user_id = u.id
                    LEFT JOIN locations l ON p.location_id = l.id
                    WHERE p.user_id = :user_id AND p.status IN ('approved', 'published')
                      AND (
                        p.group_id IS NULL
                        OR EXISTS (
                            SELECT 1 FROM groups g 
                            WHERE g.id = p.group_id 
                              AND (
                                g.is_private = FALSE 
                                OR (:current_user_id IS NOT NULL AND EXISTS (
                                    SELECT 1 FROM group_members gm 
                                    WHERE gm.group_id = g.id 
                                      AND gm.user_id = :current_user_id 
                                      AND gm.status = 'accepted'
                                ))
                              )
                        )
                      )
                    ORDER BY p.created_at DESC
                    LIMIT :limit";
            
            $res = $this->query($sql, [
                'user_id' => (int)$userId,
                'limit' => (int)$limit,
                'current_user_id' => $currentUserId
            ]);
            foreach ($res as &$post) {
                if (isset($post['images']) && is_string($post['images'])) {
                    $post['images'] = json_decode($post['images'], true);
                }
            }
            return $res;
        } catch (Exception $e) {
            error_log("Post::getByUser Error: " . $e->getMessage());
            throw $e;
        }
    }

    public function getMediaByUser($userId, $limit = 50) {
        $sql = "SELECT url, post_id, created_at FROM (
                    SELECT cover_image as url, id as post_id, created_at 
                    FROM posts 
                    WHERE user_id = :user_id AND cover_image IS NOT NULL AND cover_image != '' AND status IN ('approved', 'published')
                    UNION
                    SELECT pm.url, p.id as post_id, p.created_at 
                    FROM post_media pm 
                    JOIN posts p ON pm.post_id = p.id 
                    WHERE p.user_id = :user_id AND p.status IN ('approved', 'published')
                ) as combined_media
                ORDER BY created_at DESC
                LIMIT :limit";
        return $this->query($sql, ['user_id' => $userId, 'limit' => $limit]);
    }
    
    /**
     * Tạo post mới
     */
    public function create($userId, $data) {
        $status = 'pending';
        $isApproved = 'FALSE';

        if (empty($data['group_id'])) {
            $status = 'approved';
            $isApproved = 'TRUE';
        } else {
            // Tự động duyệt bài cho Admin/Owner
            require_once __DIR__ . '/Group.php';
            $groupModel = new Group();
            $role = $groupModel->getUserRole($data['group_id'], $userId);
            if ($role === 'admin' || $role === 'owner') {
                $status = 'approved';
                $isApproved = 'TRUE';
            }
        }

        $sql = "INSERT INTO posts (
                    user_id, group_id, title, content, location_id, 
                    post_type, status, is_approved, created_at
                ) VALUES (
                    :user_id, :group_id, :title, :content, :location_id, 
                    :post_type, :status, $isApproved, NOW()
                ) RETURNING id";
        
        $params = [
            'user_id' => $userId,
            'group_id' => $data['group_id'] ?? null,
            'title' => $data['title'] ?? '',
            'content' => $data['content'],
            'location_id' => $data['location_id'] ?? null,
            'post_type' => $data['post_type'] ?? 'group_post',
            'status' => $status
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
        $postId = (int)$postId;
        $userId = (int)$userId;
        try {
            $sql = "INSERT INTO post_likes (user_id, post_id) VALUES (:user_id, :post_id)
                    ON CONFLICT (user_id, post_id) DO NOTHING";
            $this->execute($sql, ['user_id' => $userId, 'post_id' => $postId]);
            
            // Trả về số like mới
            $res = $this->query("SELECT COUNT(*) as count FROM post_likes WHERE post_id = :id", ['id' => $postId]);
            return (int)$res[0]['count'];
        } catch (Exception $e) {
            error_log("Post::like Error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Unlike post
     */
    public function unlike($postId, $userId) {
        $postId = (int)$postId;
        $userId = (int)$userId;
        try {
            $sql = "DELETE FROM post_likes WHERE user_id = :user_id AND post_id = :post_id";
            $this->execute($sql, ['user_id' => $userId, 'post_id' => $postId]);
            
            // Trả về số like mới
            $res = $this->query("SELECT COUNT(*) as count FROM post_likes WHERE post_id = :id", ['id' => $postId]);
            return (int)$res[0]['count'];
        } catch (Exception $e) {
            error_log("Post::unlike Error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Chia sẻ bài viết
     */
    public function share($userId, $originalPostId, $targetGroupId, $content = '') {
        try {
            $isApproved = empty($targetGroupId) ? 'TRUE' : 'FALSE';
            $status = empty($targetGroupId) ? 'published' : 'pending';

            $sql = "INSERT INTO posts (
                        user_id, group_id, shared_from_id, content, title,
                        post_type, status, is_approved, created_at
                    ) VALUES (
                        :user_id, :group_id, :shared_from_id, :content, :title,
                        'share', :status, $isApproved, NOW()
                    ) RETURNING id";
            
            $params = [
                'user_id' => (int)$userId,
                'group_id' => (int)$targetGroupId,
                'shared_from_id' => (int)$originalPostId,
                'content' => $content,
                'title' => 'Chia sẻ bài viết',
                'status' => $status
            ];
            
            $result = $this->query($sql, $params);
            return $result[0]['id'] ?? null;
        } catch (Exception $e) {
            error_log("Post::share Error: " . $e->getMessage());
            throw $e;
        }
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

    /**
     * Lấy các bài viết chờ duyệt trong nhóm
     */
    public function getPendingPostsByGroup($groupId) {
        $sql = "SELECT p.*, u.username, u.full_name, u.avatar, u.is_verified, u.badge_title,
                (SELECT json_agg(pm.url) FROM post_media pm WHERE pm.post_id = p.id) as images
                FROM posts p 
                LEFT JOIN users u ON p.user_id = u.id 
                WHERE p.group_id = :group_id AND p.status = 'pending' 
                ORDER BY p.created_at ASC";
        $res = $this->query($sql, ['group_id' => (int)$groupId]);
        foreach ($res as &$post) {
            if (isset($post['images']) && is_string($post['images'])) {
                $post['images'] = json_decode($post['images'], true);
            }
        }
        return $res;
    }

    /**
     * Duyệt hoặc từ chối bài viết
     */
    public function updateApprovalStatus($postId, $status, $isApproved) {
        $sql = "UPDATE posts SET status = :status, is_approved = :is_approved, updated_at = NOW() 
                WHERE id = :id";
        return $this->execute($sql, [
            'id' => (int)$postId,
            'status' => $status,
            'is_approved' => $isApproved ? 'TRUE' : 'FALSE'
        ]);
    }
}
?>