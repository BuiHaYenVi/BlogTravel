<?php
require_once __DIR__ . '/BaseModel.php';

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
        )";
        
        $this->execute($query, $data);
        return $this->getLastInsertId('posts_id_seq');
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
    public function getAll($filters = []) {
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
        
        $query = "SELECT p.*,
                         u.username, u.avatar,
                         l.name as location_name,
                         COUNT(DISTINCT c.id) as comment_count,
                         COUNT(DISTINCT lks.id) as like_count,
                         COUNT(DISTINCT pt.tag_id) as tag_count
                  FROM posts p
                  LEFT JOIN users u ON p.user_id = u.id
                  LEFT JOIN locations l ON p.location_id = l.id
                  LEFT JOIN comments c ON p.id = c.post_id
                  LEFT JOIN likes lks ON p.id = lks.post_id
                  LEFT JOIN post_tags pt ON p.id = pt.post_id
                  WHERE {$whereClause}
                  GROUP BY p.id, u.username, u.avatar, l.name
                  ORDER BY p.published_at DESC
                  LIMIT {$limit} OFFSET {$offset}";
        
        return $this->query($query, $params);
    }
    
    public function findById($id) {
        $query = "SELECT p.*, u.username, u.avatar, u.email as user_email,
                         l.name as location_name, l.slug as location_slug
                  FROM posts p
                  LEFT JOIN users u ON p.user_id = u.id
                  LEFT JOIN locations l ON p.location_id = l.id
                  WHERE p.id = :id AND p.post_type = 'blog'";
        $result = $this->query($query, ['id' => (int)$id]);
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
        
        $query = "UPDATE posts SET {$setClause} WHERE id = :id AND post_type = 'blog'";
        return $this->execute($query, $params);
    }
    
    public function delete($id) {
        $query = "UPDATE posts SET status = 'deleted', updated_at = NOW() 
                  WHERE id = :id AND post_type = 'blog'";
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
    
    public function exists($id) {
        $query = "SELECT id FROM posts WHERE id = :id AND post_type = 'blog' LIMIT 1";
        $result = $this->query($query, ['id' => (int)$id]);
        return !empty($result);
    }
}
?>