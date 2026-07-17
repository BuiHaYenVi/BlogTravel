<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Blog;
use App\Models\Tag;
use App\Models\PostMedia;
use App\Models\Notification;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use App\Config\Database;
use Exception;
use DateTime;
use PDO;

class BlogController extends BaseController {
    private $blogModel;
    private $tagModel;
    private $mediaModel;
    
    public function __construct() {
        $this->blogModel = new Blog();
        $this->tagModel = new Tag();
        $this->mediaModel = new PostMedia();
    }
    
    /**
     * POST /api/blogs
     * Tạo blog mới
     */
    public function create() {
        try {
            // 1. Xác thực người dùng
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];
            
            // 2. Lấy dữ liệu (hỗ trợ cả JSON và Multipart/Form-data)
            $input = array_merge($_POST, $this->getInput());
            
            error_log("BlogController@create - Input: " . json_encode($input));
            error_log("BlogController@create - Files: " . json_encode($_FILES));
            
            // 3. Validate các trường bắt buộc
            if (empty($input['title']) || empty($input['content'])) {
                return $this->error('Tiêu đề và nội dung không được để trống', 400);
            }
            
            // 4. Xử lý Upload Ảnh bìa (cover_image)
            $coverImagePath = null;
            if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../../../public/uploads/blogs/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                
                $ext = strtolower(pathinfo($_FILES['cover_image']['name'], PATHINFO_EXTENSION));
                $filename = 'blog_cover_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
                
                if (move_uploaded_file($_FILES['cover_image']['tmp_name'], $uploadDir . $filename)) {
                    $coverImagePath = '/uploads/blogs/' . $filename;
                    error_log("BlogController@create - Uploaded cover: " . $coverImagePath);
                } else {
                    error_log("BlogController@create - Failed to move cover_image");
                }
            } else if (!empty($input['cover_image']) && is_string($input['cover_image']) && !str_contains($input['cover_image'], 'blob:')) {
                // Nếu không upload file nhưng có link ảnh (trường hợp edit hoặc link ngoài)
                $coverImagePath = $input['cover_image'];
            }
            
            // 5. Chuẩn bị dữ liệu lưu vào DB
            $slug = $this->generateSlug($input['title']);
            
            // Hàm helper kiểm tra định dạng date hợp lệ
            $validateDate = function($date) {
                if (empty($date) || $date === 'null' || $date === 'undefined') return null;
                // Kiểm tra xem có đúng định dạng YYYY-MM-DD không
                $d = DateTime::createFromFormat('Y-m-d', $date);
                return ($d && $d->format('Y-m-d') === $date) ? $date : null;
            };

            $data = [
                'user_id' => $userId,
                'title' => $input['title'],
                'slug' => $slug,
                'content' => $input['content'],
                'short_intro' => $input['short_intro'] ?? (mb_substr(strip_tags($input['content']), 0, 160) . '...'),
                'cover_image' => $coverImagePath,
                'location_id' => !empty($input['location_id']) ? (int)$input['location_id'] : null,
                'status' => $input['status'] ?? 'published',
                'start_date' => $validateDate($input['start_date'] ?? null),
                'end_date' => $validateDate($input['end_date'] ?? null),
                'duration_days' => !empty($input['duration_days']) ? (int)$input['duration_days'] : null,
                'budget' => !empty($input['budget']) ? (float)$input['budget'] : null,
                'currency' => $input['currency'] ?? 'VND',
                'meta_title' => $input['meta_title'] ?? $input['title'],
                'meta_description' => $input['meta_description'] ?? mb_substr(strip_tags($input['content']), 0, 160)
            ];
            
            // 6. Lưu Blog chính
            $blogId = $this->blogModel->create($data);
            if (!$blogId) {
                return $this->error('Không thể tạo blog, vui lòng thử lại', 500);
            }
            
            // 7. Xử lý Tags (Hashtags)
            $tags = [];
            if (!empty($input['tags'])) {
                if (is_string($input['tags'])) {
                    $decoded = json_decode($input['tags'], true);
                    $tags = is_array($decoded) ? $decoded : array_map('trim', explode(',', $input['tags']));
                } else if (is_array($input['tags'])) {
                    $tags = $input['tags'];
                }
            }
            
            if (!empty($tags)) {
                $this->tagModel->attachToPost($blogId, $tags);
            }
            
            // 8. Xử lý danh sách ảnh đính kèm (images)
            $imageUrls = [];
            if (isset($_FILES['images'])) {
                $files = $_FILES['images'];
                $uploadDir = __DIR__ . '/../../../public/uploads/posts/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

                // Cấu trúc $_FILES['images'] khi gửi images[0], images[1]...
                if (isset($files['name']) && is_array($files['name'])) {
                    for ($i = 0; $i < count($files['name']); $i++) {
                        if ($files['error'][$i] === UPLOAD_ERR_OK) {
                            $ext = strtolower(pathinfo($files['name'][$i], PATHINFO_EXTENSION));
                            $filename = 'post_' . $blogId . '_' . $i . '_' . time() . '.' . $ext;
                            if (move_uploaded_file($files['tmp_name'][$i], $uploadDir . $filename)) {
                                $imageUrls[] = '/uploads/posts/' . $filename;
                            }
                        }
                    }
                } else if (is_array($files)) {
                    // Trường hợp PHP nhận diện từng file images_0, images_1 (hiếm gặp với FormData chuẩn nhưng dự phòng)
                    foreach ($files as $file) {
                        if (isset($file['error']) && $file['error'] === UPLOAD_ERR_OK) {
                             $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                             $filename = 'post_' . $blogId . '_' . rand(100,999) . '_' . time() . '.' . $ext;
                             if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
                                 $imageUrls[] = '/uploads/posts/' . $filename;
                             }
                        }
                    }
                }
            }
            
            if (!empty($imageUrls)) {
                $this->mediaModel->attachToPost($blogId, $imageUrls);
            }
            
            // ✅ Xử lý Mention (@username) trong nội dung
            Notification::processMentions($input['content'], $userId, $blogId, 'post');
            
            // ✅ Cập nhật danh hiệu người dùng
            recalculateUserBadge($userId);
            
            return $this->success('Tạo bài viết thành công', [
                'id' => $blogId,
                'slug' => $slug,
                'cover_image' => $coverImagePath
            ], 201);
            
        } catch (Exception $e) {
            error_log("BlogController@create Error: " . $e->getMessage());
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * GET /api/blogs
     * Lấy danh sách blogs
     */
    public function index() {
        try {
        // Lấy user hiện tại (không bắt buộc đăng nhập)
        $currentUser = AuthMiddleware::verifyToken(false);
        $currentUserId = $currentUser ? $currentUser['user_id'] : null;
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        
        $filters = [
            'page' => $page,
            'limit' => $limit,
            'status' => $_GET['status'] ?? 'published',
            'user_id' => $_GET['user_id'] ?? null,
            'location_id' => $_GET['location_id'] ?? null,
            'search' => $_GET['search'] ?? null
        ];
        
        $blogs = $this->blogModel->getAll($filters, $currentUserId);
        
        // Decode JSON images array from postgres json_agg
        foreach ($blogs as &$blog) {
            if (isset($blog['images']) && is_string($blog['images'])) {
                $blog['images'] = json_decode($blog['images'], true);
            }
        }
        
        // ✅ FIX: Gọi đúng method countBlogs() của Blog model
        $total = $this->blogModel->countBlogs($filters);
        
        return $this->success('Danh sách blogs', [
            'blogs' => $blogs,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("BlogController@index Error: " . $e->getMessage());
        return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
    }
}
    
    /**
     * ✅ PUBLIC: Lấy danh sách blogs phổ biến (cho Sidebar)
     * GET /api/blogs/trending
     */
    public function trending() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 3;
            $blogs = $this->blogModel->getTrending($limit);
            return $this->success('Blogs phổ biến', $blogs);
        } catch (Exception $e) {
            error_log("BlogController@trending Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra', 500);
        }
    }

    /**
     * GET /api/blogs/{id}
     * Lấy chi tiết blog
     */
    public function show($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken(false);
            $currentUserId = $currentUser ? $currentUser['user_id'] : null;
            
            $blog = $this->blogModel->findById($id, $currentUserId);
            
            if (!$blog) {
                return $this->error('Blog không tồn tại', 404);
            }
            
            // Lấy ID thực tế từ database (phòng trường hợp $id truyền vào là slug)
            $blogId = $blog['id'];
            
            // Get tags
            $blog['tags'] = $this->tagModel->getForPost($blogId);
            
            // Get images
            $blog['images'] = $this->mediaModel->getForPost($blogId);
            
            // Increment view count
            $this->blogModel->incrementViewCount($blogId);
            
            return $this->success('Chi tiết blog', $blog);
            
        } catch (Exception $e) {
            error_log("BlogController@show Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * PUT /api/blogs/{id}
     * Cập nhật blog
     */
    public function update($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $blog = $this->blogModel->findById($id);
            
            if (!$blog) {
                return $this->error('Blog không tồn tại', 404);
            }
            
            // Kiểm tra quyền (chỉ chủ bài viết mới được sửa)
            if ((int)$blog['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền chỉnh sửa bài viết này', 403);
            }
            
            $input = array_merge($_POST, $this->getInput());
            $updateData = [];
            
            // Xử lý Upload Ảnh bìa mới
            if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../../../public/uploads/blogs/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                
                $ext = strtolower(pathinfo($_FILES['cover_image']['name'], PATHINFO_EXTENSION));
                $filename = 'blog_cover_' . $id . '_' . time() . '.' . $ext;
                
                if (move_uploaded_file($_FILES['cover_image']['tmp_name'], $uploadDir . $filename)) {
                    $updateData['cover_image'] = '/uploads/blogs/' . $filename;
                }
            }
            
            // Các trường có thể cập nhật
            $allowedFields = ['title', 'content', 'short_intro', 'location_id', 'status', 
                              'start_date', 'end_date', 'duration_days', 'budget', 'currency', 
                              'meta_title', 'meta_description'];
            
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $updateData[$field] = $input[$field];
                }
            }
            
            if (!empty($input['title'])) {
                $updateData['slug'] = $this->generateSlug($input['title']);
            }
            
            // Cập nhật Blog
            $this->blogModel->update($id, $updateData);
            
            // Cập nhật Tags
            if (isset($input['tags'])) {
                $tags = [];
                if (is_string($input['tags'])) {
                    $decoded = json_decode($input['tags'], true);
                    $tags = is_array($decoded) ? $decoded : array_map('trim', explode(',', $input['tags']));
                } else if (is_array($input['tags'])) {
                    $tags = $input['tags'];
                }
                $this->tagModel->updateForPost($id, $tags);
            }
            
            return $this->success('Cập nhật bài viết thành công');
            
        } catch (Exception $e) {
            error_log("BlogController@update Error: " . $e->getMessage());
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * DELETE /api/blogs/{id}
     * Xóa blog
     */
    public function destroy($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $blog = $this->blogModel->findById($id);
            
            if (!$blog) {
                return $this->error('Blog không tồn tại', 404);
            }
            
            // Kiểm tra quyền
            if ((int)$blog['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền xóa bài viết này', 403);
            }
            
            $this->blogModel->delete($id);
            
            // ✅ Cập nhật lại danh hiệu sau khi xóa bài
            recalculateUserBadge($blog['user_id']);
            
            return $this->success('Xóa bài viết thành công');
            
        } catch (Exception $e) {
            error_log("BlogController@destroy Error: " . $e->getMessage());
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * GET /api/users/{userId}/blogs
     * Lấy blogs của user
     */
    public function getUserBlogs($userId) {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            
            $blogs = $this->blogModel->getByUser($userId, $page, $limit);
            
            return $this->success('Danh sách blogs của user', [
                'blogs' => $blogs,
                'user_id' => $userId
            ]);
            
        } catch (Exception $e) {
            error_log("BlogController@getUserBlogs Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * POST /api/blogs/{id}/like
     * Like blog
     */
    public function like($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];
            
            $db = Database::getInstance()->getConnection();
            
            // Check if already liked
            $checkStmt = $db->prepare("SELECT id FROM likes WHERE post_id = :post_id AND user_id = :user_id");
            $checkStmt->bindValue(':post_id', $id, PDO::PARAM_INT);
            $checkStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                return $this->error('Bạn đã like bài viết này', 400);
            }
            
            // Insert like
            $insertStmt = $db->prepare("INSERT INTO likes (post_id, user_id, created_at) VALUES (:post_id, :user_id, NOW())");
            $insertStmt->bindValue(':post_id', $id, PDO::PARAM_INT);
            $insertStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $insertStmt->execute();
            
            // Update like count
            $db->prepare("UPDATE posts SET like_count = like_count + 1 WHERE id = :id")
              ->execute([':id' => $id]);
            
            // Lấy like_count mới
            $countStmt = $db->prepare("SELECT like_count FROM posts WHERE id = :id");
            $countStmt->execute([':id' => $id]);
            $newCount = $countStmt->fetchColumn();
            
            // ✅ Tạo thông báo cho chủ bài viết
            try {
                $blog = $this->blogModel->findById($id);
                if ($blog && (int)$blog['user_id'] !== (int)$userId) {
                    require_once __DIR__ . '/../../models/Notification.php';
                    $notification = new Notification();
                    $notification->create([
                        'user_id' => $blog['user_id'],
                        'actor_id' => $userId,
                        'type' => 'like',
                        'target_id' => $id,
                        'target_type' => 'post'
                    ]);
                }
            } catch (Exception $e) {
                error_log("Notification error (like): " . $e->getMessage());
            }
            
            return $this->success('Like thành công', ['like_count' => (int)$newCount]);
        } catch (Exception $e) {
            error_log("BlogController@like Error: " . $e->getMessage());
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * DELETE /api/blogs/{id}/like
     * Unlike blog
     */
    public function unlike($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];
            
            $db = Database::getInstance()->getConnection();
            
            // Delete like
            $deleteStmt = $db->prepare("DELETE FROM likes WHERE post_id = :post_id AND user_id = :user_id");
            $deleteStmt->bindValue(':post_id', $id, PDO::PARAM_INT);
            $deleteStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $deleteStmt->execute();
            
            // Update like count
            $db->prepare("UPDATE posts SET like_count = like_count - 1 WHERE id = :id AND like_count > 0")
              ->execute([':id' => $id]);
            
            // Trả về like_count mới
            $countStmt = $db->prepare("SELECT like_count FROM posts WHERE id = :id");
            $countStmt->execute([':id' => $id]);
            $newCount = $countStmt->fetchColumn();
            
            return $this->success('Bỏ like thành công', ['like_count' => (int)$newCount]);
            
        } catch (Exception $e) {
            error_log("BlogController@unlike Error: " . $e->getMessage());
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/blogs/{id}/share
     * Chia sẻ blog
     */
    public function share($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];
            $input = json_decode(file_get_contents('php://input'), true);
            $content = $input['content'] ?? '';

            $newBlogId = $this->blogModel->share($id, $userId, $content);
            
            if (!$newBlogId) {
                return $this->error('Bài viết không tồn tại hoặc lỗi server', 400);
            }

            // Lấy share_count mới
            $db = Database::getInstance()->getConnection();
            $countStmt = $db->prepare("SELECT share_count FROM posts WHERE id = :id");
            $countStmt->execute([':id' => $id]);
            $newCount = $countStmt->fetchColumn();

            // Gửi thông báo cho chủ bài viết
            try {
                $blog = $this->blogModel->findById($id);
                if ($blog && (int)$blog['user_id'] !== (int)$userId) {
                    require_once __DIR__ . '/../../models/Notification.php';
                    $notification = new Notification();
                    $notification->create([
                        'user_id' => $blog['user_id'],
                        'actor_id' => $userId,
                        'type' => 'share',
                        'target_id' => $id,
                        'target_type' => 'blog'
                    ]);
                }
            } catch (Exception $e) {
                error_log("Notification error (share): " . $e->getMessage());
            }
            
            return $this->success('Chia sẻ thành công', [
                'new_blog_id' => $newBlogId,
                'share_count' => (int)$newCount
            ]);
            
        } catch (Exception $e) {
            error_log("BlogController@share Error: " . $e->getMessage());
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Helper: Generate slug
     */
    private function generateSlug($string) {
        $slug = mb_strtolower($string, 'UTF-8');
        $slug = preg_replace('/[àáạảãâầấậẩẫăằắặẳẵ]/u', 'a', $slug);
        $slug = preg_replace('/[èéẹẻẽêềếệểễ]/u', 'e', $slug);
        $slug = preg_replace('/[ìíịỉĩ]/u', 'i', $slug);
        $slug = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/u', 'o', $slug);
        $slug = preg_replace('/[ùúụủũưừứựửữ]/u', 'u', $slug);
        $slug = preg_replace('/[ỳýỵỷỹ]/u', 'y', $slug);
        $slug = preg_replace('/đ/u', 'd', $slug);
        $slug = preg_replace('/[^a-z0-9\s\-]/', '', $slug);
        $slug = preg_replace('/\s+/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');
        
        return empty($slug) ? 'blog-' . time() : $slug . '-' . time();
    }
}
?>