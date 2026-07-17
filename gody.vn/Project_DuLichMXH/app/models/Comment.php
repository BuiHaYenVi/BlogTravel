<?php
require_once __DIR__ . '/BaseModel.php';

class Comment extends BaseModel {
    protected $table = 'comments';
    
    /**
     * Lấy danh sách bình luận cấp 1 của bài post
     */
    public function getPostComments($postId, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        // Lấy tổng số bình luận gốc
        $countSql = "SELECT COUNT(*) as total FROM comments 
                     WHERE post_id = :post_id AND status = 'active' AND parent_id IS NULL";
        $totalResult = $this->query($countSql, ['post_id' => $postId]);
        $total = $totalResult[0]['total'] ?? 0;

        $sql = "SELECT c.*, u.username, u.avatar,
                       (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND status = 'active') as reply_count
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = :post_id 
                  AND c.status = 'active' 
                  AND c.parent_id IS NULL
                ORDER BY c.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $comments = $this->query($sql, [
            'post_id' => $postId,
            'limit' => $limit,
            'offset' => $offset
        ]);

        return [
            'comments' => $comments,
            'total' => $total
        ];
    }
    
    /**
     * Tạo bình luận mới (comment hoặc reply)
     */
    public function create($postId, $userId, $content, $parentId = null) {
        $sql = "INSERT INTO comments (post_id, user_id, content, parent_id, created_at) 
                VALUES (:post_id, :user_id, :content, :parent_id, NOW()) 
                RETURNING id";
        
        $params = [
            'post_id' => $postId,
            'user_id' => $userId,
            'content' => $content,
            'parent_id' => $parentId
        ];
        
        $result = $this->query($sql, $params);
        return $result[0]['id'] ?? null;
    }
    
    /**
     * Lấy danh sách phản hồi của một bình luận
     */
    public function getReplies($commentId, $page = 1, $limit = 5) {
        $offset = ($page - 1) * $limit;

        $countSql = "SELECT COUNT(*) as total FROM comments 
                     WHERE parent_id = :parent_id AND status = 'active'";
        $totalResult = $this->query($countSql, ['parent_id' => $commentId]);
        $total = $totalResult[0]['total'] ?? 0;

        $sql = "SELECT c.*, u.username, u.avatar
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.parent_id = :parent_id 
                  AND c.status = 'active'
                ORDER BY c.created_at ASC
                LIMIT :limit OFFSET :offset";
        
        $replies = $this->query($sql, [
            'parent_id' => $commentId,
            'limit' => $limit,
            'offset' => $offset
        ]);

        return [
            'replies' => $replies,
            'total' => $total
        ];
    }
    
    /**
     * Xóa mềm bình luận
     */
    public function softDelete($commentId) {
        $sql = "UPDATE comments SET status = 'deleted', updated_at = NOW() WHERE id = :id";
        return $this->execute($sql, ['id' => $commentId]);
    }
    
    /**
     * Tìm bình luận kèm thông tin owner (dùng cho check permission)
     */
    public function findWithOwner($commentId) {
        $sql = "SELECT user_id, post_id FROM comments WHERE id = :id LIMIT 1";
        $result = $this->query($sql, ['id' => $commentId]);
        return $result[0] ?? null;
    }
    
    /**
     * Kiểm tra bình luận có thuộc về user không
     */
    public function isOwner($commentId, $userId) {
        $comment = $this->findWithOwner($commentId);
        return $comment && $comment['user_id'] == $userId;
    }
}
?>