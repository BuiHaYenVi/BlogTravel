<?php
namespace App\Models;

class Blog extends BaseModel {
    protected $table = 'posts';
    
    public function create($data) {
        $query = "INSERT INTO posts (
            user_id, title, slug, content, short_intro, cover_image,
            location_id, post_type, status, start_date, end_date,
            duration_days, budget, currency, meta_title, meta_description,
            published_at, created_at, updated_at
        ) VALUES (
            :user_id, :title, :slug, :content, :short_intro, :cover_image,
            :location_id, 'blog', :status, :start_date, :end_date,
            :duration_days, :budget, :currency, :meta_title, :meta_description,
            NOW(), NOW(), NOW()
        ) RETURNING id";
        
        $result = $this->query($query, $data);
        return isset($result[0]['id']) ? (int)$result[0]['id'] : null;
    }
    
    /**
     * ✅ FIX: Đếm blogs với WHERE clause đúng cách
     */
    public function countBlogs($filters = []) {
        // ✅ Khởi tạo conditions là ARRAY
        $conditions = ["p.post_type = 'blog'"];
        
        // ✅ Params với key KHÔNG có dấu ':'
        $params = ['status' => $filters['status'] ?? 'published'];
        $conditions[] = "p.status = :status";
        
        if (!empty($filters['user_id'])) {
            $conditions[] = "p.user_id = :user_id";
            $params['user_id'] = (int)$filters['user_id'];
        }
        
        if (!empty($filters['location_id'])) {
            $conditions[] = "p.location_id = :location_id";
            $params['location_id'] = (int)$filters['location_id'];
        }
        
        if (!empty($filters['search'])) {
            $conditions[] = "(p.title ILIKE :search OR p.content ILIKE :search)";
            $params['search'] = "%{$filters['search']}%";
        }
        
        // ✅ implode trả về STRING
        $whereClause = implode(' AND ', $conditions);
        
        // ✅ Debug tạm thời (xóa sau khi chạy ổn)
        // error_log("countBlogs WHERE: " . $whereClause);
        // error_log("countBlogs Params: " . print_r($params, true));
        
        $query = "SELECT COUNT(*) as total FROM posts p WHERE {$whereClause}";
        
        $result = $this->query($query, $params);
        return (int)($result[0]['total'] ?? 0);
    }
    
    /**
     * ✅ FIX: getAll với WHERE clause đúng cách
     */
    public function getAll($filters = [], $currentUserId = null) {
        $page = $filters['page'] ?? 1;
        $limit = $filters['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        $conditions = ["p.post_type = 'blog'"];
        $params = ['status' => $filters['status'] ?? 'published'];
        $conditions[] = "p.status = :status";
        
        if (!empty($filters['user_id'])) {
            $conditions[] = "p.user_id = :user_id";
            $params['user_id'] = (int)$filters['user_id'];
        }
        
        if (!empty($filters['location_id'])) {
            $conditions[] = "p.location_id = :location_id";
            $params['location_id'] = (int)$filters['location_id'];
        }
        
        if (!empty($filters['search'])) {
            $conditions[] = "(p.title ILIKE :search OR p.content ILIKE :search)";
            $params['search'] = "%{$filters['search']}%";
        }
        
        $whereClause = implode(' AND ', $conditions);
        
        // Thêm is_liked nếu có user đang đăng nhập
        $isLikedSelect = "false as is_liked";
        if ($currentUserId) {
            $isLikedSelect = "(SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = :current_user_id)) as is_liked";
            $params['current_user_id'] = (int)$currentUserId;
        }
        
        $query = "SELECT p.*,
                         u.username, u.avatar, u.full_name, u.is_verified, u.badge_title,
                         l.name as location_name,
                         (SELECT json_agg(pm.url) FROM post_media pm WHERE pm.post_id = p.id) as images,
                         COUNT(DISTINCT c.id) as comment_count,
                         COUNT(DISTINCT lks.id) as like_count,
                         COUNT(DISTINCT pt.tag_id) as tag_count,
                         {$isLikedSelect},
                         (SELECT json_build_object(
                             'id', sp.id,
                             'title', sp.title,
                             'short_intro', sp.short_intro,
                             'cover_image', sp.cover_image,
                             'author', json_build_object('name', su.full_name, 'avatar', su.avatar)
                         ) FROM posts sp LEFT JOIN users su ON sp.user_id = su.id WHERE sp.id = p.shared_from_id LIMIT 1) as shared_post
                  FROM posts p
                  LEFT JOIN users u ON p.user_id = u.id
                  LEFT JOIN locations l ON p.location_id = l.id
                  LEFT JOIN comments c ON p.id = c.post_id
                  LEFT JOIN likes lks ON p.id = lks.post_id
                  LEFT JOIN post_tags pt ON p.id = pt.post_id
                  WHERE {$whereClause}
                  GROUP BY p.id, u.username, u.avatar, u.full_name, u.is_verified, u.badge_title, l.name
                  ORDER BY u.is_verified DESC, p.published_at DESC
                  LIMIT {$limit} OFFSET {$offset}";
        
        return $this->query($query, $params);
    }
    
    public function findById($id, $currentUserId = null) {
        $isLikedSelect = "false as is_liked";
        $params = [];
        
        // Hỗ trợ cả tìm theo ID (số) và Slug (chuỗi)
        if (is_numeric($id)) {
            $whereClause = "p.id = :id";
            $params['id'] = (int)$id;
        } else {
            $whereClause = "p.slug = :slug";
            $params['slug'] = $id;
        }

        $isLikedSelect = "(SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = :current_user_id)) as is_liked";
        $params['current_user_id'] = $currentUserId ? (int)$currentUserId : 0;
        
        $query = "SELECT p.*, u.username, u.avatar, u.full_name, u.is_verified, u.badge_title, u.email as user_email, u.bio as user_bio,
                         (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
                         (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
                         (SELECT COUNT(DISTINCT location_id) FROM posts WHERE user_id = u.id AND post_type = 'blog' AND location_id IS NOT NULL) as provinces_count,
                         (SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = :current_user_id AND following_id = u.id)) as is_following,
                         l.name as location_name, l.slug as location_slug,
                         (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
                         (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
                         {$isLikedSelect},
                         (SELECT json_build_object(
                             'id', sp.id,
                             'title', sp.title,
                             'short_intro', sp.short_intro,
                             'cover_image', sp.cover_image,
                             'author', json_build_object('name', su.full_name, 'avatar', su.avatar)
                         ) FROM posts sp LEFT JOIN users su ON sp.user_id = su.id WHERE sp.id = p.shared_from_id LIMIT 1) as shared_post
                  FROM posts p
                  LEFT JOIN users u ON p.user_id = u.id
                  LEFT JOIN locations l ON p.location_id = l.id
                  WHERE {$whereClause}
                  LIMIT 1";
                  
        $result = $this->query($query, $params);
        return $result[0] ?? null;
    }
    
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => (int)$id];
        
        $allowedFields = ['title', 'content', 'short_intro', 'cover_image',
            'location_id', 'status', 'start_date', 'end_date',
            'duration_days', 'budget', 'currency',
            'meta_title', 'meta_description'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        
        if (!empty($data['title']) && !empty($data['slug'])) {
            $fields[] = "slug = :slug";
            $params['slug'] = $data['slug'];
        }
        
        if (empty($fields)) return 0;
        
        $fields[] = "updated_at = NOW()";
        $setClause = implode(', ', $fields);
        
        $query = "UPDATE posts SET {$setClause} WHERE id = :id";
        return $this->execute($query, $params);
    }
    
    public function delete($id) {
        $query = "UPDATE posts SET status = 'deleted', updated_at = NOW() 
                  WHERE id = :id";
        return $this->execute($query, ['id' => (int)$id]);
    }
    
    public function getByUser($userId, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        $query = "SELECT p.*, COUNT(DISTINCT c.id) as comment_count,
                         COUNT(DISTINCT lks.id) as like_count
                  FROM posts p
                  LEFT JOIN comments c ON p.id = c.post_id
                  LEFT JOIN likes lks ON p.id = lks.post_id
                  WHERE p.user_id = :user_id AND p.post_type = 'blog'
                  GROUP BY p.id
                  ORDER BY p.created_at DESC
                  LIMIT {$limit} OFFSET {$offset}";
        return $this->query($query, ['user_id' => (int)$userId]);
    }
    
    public function incrementViewCount($id) {
        $query = "UPDATE posts SET view_count = view_count + 1 WHERE id = :id";
        return $this->execute($query, ['id' => (int)$id]);
    }
    
    /**
     * Share a blog post (repost)
     */
    public function share($originalId, $userId, $content = '') {
        $original = $this->findById($originalId);
        if (!$original) return false;

        try {
            $this->db->beginTransaction();

            // Tăng số lượng share của bài gốc
            $this->execute("UPDATE posts SET share_count = share_count + 1 WHERE id = :id", ['id' => (int)$originalId]);

            // Tạo bài post mới (repost)
            $slug = 'shared-' . $original['slug'] . '-' . time();
            $query = "INSERT INTO posts (
                user_id, title, slug, content, short_intro, cover_image,
                location_id, post_type, status, shared_from_id, shared_from_type,
                published_at, created_at, updated_at
            ) VALUES (
                :user_id, :title, :slug, :content, :short_intro, :cover_image,
                :location_id, 'blog', 'published', :shared_from_id, 'blog',
                NOW(), NOW(), NOW()
            ) RETURNING id";
            
            $data = [
                'user_id' => (int)$userId,
                'title' => $original['title'],
                'slug' => $slug,
                'content' => $content ? $content : $original['content'],
                'short_intro' => $original['short_intro'],
                'cover_image' => $original['cover_image'],
                'location_id' => $original['location_id'],
                'shared_from_id' => (int)$originalId
            ];
            
            $result = $this->query($query, $data);
            $newId = isset($result[0]['id']) ? (int)$result[0]['id'] : null;

            $this->db->commit();
            return $newId;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Blog::share Error: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function getTrending($limit = 3) {
        $query = "SELECT p.*, u.username, u.avatar, u.full_name, u.is_verified, u.badge_title
                  FROM posts p
                  LEFT JOIN users u ON p.user_id = u.id
                  WHERE p.post_type = 'blog' AND p.status = 'published'
                  ORDER BY p.view_count DESC
                  LIMIT :limit";
        return $this->query($query, ['limit' => $limit]);
    }
}
?>