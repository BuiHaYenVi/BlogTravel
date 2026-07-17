<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Post;
use App\Models\Notification;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;
use PDO;
use App\Config\Database;

class PostController extends BaseController {
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
            // Lấy user_id từ token nếu có (để check is_liked)
            $currentUserId = null;
            try {
                $currentUser = AuthMiddleware::verifyToken(false);
                $currentUserId = $currentUser['user_id'] ?? null;
            } catch (Exception $e) {}

            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $limit = min(max($limit, 1), 100); // Giới hạn 1-100
            
            $posts = $this->postModel->getPostsList($limit, null, $currentUserId);
            
            // Giải mã JSON cho các trường ảnh dạng json_agg
            foreach ($posts as &$post) {
                if (isset($post['images']) && is_string($post['images'])) {
                    $post['images'] = json_decode($post['images'], true);
                }
                if (isset($post['original_images']) && is_string($post['original_images'])) {
                    $post['original_images'] = json_decode($post['original_images'], true);
                }
            }
            
            return $this->success('Danh sách bài post', $posts);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
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
                return $this->error('Bài viết không tồn tại hoặc đã bị xóa', 404);
            }
            
            if (!empty($post['group_id'])) {
                $groupModel = new \App\Models\Group();
                $group = $groupModel->findById($post['group_id']);
                if ($group && $group['is_private']) {
                    if (!$currentUserId) {
                        return $this->error('Đây là bài viết thuộc nhóm riêng tư. Bạn cần đăng nhập để xem.', 401);
                    }
                    $role = $groupModel->getUserRole($post['group_id'], $currentUserId);
                    if (!$role) {
                        return $this->error('Đây là bài viết thuộc nhóm riêng tư. Bạn phải là thành viên để xem.', 403);
                    }
                }
            }
            
            if (isset($post['images']) && is_string($post['images'])) {
                $post['images'] = json_decode($post['images'], true);
            }
            
            return $this->success('Chi tiết bài post', $post);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Đăng bài post mới
     * POST /api/posts
     */
    public function store() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = $this->getInput();
            
            // Validate bắt buộc
            if (empty($input['title']) || empty($input['content'])) {
                return $this->error('Thiếu title hoặc content', 400);
            }
            
            // Validate độ dài
            if (mb_strlen($input['title']) > 255) {
                return $this->error('Title không được vượt quá 255 ký tự', 400);
            }
            
            $postId = $this->postModel->create($currentUser['user_id'], [
                'title' => trim($input['title']),
                'content' => trim($input['content']),
                'location_id' => $input['location_id'] ?? null,
                'post_type' => $input['post_type'] ?? 'blog'
            ]);
            
            if (!$postId) {
                return $this->error('Không thể tạo bài viết', 500);
            }
            
            // ✅ Cập nhật danh hiệu người dùng
            recalculateUserBadge($currentUser['user_id']);
            
            return $this->success('Đăng bài thành công', ['post_id' => $postId], 201);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Cập nhật bài post
     * PUT /api/posts/{id}
     */
    public function update($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = $this->getInput();
            
            // Kiểm tra post tồn tại
            if (!$this->postModel->exists($id)) {
                return $this->error('Bài viết không tồn tại', 404);
            }
            
            // Validate dữ liệu nếu có gửi lên
            if (isset($input['title']) && mb_strlen($input['title']) > 255) {
                return $this->error('Title không được vượt quá 255 ký tự', 400);
            }
            
            $updated = $this->postModel->update($id, $currentUser['user_id'], [
                'title' => $input['title'] ?? null,
                'content' => $input['content'] ?? null,
                'location_id' => $input['location_id'] ?? null,
                'post_type' => $input['post_type'] ?? null
            ]);
            
            if ($updated === false) {
                return $this->error('Bạn không có quyền sửa bài viết này', 403);
            }
            
            if ($updated === 0) {
                return $this->error('Không có trường nào để cập nhật', 400);
            }
            
            return $this->success('Cập nhật bài viết thành công');
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
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
                return $this->error('Bài viết không tồn tại', 404);
            }
            
            // Lấy thông tin thô của bài viết
            $post = $this->postModel->getPostDetailRaw($id);
            if (!$post) {
                return $this->error('Bài viết không tồn tại', 404);
            }
            
            $allowed = false;
            if ((int)$post['user_id'] === (int)$currentUser['user_id']) {
                $allowed = true;
            } else if (!empty($post['group_id'])) {
                $groupModel = new \App\Models\Group();
                $role = $groupModel->getUserRole($post['group_id'], $currentUser['user_id']);
                if ($role && in_array($role, ['owner', 'admin', 'moderator'])) {
                    // Nếu là Kiểm duyệt viên (moderator), chỉ được xóa bài của Thành viên (member) hoặc khách vãng lai
                    if ($role === 'moderator') {
                        $authorRole = $groupModel->getUserRole($post['group_id'], $post['user_id']);
                        if (!$authorRole || $authorRole === 'member') {
                            $allowed = true;
                        }
                    } else {
                        // Owner và Admin có toàn quyền xóa
                        $allowed = true;
                    }
                }
            }
            
            if (!$allowed) {
                return $this->error('Bạn không có quyền xóa bài viết này', 403);
            }
            
            // Thực hiện soft delete: cập nhật status thành 'deleted'
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("UPDATE posts SET status = 'deleted', updated_at = NOW() WHERE id = :id");
            $deleted = $stmt->execute(['id' => $id]);
            
            if (!$deleted) {
                return $this->error('Lỗi khi xóa bài viết', 500);
            }
            
            // ✅ Cập nhật lại danh hiệu sau khi xóa bài
            recalculateUserBadge($currentUser['user_id']);
            
            return $this->success('Xóa bài viết thành công');
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Like bài post
     * POST /api/posts/{id}/like
     */
    public function like($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            
            $post = $this->postModel->find($id);
            if (!$post) {
                return $this->error('Bài viết không tồn tại', 404);
            }
            
            if (!empty($post['group_id'])) {
                $groupModel = new \App\Models\Group();
                $role = $groupModel->getUserRole($post['group_id'], $currentUser['user_id']);
                if (!$role) {
                    return $this->error('Bạn cần tham gia nhóm để thích bài viết này', 403);
                }
            }
            
            $newLikeCount = $this->postModel->like($id, $currentUser['user_id']);
            
            // ✅ Tạo thông báo cho chủ bài viết
            try {
                if ($post && (int)$post['user_id'] !== (int)$currentUser['user_id']) {
                    $db = Database::getInstance()->getConnection();
                    $stmt = $db->prepare("SELECT 1 FROM notifications WHERE user_id = :uid AND actor_id = :aid AND type = 'like' AND target_id = :tid AND target_type = 'post'");
                    $stmt->execute([
                        'uid' => $post['user_id'],
                        'aid' => $currentUser['user_id'],
                        'tid' => $id
                    ]);
                    if (!$stmt->fetch()) {
                        $notification = new Notification();
                        $notification->create([
                            'user_id' => $post['user_id'],
                            'actor_id' => $currentUser['user_id'],
                            'type' => 'like',
                            'target_id' => $id,
                            'target_type' => 'post'
                        ]);
                    }
                }
            } catch (Exception $e) {
                error_log("Notification error (post_like): " . $e->getMessage());
            }
            
            return $this->success('Đã thích bài viết', $newLikeCount);
        } catch (Exception $e) {
            return $this->error('Lỗi server (Like): ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Bỏ thích bài post
     * DELETE /api/posts/{id}/like
     */
    public function unlike($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            
            $post = $this->postModel->find($id);
            if (!$post) {
                return $this->error('Bài viết không tồn tại', 404);
            }
            
            if (!empty($post['group_id'])) {
                $groupModel = new \App\Models\Group();
                $role = $groupModel->getUserRole($post['group_id'], $currentUser['user_id']);
                if (!$role) {
                    return $this->error('Bạn cần tham gia nhóm để thích bài viết này', 403);
                }
            }
            
            $newLikeCount = $this->postModel->unlike($id, $currentUser['user_id']);
            
            return $this->success('Đã bỏ thích bài viết', $newLikeCount);
        } catch (Exception $e) {
            return $this->error('Lỗi server (Unlike): ' . $e->getMessage(), 500);
        }
    }

    /**
     * 🔐 PROTECTED: Chia sẻ bài viết
     * POST /api/posts/{id}/share
     */
    public function share($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = $this->getInput();
            
            $targetGroupId = $input['target_group_id'] ?? null;
            $content = $input['content'] ?? '';

            if (!$targetGroupId) {
                return $this->error('Thiếu target_group_id', 400);
            }

            $sourcePost = $this->postModel->find($id);
            if (!$sourcePost) {
                return $this->error('Bài viết gốc không tồn tại', 404);
            }

            $groupModel = new \App\Models\Group();

            if (!empty($sourcePost['group_id'])) {
                $sourceGroup = $groupModel->findById($sourcePost['group_id']);
                if ($sourceGroup && $sourceGroup['is_private']) {
                    $sourceRole = $groupModel->getUserRole($sourcePost['group_id'], $currentUser['user_id']);
                    if (!$sourceRole) {
                        return $this->error('Bạn không có quyền chia sẻ bài viết từ nhóm riêng tư này', 403);
                    }
                }
            }

            $targetRole = $groupModel->getUserRole($targetGroupId, $currentUser['user_id']);
            if (!$targetRole) {
                return $this->error('Bạn cần tham gia nhóm đích để chia sẻ bài viết vào nhóm đó', 403);
            }

            $shareId = $this->postModel->share(
                $currentUser['user_id'],
                $id,
                $targetGroupId,
                $content
            );

            if (!$shareId) {
                return $this->error('Lỗi khi lưu bài chia sẻ vào database', 500);
            }

            return $this->success('Chia sẻ bài viết thành công', ['share_id' => $shareId]);
        } catch (Exception $e) {
            return $this->error('Lỗi server (Share): ' . $e->getMessage(), 500);
        }
    }
}
