<?php
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../models/Comment.php';

class CommentController {
    private $commentModel;
    
    public function __construct() {
        $this->commentModel = new Comment();
    }

    /**
     * ✅ PUBLIC: Lấy danh sách bình luận của post
     * GET /api/posts/{id}/comments
     */
    public function index($postId) {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            
            $commentsData = $this->commentModel->getPostComments($postId, $page, $limit);
            
            // Setup replies total
            foreach ($commentsData['comments'] as &$comment) {
                $comment['replies'] = [];
                $comment['replies_total'] = $comment['reply_count'];
            }
            
            Response::success('Danh sách bình luận', $commentsData);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Tạo bình luận mới cho post
     * POST /api/posts/{id}/comments
     */
    public function store($postId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['content']) || trim($input['content']) === '') {
                Response::error('Nội dung bình luận không được để trống', 400);
            }

            $commentId = $this->commentModel->create(
                $postId, 
                $currentUser['user_id'], 
                trim($input['content'])
            );
            
            if (!$commentId) {
                Response::error('Không thể tạo bình luận', 500);
            }
            
            Response::success('Bình luận thành công', ['comment_id' => $commentId], 201);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Trả lời một bình luận
     * POST /api/posts/{id}/comments/{parentId}/reply
     */
    public function reply($postId, $parentId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['content']) || trim($input['content']) === '') {
                Response::error('Nội dung trả lời không được để trống', 400);
            }

            // Optional: Kiểm tra parent comment tồn tại và thuộc post này
            $parent = $this->commentModel->find($parentId);
            if (!$parent || $parent['post_id'] != $postId) {
                Response::error('Bình luận cha không tồn tại', 404);
            }

            $commentId = $this->commentModel->create(
                $postId, 
                $currentUser['user_id'], 
                trim($input['content']), 
                $parentId
            );
            
            if (!$commentId) {
                Response::error('Không thể tạo phản hồi', 500);
            }
            
            Response::success('Trả lời thành công', ['comment_id' => $commentId], 201);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * ✅ PUBLIC: Lấy danh sách phản hồi của comment
     * GET /api/comments/{id}/replies
     */
    public function getReplies($commentId) {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
            
            $replies = $this->commentModel->getReplies($commentId, $page, $limit);
            Response::success('Danh sách phản hồi', $replies);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Xóa bình luận (soft delete)
     * DELETE /api/comments/{id}
     */
    public function destroy($commentId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            
            // Check ownership
            if (!$this->commentModel->isOwner($commentId, $currentUser['user_id'])) {
                Response::error('Bạn không có quyền xóa bình luận này', 403);
            }
            
            $this->commentModel->softDelete($commentId);
            Response::success('Xóa bình luận thành công');
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }
}
?>