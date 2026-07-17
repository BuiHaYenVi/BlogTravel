<?php
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../models/Post.php';

class PostController {
    private $postModel;
    
    public function __construct() {
        $this->postModel = new Post();
    }

    /**
     * ✅ PUBLIC: Danh sách bài post (tóm tắt)
     * GET /api/posts
     */
    public function index() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $limit = min(max($limit, 1), 100); // Giới hạn 1-100
            
            $posts = $this->postModel->getPostsList($limit);
            Response::success('Danh sách bài post', $posts);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * ✅ PUBLIC: Chi tiết bài post
     * GET /api/posts/{id}
     */
    public function show($id) {
        try {
            // Lấy user_id từ token nếu có (để check is_liked)
            $currentUserId = null;
            try {
                $currentUser = AuthMiddleware::verifyToken(false); // false = không throw error
                $currentUserId = $currentUser['user_id'] ?? null;
            } catch (Exception $e) {
                // User chưa login → vẫn hiển thị post bình thường
            }
            
            $post = $this->postModel->getPostDetail($id, $currentUserId);
            
            if (!$post) {
                Response::error('Bài viết không tồn tại hoặc đã bị xóa', 404);
            }
            
            Response::success('Chi tiết bài post', $post);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Đăng bài post mới
     * POST /api/posts
     */
    public function store() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate bắt buộc
            if (empty($input['title']) || empty($input['content'])) {
                Response::error('Thiếu title hoặc content', 400);
            }
            
            // Validate độ dài
            if (mb_strlen($input['title']) > 255) {
                Response::error('Title không được vượt quá 255 ký tự', 400);
            }
            
            $postId = $this->postModel->create($currentUser['user_id'], [
                'title' => trim($input['title']),
                'content' => trim($input['content']),
                'location_id' => $input['location_id'] ?? null,
                'post_type' => $input['post_type'] ?? 'blog'
            ]);
            
            if (!$postId) {
                Response::error('Không thể tạo bài viết', 500);
            }
            
            Response::success('Đăng bài thành công', ['post_id' => $postId], 201);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Cập nhật bài post
     * PUT /api/posts/{id}
     */
    public function update($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Kiểm tra post tồn tại
            if (!$this->postModel->exists($id)) {
                Response::error('Bài viết không tồn tại', 404);
            }
            
            // Validate dữ liệu nếu có gửi lên
            if (isset($input['title']) && mb_strlen($input['title']) > 255) {
                Response::error('Title không được vượt quá 255 ký tự', 400);
            }
            
            $updated = $this->postModel->update($id, $currentUser['user_id'], [
                'title' => $input['title'] ?? null,
                'content' => $input['content'] ?? null,
                'location_id' => $input['location_id'] ?? null,
                'post_type' => $input['post_type'] ?? null
            ]);
            
            if ($updated === false) {
                Response::error('Bạn không có quyền sửa bài viết này', 403);
            }
            
            if ($updated === 0) {
                Response::error('Không có trường nào để cập nhật', 400);
            }
            
            Response::success('Cập nhật bài viết thành công');
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Xóa bài post (soft delete)
     * DELETE /api/posts/{id}
     */
    public function destroy($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            
            // Kiểm tra post tồn tại
            if (!$this->postModel->exists($id)) {
                Response::error('Bài viết không tồn tại', 404);
            }
            
            $deleted = $this->postModel->softDelete($id, $currentUser['user_id']);
            
            if ($deleted === false) {
                Response::error('Bạn không có quyền xóa bài viết này', 403);
            }
            
            Response::success('Xóa bài viết thành công');
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Thích bài post
     * POST /api/posts/{id}/like
     */
    public function like($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            
            // Kiểm tra post tồn tại
            if (!$this->postModel->exists($id)) {
                Response::error('Bài viết không tồn tại', 404);
            }
            
            $liked = $this->postModel->like($id, $currentUser['user_id']);
            
            if (!$liked) {
                Response::error('Bạn đã thích bài viết này', 400);
            }
            
            Response::success('Đã thích bài viết');
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Bỏ thích bài post
     * DELETE /api/posts/{id}/like
     */
    public function unlike($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            
            $this->postModel->unlike($id, $currentUser['user_id']);
            
            Response::success('Đã bỏ thích bài viết');
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }
}
?>