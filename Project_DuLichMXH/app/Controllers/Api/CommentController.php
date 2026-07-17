<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Comment;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;

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
            
            $userId = null;
            try {
                $user = AuthMiddleware::verifyToken();
                $userId = $user['user_id'];
            } catch (Exception $e) {}

            foreach ($commentsData['comments'] as &$comment) {
                // Đảm bảo ID luôn là string để Frontend xử lý key tốt hơn
                $comment['id'] = (string)$comment['id'];
                $comment['replies'] = [];
                $comment['replies_total'] = (int)$comment['reply_count'];
                $comment['like_count'] = $this->commentModel->getLikeCount($comment['id']);
                if ($userId) {
                    $comment['is_liked'] = $this->commentModel->isLiked($comment['id'], $userId);
                }
            }
            
            Response::success('Danh sách bình luận', $commentsData);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * ✅ PUBLIC: Lấy danh sách bình luận mới nhất
     */
    public function latest() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $comments = $this->commentModel->getLatestComments($limit);
            foreach ($comments as &$c) {
                $c['id'] = (string)$c['id'];
                $c['post_id'] = (string)$c['post_id'];
            }
            Response::success('Bình luận mới nhất', $comments);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Tạo bình luận mới cho post
     */
    public function store($postId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['content']) || trim($input['content']) === '') {
                Response::error('Nội dung bình luận không được để trống', 400);
            }

            $parentId = !empty($input['parent_id']) ? $input['parent_id'] : null;

            $commentId = $this->commentModel->create(
                $postId, 
                $currentUser['user_id'], 
                trim($input['content']),
                $parentId
            );
            
            if (!$commentId) {
                Response::error('Không thể tạo bình luận', 500);
            }

            // Realtime Sync
            if (function_exists('sync_comment_to_socket')) {
                $comment = $this->commentModel->find($commentId);
                if ($comment) {
                    $userModel = new \App\Models\User();
                    $u = $userModel->find($currentUser['user_id']);
                    $comment['id'] = (string)$comment['id'];
                    $comment['username'] = $u['username'] ?? 'User';
                    $comment['avatar'] = $u['avatar'] ?? '';
                    $comment['reply_count'] = 0;
                    $comment['replies'] = [];
                    $comment['replies_total'] = 0;
                    sync_comment_to_socket($postId, $comment);
                }
            }
            
            Response::success('Bình luận thành công', ['comment_id' => (string)$commentId], 201);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * ✅ PUBLIC: Lấy danh sách phản hồi của comment
     */
    public function getReplies($commentId) {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            
            $replies = $this->commentModel->getReplies($commentId, $page, $limit);
            
            $userId = null;
            try {
                $user = AuthMiddleware::verifyToken();
                $userId = $user['user_id'];
            } catch (Exception $e) {}

            foreach ($replies['replies'] as &$reply) {
                $reply['id'] = (string)$reply['id'];
                $reply['parent_id'] = (string)$reply['parent_id'];
                $reply['replies'] = [];
                // QUAN TRỌNG: Thiết lập replies_total để tầng 3 có thể hiện nút "Xem thêm"
                $reply['replies_total'] = (int)$reply['reply_count'];
                $reply['like_count'] = $this->commentModel->getLikeCount($reply['id']);
                if ($userId) {
                    $reply['is_liked'] = $this->commentModel->isLiked($reply['id'], $userId);
                }
            }

            Response::success('Danh sách phản hồi', $replies);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Like/Unlike bình luận
     */
    public function like($commentId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];

            if ($this->commentModel->isLiked($commentId, $userId)) {
                $this->commentModel->unlike($commentId, $userId);
                $msg = 'Bỏ thích thành công';
                $isLiked = false;
            } else {
                $this->commentModel->like($commentId, $userId);
                $msg = 'Thích thành công';
                $isLiked = true;
            }

            Response::success($msg, [
                'is_liked' => $isLiked,
                'like_count' => $this->commentModel->getLikeCount($commentId)
            ]);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Xóa bình luận
     */
    public function destroy($commentId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            if (!$this->commentModel->isOwner($commentId, $currentUser['user_id'])) {
                Response::error('Bạn không có quyền xóa bình luận này', 403);
            }
            $this->commentModel->softDelete($commentId);
            Response::success('Xóa bình luận thành công');
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function getCommentsByBlog($blogId) {
        return $this->index($blogId);
    }

    public function hide($id) {
        try {
            $sql = "UPDATE comments SET status = 'hidden', updated_at = NOW() WHERE id = :id";
            $this->commentModel->execute($sql, ['id' => $id]);
            Response::success('Đã ẩn bình luận');
        } catch (Exception $e) {
            Response::error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    public function hideForMe($id) {
        Response::success('Đã ẩn bình luận với bạn');
    }
}
?>