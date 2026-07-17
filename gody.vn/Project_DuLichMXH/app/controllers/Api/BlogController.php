<?php
require_once __DIR__ . '/../BaseController.php';
require_once __DIR__ . '/../../models/Blog.php';
require_once __DIR__ . '/../../models/Tag.php';
require_once __DIR__ . '/../../models/PostMedia.php';
require_once __DIR__ . '/../../utils/Response.php';

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
            $input = $this->getInput();
            
            // Validate required fields
            if (empty($input['user_id']) || empty($input['title']) || empty($input['content'])) {
                return $this->error('Thiếu thông tin bắt buộc (user_id, title, content)', 400);
            }
            
            // Generate slug
            $slug = $this->generateSlug($input['title']);
            
            // Prepare data
            $data = [
                'user_id' => $input['user_id'],
                'title' => $input['title'],
                'slug' => $slug,
                'content' => $input['content'],
                'short_intro' => $input['short_intro'] ?? null,
                'cover_image' => $input['cover_image'] ?? null,
                'location_id' => $input['location_id'] ?? null,
                'status' => $input['status'] ?? 'published',
                'start_date' => $input['start_date'] ?? null,
                'end_date' => $input['end_date'] ?? null,
                'duration_days' => $input['duration_days'] ?? null,
                'budget' => $input['budget'] ?? null,
                'currency' => $input['currency'] ?? 'VND',
                'meta_title' => $input['meta_title'] ?? null,
                'meta_description' => $input['meta_description'] ?? null
            ];
            
            // Create blog
            $blogId = $this->blogModel->create($data);
            
            // Handle tags
            if (!empty($input['tags'])) {
                $this->tagModel->attachToPost($blogId, $input['tags']);
            }
            
            // Handle images
            if (!empty($input['images'])) {
                $this->mediaModel->attachToPost($blogId, $input['images']);
            }
            
            return $this->success('Tạo blog thành công', [
                'id' => $blogId,
                'slug' => $slug
            ], 201);
            
        } catch (Exception $e) {
            error_log("BlogController@create Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * GET /api/blogs
     * Lấy danh sách blogs
     */
    public function index() {
        try {
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
        
        $blogs = $this->blogModel->getAll($filters);
        
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
     * GET /api/blogs/{id}
     * Lấy chi tiết blog
     */
    public function show($id) {
        try {
            $blog = $this->blogModel->findById($id);
            
            if (!$blog) {
                return $this->error('Blog không tồn tại', 404);
            }
            
            // Get tags
            $blog['tags'] = $this->tagModel->getForPost($id);
            
            // Get images
            $blog['images'] = $this->mediaModel->getForPost($id);
            
            // Increment view count
            $this->blogModel->incrementViewCount($id);
            
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
            // Check if blog exists
            if (!$this->blogModel->exists($id)) {
                return $this->error('Blog không tồn tại', 404);
            }
            
            $input = $this->getInput();
            
            // Generate new slug if title changed
            if (!empty($input['title'])) {
                $input['slug'] = $this->generateSlug($input['title']);
            }
            
            // Update blog
            $this->blogModel->update($id, $input);
            
            // Update tags if provided
            if (isset($input['tags'])) {
                $this->tagModel->updateForPost($id, $input['tags']);
            }
            
            // Update images if provided
            if (isset($input['images'])) {
                $this->mediaModel->updateForPost($id, $input['images']);
            }
            
            return $this->success('Cập nhật blog thành công');
            
        } catch (Exception $e) {
            error_log("BlogController@update Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * DELETE /api/blogs/{id}
     * Xóa blog
     */
    public function destroy($id) {
        try {
            // Check if blog exists
            if (!$this->blogModel->exists($id)) {
                return $this->error('Blog không tồn tại', 404);
            }
            
            $this->blogModel->delete($id);
            
            return $this->success('Xóa blog thành công');
            
        } catch (Exception $e) {
            error_log("BlogController@destroy Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
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
            $input = $this->getInput();
            
            if (empty($input['user_id'])) {
                return $this->error('Thiếu user_id', 400);
            }
            
            // Check if already liked (cần tạo Like model hoặc query trực tiếp)
            $db = \Database::getInstance()->getConnection();
            $checkStmt = $db->prepare("SELECT id FROM likes WHERE post_id = :post_id AND user_id = :user_id");
            $checkStmt->bindValue(':post_id', $id, PDO::PARAM_INT);
            $checkStmt->bindValue(':user_id', $input['user_id'], PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                return $this->error('Bạn đã like bài viết này', 400);
            }
            
            // Insert like
            $insertStmt = $db->prepare("INSERT INTO likes (post_id, user_id, created_at) VALUES (:post_id, :user_id, NOW())");
            $insertStmt->bindValue(':post_id', $id, PDO::PARAM_INT);
            $insertStmt->bindValue(':user_id', $input['user_id'], PDO::PARAM_INT);
            $insertStmt->execute();
            
            // Update like count
            $db->prepare("UPDATE posts SET like_count = like_count + 1 WHERE id = :id")
              ->execute([':id' => $id]);
            
            return $this->success('Like thành công');
            
        } catch (Exception $e) {
            error_log("BlogController@like Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * DELETE /api/blogs/{id}/like
     * Unlike blog
     */
    public function unlike($id) {
        try {
            $input = $this->getInput();
            
            if (empty($input['user_id'])) {
                return $this->error('Thiếu user_id', 400);
            }
            
            $db = \Database::getInstance()->getConnection();
            
            // Delete like
            $deleteStmt = $db->prepare("DELETE FROM likes WHERE post_id = :post_id AND user_id = :user_id");
            $deleteStmt->bindValue(':post_id', $id, PDO::PARAM_INT);
            $deleteStmt->bindValue(':user_id', $input['user_id'], PDO::PARAM_INT);
            $deleteStmt->execute();
            
            // Update like count
            $db->prepare("UPDATE posts SET like_count = like_count - 1 WHERE id = :id AND like_count > 0")
              ->execute([':id' => $id]);
            
            return $this->success('Bỏ like thành công');
            
        } catch (Exception $e) {
            error_log("BlogController@unlike Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * Helper: Generate slug
     */
    private function generateSlug($string) {
        $slug = strtolower($string);
        $slug = preg_replace('/[àáạảãâầấậẩẫăằắặẳẵ]/i', 'a', $slug);
        $slug = preg_replace('/[èéẹẻẽêềếệểễ]/i', 'e', $slug);
        $slug = preg_replace('/[ìíịỉĩ]/i', 'i', $slug);
        $slug = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/i', 'o', $slug);
        $slug = preg_replace('/[ùúụủũưừứựửữ]/i', 'u', $slug);
        $slug = preg_replace('/[ỳýỵỷỹ]/i', 'y', $slug);
        $slug = preg_replace('/đ/i', 'd', $slug);
        $slug = preg_replace('/[^a-z0-9\s\-]/i', '', $slug);
        $slug = preg_replace('/\s+/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');
        
        return empty($slug) ? 'blog-' . time() : $slug . '-' . time();
    }
}
?>