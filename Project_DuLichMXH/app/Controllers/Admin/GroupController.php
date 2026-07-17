<?php

namespace App\Controllers\Admin;

use App\Models\AdminSystemModel;
use App\Utils\Response;

/**
 * GroupController (Admin)
 * Quản lý các hoạt động liên quan đến nhóm trong Admin
 */
class GroupController extends BaseAdminController {
    private $model;
    
    public function __construct() {
        parent::__construct();
        $this->model = new AdminSystemModel();
    }

    /**
     * Lấy danh sách nhóm
     * GET /api/admin/groups
     */
    public function index() {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $search = $_GET['search'] ?? '';
        
        $groups = $this->model->getGroups($page, $limit, $search);
        return Response::success('Lấy danh sách nhóm thành công', $groups);
    }

    /**
     * Lấy chi tiết một nhóm
     * GET /api/admin/groups/{id}
     */
    public function show($groupId) {
        $group = $this->model->getGroupDetail((int)$groupId);
        if (!$group) {
            return Response::error('Không tìm thấy nhóm', 404);
        }
        
        return Response::success('Lấy chi tiết nhóm thành công', $group);
    }

    /**
     * Lấy danh sách bài viết trong một nhóm
     * GET /api/admin/groups/{id}/posts
     */
    public function getPosts($groupId) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));
        
        $posts = $this->model->getGroupPosts((int)$groupId, $page, $limit);
        
        return Response::success('Lấy danh sách bài viết thành công', $posts);
    }
}
