<?php
namespace App\Models;

class Search extends BaseModel {
    /**
     * Tìm kiếm bài posts
     * @param string $keyword Từ khóa tìm kiếm
     * @param int $limit Số kết quả tối đa
     * @return array Danh sách posts
     */
    public function searchPosts($keyword, $limit = 10) {
        $query = "SELECT p.*, u.username, u.avatar, u.is_verified, u.badge_title 
                  FROM posts p 
                  JOIN users u ON p.user_id = u.id 
                  WHERE (p.title ILIKE :kw OR p.content ILIKE :kw) 
                  AND p.status = 'published'
                  ORDER BY p.created_at DESC
                  LIMIT :limit";
        
        return $this->query($query, [
            'kw' => "%{$keyword}%",
            'limit' => $limit
        ]);
    }
    
    /**
     * Tìm kiếm địa điểm
     * @param string $keyword Từ khóa tìm kiếm
     * @param int $limit Số kết quả tối đa
     * @return array Danh sách locations
     */
    public function searchLocations($keyword, $limit = 10) {
        // Tách từ khóa để tìm kiếm linh hoạt hơn (ví dụ "da lat" -> "%da%lat%")
        $searchTerms = explode(' ', $keyword);
        $flexibleKey = '%' . implode('%', $searchTerms) . '%';
        
        $query = "SELECT l.id, l.name, l.slug, l.type, l.region, l.short_desc, l.image, 
                         p.slug as parent_slug,
                         (SELECT COUNT(*) FROM posts WHERE location_id = l.id) as post_count
                  FROM locations l
                  LEFT JOIN locations p ON l.parent_id = p.id
                  WHERE (l.name ILIKE :kw OR l.description ILIKE :flexible OR l.region ILIKE :kw) 
                  AND l.status = 'active'
                  ORDER BY 
                    CASE 
                        WHEN l.name ILIKE :exact THEN 1  -- Khớp chính xác ưu tiên 1
                        WHEN l.name ILIKE :start THEN 2  -- Bắt đầu bằng từ khóa ưu tiên 2
                        ELSE 3 
                    END, 
                    l.name
                  LIMIT :limit";
        
        return $this->query($query, [
            'kw' => "%{$keyword}%",
            'flexible' => $flexibleKey,
            'exact' => $keyword,
            'start' => "{$keyword}%",
            'limit' => $limit
        ]);
    }
    
    /**
     * Tìm kiếm người dùng
     * @param string $keyword Từ khóa tìm kiếm
     * @param int $limit Số kết quả tối đa
     * @return array Danh sách users
     */
    public function searchUsers($keyword, $limit = 10) {
        $query = "SELECT id, username, avatar, bio, follower_count, is_verified, badge_title 
                  FROM users 
                  WHERE (username ILIKE :kw OR full_name ILIKE :kw) 
                  AND status = 'active'
                  ORDER BY username
                  LIMIT :limit";
        
        return $this->query($query, [
            'kw' => "%{$keyword}%",
            'limit' => $limit
        ]);
    }
    
    /**
     * Tìm kiếm groups
     * @param string $keyword Từ khóa tìm kiếm
     * @param int $limit Số kết quả tối đa
     * @return array Danh sách groups
     */
    public function searchGroups($keyword, $limit = 10) {
        $query = "SELECT g.*, u.username as owner_name,
                         (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
                  FROM groups g
                  JOIN users u ON g.owner_id = u.id
                  WHERE (g.name ILIKE :kw OR g.description ILIKE :kw)
                  AND g.is_private = false
                  ORDER BY g.created_at DESC
                  LIMIT :limit";
        
        return $this->query($query, [
            'kw' => "%{$keyword}%",
            'limit' => $limit
        ]);
    }
    
    /**
     * Tìm kiếm toàn bộ (all types)
     * @param string $keyword Từ khóa tìm kiếm
     * @param string $type Loại tìm kiếm: all, post, location, user, group
     * @param int $limit Số kết quả tối đa mỗi loại
     * @return array Kết quả tìm kiếm phân loại
     */
    public function searchAll($keyword, $type = 'all', $limit = 10) {
        $results = [];
        
        if ($type === 'all' || $type === 'post') {
            $results['posts'] = $this->searchPosts($keyword, $limit);
        }
        
        if ($type === 'all' || $type === 'location') {
            $results['locations'] = $this->searchLocations($keyword, $limit);
        }
        
        if ($type === 'all' || $type === 'user') {
            $results['users'] = $this->searchUsers($keyword, $limit);
        }
        
        if ($type === 'all' || $type === 'group') {
            $results['groups'] = $this->searchGroups($keyword, $limit);
        }
        
        return $results;
    }
    
    /**
     * Đếm tổng số kết quả tìm kiếm (cho pagination)
     * @param string $keyword
     * @param string $type
     * @return array Counts per type
     */
    public function countResults($keyword, $type = 'all') {
        $counts = [];
        $kw = "%{$keyword}%";
        
        if ($type === 'all' || $type === 'post') {
            $result = $this->query(
                "SELECT COUNT(*) as total FROM posts 
                 WHERE (title ILIKE :kw OR content ILIKE :kw) AND status = 'published'",
                ['kw' => $kw]
            );
            $counts['posts'] = (int)($result[0]['total'] ?? 0);
        }
        
        if ($type === 'all' || $type === 'location') {
            $result = $this->query(
                "SELECT COUNT(*) as total FROM locations 
                 WHERE (name ILIKE :kw OR description ILIKE :kw) AND status = 'active'",
                ['kw' => $kw]
            );
            $counts['locations'] = (int)($result[0]['total'] ?? 0);
        }
        
        if ($type === 'all' || $type === 'user') {
            $result = $this->query(
                "SELECT COUNT(*) as total FROM users 
                 WHERE (username ILIKE :kw OR full_name ILIKE :kw) AND status = 'active'",
                ['kw' => $kw]
            );
            $counts['users'] = (int)($result[0]['total'] ?? 0);
        }
        
        if ($type === 'all' || $type === 'group') {
            $result = $this->query(
                "SELECT COUNT(*) as total FROM groups 
                 WHERE (name ILIKE :kw OR description ILIKE :kw) AND is_private = false",
                ['kw' => $kw]
            );
            $counts['groups'] = (int)($result[0]['total'] ?? 0);
        }
        
        return $counts;
    }
}
?>