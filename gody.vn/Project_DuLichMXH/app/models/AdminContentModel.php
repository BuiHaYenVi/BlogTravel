<?php
// ✅ SỬA PATH: BaseModel.php nằm CÙNG thư mục models/, nên chỉ cần './BaseModel.php'
require_once __DIR__ . '/BaseModel.php';

class AdminContentModel extends BaseModel {
    
    public function getPosts(int $page, int $limit): array {
        return $this->paginate("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.status != 'hidden' ORDER BY p.created_at DESC", $page, $limit);
    }
    
    public function deletePost(int $id): bool { 
        return $this->execute("UPDATE posts SET status = 'hidden', updated_at = NOW() WHERE id = ?", [$id]) > 0; 
    }
    
    public function getBlogs(int $page, int $limit): array {
        return $this->paginate("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.post_type = 'blog' AND p.status != 'hidden' ORDER BY p.created_at DESC", $page, $limit);
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

    // Helper phân trang chuẩn
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