<?php
namespace App\Models;

class AdminContentModel extends BaseModel {
    
    public function getPosts(int $page, int $limit): array {
        return $this->paginate("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.status != 'hidden' ORDER BY p.created_at DESC", $page, $limit);
    }
    
    public function deletePost(int $id): bool { 
        return $this->execute("UPDATE posts SET status = 'hidden', updated_at = NOW() WHERE id = ?", [$id]) > 0; 
    }
    
    public function getBlogs(int $page, int $limit): array {
        return $this->paginate("SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.post_type = 'blog' AND p.status != 'hidden' ORDER BY p.created_at DESC", $page, $limit);
    }
    
    public function deleteBlog(int $id): bool { 
        return $this->deletePost($id); 
    }

    public function getComments(int $page, int $limit): array {
        return $this->paginate("SELECT c.*, u.username, p.title as post_title FROM comments c JOIN users u ON c.user_id = u.id LEFT JOIN posts p ON c.post_id = p.id WHERE c.status = 'active' ORDER BY c.created_at DESC", $page, $limit);
    }
    
    public function deleteComment(int $id): bool { 
        return $this->execute("UPDATE comments SET status = 'hidden', updated_at = NOW() WHERE id = ?", [$id]) > 0; 
    }

    public function getPost(int $id): ?array {
        $sql = "SELECT p.*, u.username, u.avatar, p.user_id, p.comment_count,
                       (SELECT json_agg(pm.url) FROM post_media pm WHERE pm.post_id = p.id) as images
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.id = ?";
        $res = $this->query($sql, [$id]);
        $post = $res[0] ?? null;
        if ($post && isset($post['images']) && is_string($post['images'])) {
            $post['images'] = json_decode($post['images'], true);
        }
        return $post;
    }

    public function getPostComments(int $postId): array {
        $sql = "SELECT c.*, u.username, u.avatar 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.post_id = ? AND c.status = 'active'
                ORDER BY c.created_at DESC";
        return $this->query($sql, [$postId]);
    }

    public function getBlog(int $id): ?array {
        return $this->getPost($id);
    }

    public function getBlogComments(int $blogId): array {
        return $this->getPostComments($blogId);
    }

    /**
     * Get stories with filter, search, and pagination support
     */
    public function getStories(int $page, int $limit, string $search = '', string $status = 'All'): array {
        $where = ["s.is_deleted = FALSE"]; // Chỉ lấy những story chưa bị xóa hẳn
        $params = [];

        // Status filter
        if ($status === 'Active') {
            $where[] = "s.is_active = TRUE AND s.expires_at > NOW()";
        } elseif ($status === 'Expired') {
            $where[] = "s.is_active = TRUE AND s.expires_at <= NOW()";
        } elseif ($status === 'Hidden') {
            $where[] = "s.is_active = FALSE";
        }

        // Search filter
        if (!empty($search)) {
            $where[] = "(u.username ILIKE ? OR u.email ILIKE ? OR s.caption ILIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        if ($status === 'Reported') {
            // For Reported, we need to filter after aggregation
            $sql = "SELECT s.id, s.user_id, s.media_url, s.media_type, s.caption,
                           s.is_active, s.is_deleted, s.created_at, s.expires_at,
                           u.username, u.email, u.avatar, u.full_name,
                           (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id) as like_count,
                           (SELECT COUNT(*) FROM reports r WHERE r.reportable_type = 'story' AND r.reportable_id = s.id) as report_count
                    FROM stories s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.is_deleted = FALSE
                    ORDER BY s.created_at DESC";
            
            $allData = $this->query($sql, []);
            $filtered = array_filter($allData, fn($row) => (int)($row['report_count'] ?? 0) > 0);
            $filtered = array_values($filtered);
            $total = count($filtered);
            $offset = ($page - 1) * $limit;
            $data = array_slice($filtered, $offset, $limit);
            
            return [
                'data' => $data,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'total_pages' => $limit > 0 ? ceil($total / $limit) : 1
                ]
            ];
        }

        $sql = "SELECT s.id, s.user_id, s.media_url, s.media_type, s.caption,
                       s.is_active, s.is_deleted, s.created_at, s.expires_at,
                       u.username, u.email, u.avatar, u.full_name,
                       (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id) as like_count,
                       (SELECT COUNT(*) FROM reports r WHERE r.reportable_type = 'story' AND r.reportable_id = s.id) as report_count
                FROM stories s
                JOIN users u ON s.user_id = u.id
                {$whereClause}
                ORDER BY s.created_at DESC";

        return $this->paginateWithParams($sql, $params, $page, $limit);
    }

    /**
     * Ẩn một story (is_active = FALSE)
     */
    public function hideStory(int $id): bool {
        return $this->execute("UPDATE stories SET is_active = FALSE, updated_at = NOW() WHERE id = ?", [$id]) > 0;
    }

    /**
     * Xóa vĩnh viễn/đánh dấu xóa story (is_deleted = TRUE)
     */
    public function deleteStory(int $id): bool {
        return $this->execute("UPDATE stories SET is_deleted = TRUE, updated_at = NOW() WHERE id = ?", [$id]) > 0;
    }

    /**
     * Paginate a query with positional params (? placeholders)
     */
    public function paginateWithParams(string $sql, array $params, int $page, int $limit): array {
        $offset = ($page - 1) * $limit;

        $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as tmp";
        $countResult = $this->query($countSql, $params);
        $total = (int)($countResult[0]['total'] ?? 0);

        $data = $this->query("{$sql} LIMIT {$limit} OFFSET {$offset}", $params);

        return [
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => $limit > 0 ? ceil($total / $limit) : 1
            ]
        ];
    }

    // Helper phân trang chuẩn (internal)
    private function paginate($sql, $page, $limit): array {
        $offset = ($page-1)*$limit;
        $total = (int)$this->query("SELECT COUNT(*) as total FROM ({$sql}) as tmp")[0]['total'];
        return [
            'data' => $this->query("{$sql} LIMIT {$limit} OFFSET {$offset}"), 
            'pagination' => [
                'total'=>$total, 
                'page'=>$page, 
                'limit'=>$limit, 
                'total_pages'=>ceil($total/$limit)
            ]
        ];
    }
}