<?php

namespace App\Controllers\Admin;

use App\Models\AdminContentModel;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;
use Throwable;

class AdminContentController extends BaseAdminController {
    private $model;
    
    public function __construct() {
        parent::__construct();
        $this->model = new AdminContentModel();
    }

    public function posts() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        return Response::success('Posts', $this->model->getPosts($page, $limit)); 
    }

    public function deletePost($id) { 
        if ($this->model->deletePost((int)$id)) {
            return Response::success('Post hidden');
        }
        return Response::error('Failed', 500); 
    }

    public function blogs() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        return Response::success('Blogs', $this->model->getBlogs($page, $limit)); 
    }

    public function deleteBlog($id) { 
        if ($this->model->deleteBlog((int)$id)) {
            return Response::success('Blog hidden');
        }
        return Response::error('Failed', 500); 
    }

    public function comments() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        return Response::success('Comments', $this->model->getComments($page, $limit)); 
    }

    public function deleteComment($id) { 
        if ($this->model->deleteComment((int)$id)) {
            return Response::success('Comment hidden');
        }
        return Response::error('Failed', 500); 
    }

    public function getPost($id) {
        $post = $this->model->getPost((int)$id);
        if (!$post) return Response::error('Post not found', 404);
        return Response::success('Post Detail', $post);
    }

    public function getPostComments($id) {
        return Response::success('Post Comments', $this->model->getPostComments((int)$id));
    }

    public function getBlog($id) {
        $blog = $this->model->getBlog((int)$id);
        if (!$blog) return Response::error('Blog not found', 404);
        return Response::success('Blog Detail', $blog);
    }

    public function getBlogComments($id) {
        return Response::success('Blog Comments', $this->model->getBlogComments((int)$id));
    }

    /**
     * Lấy danh sách stories cho admin (GET /api/admin/stories)
     */
    public function stories() {
        try {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
            $search = trim($_GET['search'] ?? '');
            $status = $_GET['status'] ?? 'All';

            $result = $this->model->getStories($page, $limit, $search, $status);
            return Response::success('Danh sách stories', $result);
        } catch (Throwable $e) {
            error_log("AdminContentController@stories Error: " . $e->getMessage());
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Ẩn một story (PUT /api/admin/stories/{id}/hide)
     */
    public function hideStory($id) {
        try {
            if ($this->model->hideStory((int)$id)) {
                return Response::success('Story đã được ẩn thành công');
            }
            return Response::error('Không tìm thấy story hoặc ẩn thất bại', 404);
        } catch (Throwable $e) {
            error_log("AdminContentController@hideStory Error: " . $e->getMessage());
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Xóa một story (đánh dấu is_deleted = TRUE)
     * (DELETE /api/admin/stories/{id})
     */
    public function deleteStory($id) {
        try {
            if ($this->model->deleteStory((int)$id)) {
                return Response::success('Story đã được xóa thành công');
            }
            return Response::error('Không tìm thấy story hoặc xóa thất bại', 404);
        } catch (Throwable $e) {
            error_log("AdminContentController@deleteStory Error: " . $e->getMessage());
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
}
