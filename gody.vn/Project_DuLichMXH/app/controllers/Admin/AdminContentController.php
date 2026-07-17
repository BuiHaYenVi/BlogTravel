<?php
// ✅ SỬA PATH: Từ Admin/ lùi 2 cấp (../../) để về app/
require_once __DIR__ . '/BaseAdminController.php';
require_once __DIR__ . '/../../models/AdminContentModel.php';
require_once __DIR__ . '/../../utils/Response.php';

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
}