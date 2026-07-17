<?php
require_once __DIR__ . '/BaseModel.php';

class Location extends BaseModel {
    protected $table = 'locations';
    
    /**
     * Tạo địa điểm mới
     * @param array $data Dữ liệu location
     * @return int ID vừa tạo
     */
    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (name, slug, type, region, description, short_desc, 
                   image, lat, lng, address, status, created_at) 
                  VALUES (:name, :slug, :type, :region, :description, :short_desc, 
                          :image, :lat, :lng, :address, 'active', NOW())
                  RETURNING id";
        
        $result = $this->query($query, [
            'name' => $data['name'],
            'slug' => $data['slug'],
            'type' => $data['type'] ?? 'province',
            'region' => $data['region'] ?? null,
            'description' => $data['description'] ?? null,
            'short_desc' => $data['short_desc'] ?? null,
            'image' => $data['image'] ?? null,
            'lat' => $data['lat'] ?? null,
            'lng' => $data['lng'] ?? null,
            'address' => $data['address'] ?? null
        ]);
        
        return (int)($result[0]['id'] ?? 0);
    }
    
    /**
     * Kiểm tra slug đã tồn tại chưa
     * @param string $slug
     * @return bool
     */
    public function slugExists($slug) {
        $result = $this->query("SELECT id FROM {$this->table} WHERE slug = :slug LIMIT 1", ['slug' => $slug]);
        return !empty($result);
    }
    
    /**
     * Lấy danh sách locations (list view)
     * @return array
     */
    public function getAll() {
        $query = "SELECT 
                    id, name, slug, type, 
                    short_desc,
                    image,
                    region,
                    (SELECT COUNT(*) FROM posts WHERE location_id = locations.id) as post_count,
                    (SELECT COUNT(*) FROM reviews WHERE location_id = locations.id) as review_count,
                    (SELECT AVG(rating) FROM reviews WHERE location_id = locations.id) as avg_rating
                 FROM {$this->table} 
                 WHERE status = 'active'
                 ORDER BY name";
        
        return $this->query($query);
    }
    
    /**
     * Lấy chi tiết location theo ID hoặc Slug (bao gồm attractions và blogs)
     * @param mixed $idOrSlug
     * @return array|null
     */
    public function getFullDetail($idOrSlug) {
        $field = is_numeric($idOrSlug) ? 'id' : 'slug';
        $query = "SELECT * FROM {$this->table} WHERE {$field} = :val AND status = 'active'";
        $location = $this->query($query, ['val' => $idOrSlug])[0] ?? null;

        if (!$location) return null;

        // Lấy danh sách điểm tham quan (spots)
        $location['attractions'] = $this->query(
            "SELECT * FROM {$this->table} WHERE parent_id = :id AND type = 'spot' AND status = 'active' ORDER BY name",
            ['id' => $location['id']]
        );

        // Lấy danh sách bài viết liên quan (blogs/posts)
        $location['blogs'] = $this->query(
            "SELECT p.*, u.username, u.avatar 
             FROM posts p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.location_id = :id AND p.status = 'published' 
             ORDER BY p.created_at DESC",
            ['id' => $location['id']]
        );

        // Xử lý gallery (giả sử lưu dạng JSON hoặc chuỗi phân cách bởi dấu phẩy)
        if (!empty($location['gallery'])) {
            if (is_string($location['gallery']) && strpos($location['gallery'], '[') === 0) {
                $location['gallery'] = json_decode($location['gallery'], true);
            } elseif (is_string($location['gallery'])) {
                $location['gallery'] = array_filter(explode(',', $location['gallery']));
            }
        } else {
            $location['gallery'] = [];
        }

        return $location;
    }

    /**
     * Lấy chi tiết location theo ID
     * @param int $id
     * @return array|null
     */
    public function findById($id) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id AND status = 'active'";
        $result = $this->query($query, ['id' => $id]);
        return $result[0] ?? null;
    }
    
    /**
     * Check-in tại địa điểm
     * @param int $userId
     * @param int $locationId
     * @param string|null $note
     * @return int Check-in ID
     */
    public function checkin($userId, $locationId, $note = null) {
        $query = "INSERT INTO checkins (user_id, location_id, note, checked_at) 
                  VALUES (:user_id, :location_id, :note, NOW()) 
                  RETURNING id";
        
        $result = $this->query($query, [
            'user_id' => $userId,
            'location_id' => $locationId,
            'note' => $note
        ]);
        
        return (int)($result[0]['id'] ?? 0);
    }
    
    /**
     * Đánh giá địa điểm
     * @param int $userId
     * @param int $locationId
     * @param int $rating
     * @param array $extraData title, content, visit_date
     * @return int Review ID
     */
    public function review($userId, $locationId, $rating, $extraData = []) {
        $query = "INSERT INTO reviews (user_id, location_id, rating, title, content, visit_date, status) 
                  VALUES (:user_id, :location_id, :rating, :title, :content, :visit_date, 'approved') 
                  RETURNING id";
        
        $result = $this->query($query, [
            'user_id' => $userId,
            'location_id' => $locationId,
            'rating' => $rating,
            'title' => $extraData['title'] ?? null,
            'content' => $extraData['content'] ?? null,
            'visit_date' => $extraData['visit_date'] ?? null
        ]);
        
        return (int)($result[0]['id'] ?? 0);
    }
    
    /**
     * Lấy danh sách check-ins của location
     * @param int $locationId
     * @param int $limit
     * @return array
     */
    public function getCheckins($locationId, $limit = 20) {
        $query = "SELECT c.*, u.username, u.avatar 
                  FROM checkins c
                  JOIN users u ON c.user_id = u.id
                  WHERE c.location_id = :location_id
                  ORDER BY c.checked_at DESC
                  LIMIT :limit";
        
        return $this->query($query, [
            'location_id' => $locationId,
            'limit' => $limit
        ]);
    }
    
    /**
     * Lấy danh sách reviews của location
     * @param int $locationId
     * @param int $limit
     * @return array
     */
    public function getReviews($locationId, $limit = 20) {
        $query = "SELECT r.*, u.username, u.avatar 
                  FROM reviews r
                  JOIN users u ON r.user_id = u.id
                  WHERE r.location_id = :location_id AND r.status = 'approved'
                  ORDER BY r.created_at DESC
                  LIMIT :limit";
        
        return $this->query($query, [
            'location_id' => $locationId,
            'limit' => $limit
        ]);
    }
    
    /**
     * Cập nhật location
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['name', 'slug', 'type', 'region', 'description', 'short_desc', 'image', 'lat', 'lng', 'address'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        
        if (empty($fields)) return false;
        
        $fields[] = "updated_at = NOW()";
        $setClause = implode(', ', $fields);
        
        $query = "UPDATE {$this->table} SET {$setClause} WHERE id = :id";
        return $this->execute($query, $params);
    }
    
    /**
     * Xóa location (soft delete)
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $query = "UPDATE {$this->table} SET status = 'deleted', updated_at = NOW() WHERE id = :id";
        return $this->execute($query, ['id' => $id]);
    }
}
?>