<?php
namespace App\Models;

/**
 * Tag Model - Enhanced for Hashtag features
 * Giữ nguyên method cũ + Thêm method mới cho hashtag
 */
class Tag extends BaseModel {
    protected $table = 'tags';
    
    // ===== CONSTANTS =====
    const TYPE_TOPIC = 'topic';
    const TYPE_HASHTAG = 'hashtag';
    const TYPE_LOCATION = 'location';
    const TYPE_CUISINE = 'cuisine';
    
    // ===== EXISTING METHODS =====
    
    public function findOrCreate($name, $type = 'topic') {
        $result = $this->query("SELECT id FROM {$this->table} WHERE name = :name", ['name' => $name]);
        
        if (!empty($result)) {
            return $result[0]['id'];
        }
        
        $slug = $this->generateSlug($name);
        $this->execute(
            "INSERT INTO {$this->table} (name, slug, type, created_at) VALUES (:name, :slug, :type, NOW())",
            ['name' => $name, 'slug' => $slug, 'type' => $type]
        );
        
        return $this->getLastInsertId('tags_id_seq');
    }
    
    public function attachToPost($postId, $tagNames, $type = 'hashtag') {
        if (empty($tagNames)) return;
        
        $tagNames = array_unique(array_filter(array_map('trim', $tagNames)));
        
        foreach ($tagNames as $tagName) {
            if (empty($tagName)) continue;
            
            $tagId = $this->findOrCreate($tagName, $type);
            
            $this->execute(
                "INSERT INTO post_tags (post_id, tag_id) VALUES (:post_id, :tag_id) 
                 ON CONFLICT (post_id, tag_id) DO NOTHING",
                ['post_id' => $postId, 'tag_id' => $tagId]
            );
        }
        
        $this->updateTagCounts($tagNames);
    }
    
    public function updateForPost($postId, $tagNames, $type = 'hashtag') {
        $this->execute("DELETE FROM post_tags WHERE post_id = :post_id", ['post_id' => $postId]);
        
        if (!empty($tagNames)) {
            $this->attachToPost($postId, $tagNames, $type);
        }
    }
    
    public function getForPost($postId) {
        $query = "SELECT t.* FROM tags t
                  INNER JOIN post_tags pt ON t.id = pt.tag_id
                  WHERE pt.post_id = :post_id
                  ORDER BY t.name";
        return $this->query($query, ['post_id' => $postId]);
    }
    
    // ===== NEW METHODS FOR HASHTAG FEATURES =====
    
    public static function extractFromContent($content) {
        if (empty($content)) return [];
        
        preg_match_all('/#([\p{L}\p{N}_\p{M}]+)/u', $content, $matches);
        
        if (empty($matches[1])) return [];
        
        $tags = [];
        foreach ($matches[1] as $tag) {
            $slug = self::slugify($tag);
            if (!empty($slug) && !in_array($slug, $tags)) {
                $tags[] = $slug;
            }
        }
        
        return $tags;
    }
    
    private static function slugify($string) {
        $slug = mb_strtolower(trim($string), 'UTF-8');
        
        $slug = preg_replace('/[àáạảãâầấậẩẫăằắặẳẵ]/u', 'a', $slug);
        $slug = preg_replace('/[èéẹẻẽêềếệểễ]/u', 'e', $slug);
        $slug = preg_replace('/[ìíịỉĩ]/u', 'i', $slug);
        $slug = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/u', 'o', $slug);
        $slug = preg_replace('/[ùúụủũưừứựửữ]/u', 'u', $slug);
        $slug = preg_replace('/[ỳýỵỷỹ]/u', 'y', $slug);
        $slug = preg_replace('/đ/u', 'd', $slug);
        
        $slug = preg_replace('/[^\p{L}\p{N}\-]/u', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        
        return trim($slug, '-');
    }
    
    public function getPostsByTag($slug, $page = 1, $limit = 10, $postType = null) {
        $offset = ($page - 1) * $limit;
        
        $conditions = ["t.slug = :slug", "p.status = 'published'"];
        $params = ['slug' => $slug, 'limit' => (int)$limit, 'offset' => (int)$offset];
        
        if ($postType) {
            $conditions[] = "p.post_type = :post_type";
            $params['post_type'] = $postType;
        }
        
        $whereClause = implode(' AND ', $conditions);
        
        $query = "SELECT p.*, u.username, u.avatar, u.id as user_id,
                         COUNT(DISTINCT c.id) as comment_count,
                         COUNT(DISTINCT l.id) as like_count
                  FROM posts p
                  JOIN post_tags pt ON p.id = pt.post_id
                  JOIN tags t ON pt.tag_id = t.id
                  LEFT JOIN users u ON p.user_id = u.id
                  LEFT JOIN comments c ON p.id = c.post_id
                  LEFT JOIN likes l ON p.id = l.post_id
                  WHERE {$whereClause}
                  GROUP BY p.id, u.username, u.avatar, u.id
                  ORDER BY p.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        return $this->query($query, $params);
    }
    
    public function countPostsByTag($slug, $postType = null) {
        $conditions = ["t.slug = :slug", "p.status = 'published'"];
        $params = ['slug' => $slug];
        
        if ($postType) {
            $conditions[] = "p.post_type = :post_type";
            $params['post_type'] = $postType;
        }
        
        $whereClause = implode(' AND ', $conditions);
        
        $query = "SELECT COUNT(DISTINCT p.id) as total 
                  FROM posts p
                  JOIN post_tags pt ON p.id = pt.post_id
                  JOIN tags t ON pt.tag_id = t.id
                  WHERE {$whereClause}";
        
        $result = $this->query($query, $params);
        return (int)($result[0]['total'] ?? 0);
    }
    
    public function search($keyword, $limit = 10) {
        $query = "SELECT id, name, slug, type, post_count 
                  FROM tags 
                  WHERE name ILIKE :keyword 
                  ORDER BY post_count DESC, created_at DESC 
                  LIMIT :limit";
        return $this->query($query, [
            'keyword' => "%{$keyword}%",
            'limit' => (int)$limit
        ]);
    }
    
    public function getTrending($limit = 10, $type = 'hashtag') {
        $conditions = ["post_count > 0"];
        $params = [];
        
        if ($type) {
            $conditions[] = "type = :type";
            $params['type'] = $type;
        }
        
        $whereClause = implode(' AND ', $conditions);
        
        $query = "SELECT id, name, slug, post_count, is_trending 
                  FROM tags 
                  WHERE {$whereClause}
                  ORDER BY is_trending DESC, post_count DESC, created_at DESC 
                  LIMIT :limit";
        
        return $this->query($query, array_merge($params, ['limit' => (int)$limit]));
    }
    
    public function getByUser($userId, $limit = 20) {
        $query = "SELECT t.*, COUNT(pt.post_id) as usage_count
                  FROM tags t
                  JOIN post_tags pt ON t.id = pt.tag_id
                  JOIN posts p ON pt.post_id = p.id
                  WHERE p.user_id = :user_id AND p.status = 'published'
                  GROUP BY t.id
                  ORDER BY usage_count DESC, t.created_at DESC
                  LIMIT :limit";
        return $this->query($query, [
            'user_id' => (int)$userId,
            'limit' => (int)$limit
        ]);
    }
    
    private function updateTagCounts($tagNames) {
        if (empty($tagNames)) return;
        
        foreach ($tagNames as $name) {
            $slug = self::slugify($name);
            $this->execute(
                "UPDATE tags SET post_count = (
                    SELECT COUNT(*) FROM post_tags pt 
                    JOIN tags t ON pt.tag_id = t.id 
                    WHERE t.slug = :slug
                 ) WHERE slug = :slug",
                ['slug' => $slug]
            );
        }
    }
    
    public function detachFromPost($postId, $tagSlug) {
        $tag = $this->first("slug = :slug", ['slug' => $tagSlug]);
        if (!$tag) return false;
        
        $result = $this->execute(
            "DELETE FROM post_tags WHERE post_id = :post_id AND tag_id = :tag_id",
            ['post_id' => $postId, 'tag_id' => $tag['id']]
        );
        
        $this->execute(
            "UPDATE tags SET post_count = (SELECT COUNT(*) FROM post_tags WHERE tag_id = :tag_id) WHERE id = :tag_id",
            ['tag_id' => $tag['id']]
        );
        
        return $result > 0;
    }
    
    private function generateSlug($string) {
        return self::slugify($string);
    }

    public function getOnboardingTags() {
        // 1. Lấy danh sách danh mục
        $categories = $this->query("SELECT * FROM tag_categories ORDER BY sort_order ASC, id ASC");
        
        // 2. Lấy danh sách các thẻ sở thích (type = 'interest')
        $tags = $this->query("SELECT id, name, slug, category_id FROM tags WHERE type = 'interest' ORDER BY id ASC");
        
        // 3. Nhóm các thẻ vào danh mục tương ứng
        $grouped = [];
        foreach ($categories as $cat) {
            $catId = $cat['id'];
            $catTags = [];
            foreach ($tags as $t) {
                if ((int)$t['category_id'] === (int)$catId) {
                    $catTags[] = [
                        'id' => $t['id'],
                        'name' => $t['name'],
                        'slug' => $t['slug']
                    ];
                }
            }
            $grouped[] = [
                'id' => $cat['id'],
                'name' => $cat['name'],
                'slug' => $cat['slug'],
                'icon' => $cat['icon'],
                'color' => $cat['color'],
                'tags' => $catTags
            ];
        }
        return $grouped;
    }
}