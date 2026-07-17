<?php

namespace App\Controllers\Admin;

use App\Models\AdminSystemModel;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\AdminMiddleware;
use Exception;
use Throwable;

class AdminSystemController extends BaseAdminController {
    private $model;
    
    public function __construct() {
        parent::__construct(); // BaseAdminController đã lo việc check auth và kết nối DB
        $this->model = new AdminSystemModel();
    }

    public function locations() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = (int)($_GET['limit'] ?? 20);
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? 'active';
        $type = $_GET['type'] ?? '';
        
        return Response::success('Locations', $this->model->getLocations($page, $limit, $search, $status, $type)); 
    }

    public function createLocation() { 
        $data = json_decode(file_get_contents('php://input'), true); 
        if (empty($data['name']) || empty($data['slug'])) {
            return Response::error('Missing required fields: name, slug', 400);
        }
        $id = $this->model->createLocation($data);
        if ($id) {
            return Response::success('Location created', ['id' => $id], 201); 
        }
        return Response::error('Failed to create location', 500);
    }

    public function updateLocation($id) { 
        $data = json_decode(file_get_contents('php://input'), true); 
        unset($data['id']);
        if ($this->model->updateLocation((int)$id, $data)) {
            return Response::success('Updated');
        }
        return Response::error('Failed', 500); 
    }

    public function deleteLocation($id) { 
        if ($this->model->deleteLocation((int)$id)) {
            return Response::success('Deleted');
        }
        return Response::error('Failed', 500); 
    }

    public function groups() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $search = $_GET['search'] ?? '';
        return Response::success('Groups', $this->model->getGroups($page, $limit, $search)); 
    }

    public function getGroupStats() {
        return Response::success('Group Stats', $this->model->getGroupStats());
    }

    public function getGroupDetail($id) {
        $group = $this->model->getGroupDetail((int)$id);
        if (!$group) return Response::error('Group not found', 404);
        return Response::success('Group Detail', $group);
    }

    public function updateGroupStatus($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if ($this->model->updateGroupStatus((int)$id, $data['status'] ?? 'active')) {
            return Response::success('Status updated');
        }
        return Response::error('Failed to update status', 500);
    }

    public function approveGroup($id) {
        if ($this->model->updateGroupStatus((int)$id, 'active')) {
            return Response::success('Group approved');
        }
        return Response::error('Failed to approve group', 500);
    }

    public function deleteGroup($id) { 
        if ($this->model->deleteGroup((int)$id)) {
            return Response::success('Group deleted');
        }
        return Response::error('Failed', 500); 
    }

    public function getGroupPosts($id) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 10)));
        return Response::success('Group Posts', $this->model->getGroupPosts((int)$id, $page, $limit));
    }

    public function getGroupMembers($id) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $search = $_GET['search'] ?? '';
        return Response::success('Group Members', $this->model->getGroupMembers((int)$id, $page, $limit, $search));
    }

    public function getGroupAnalytics($id) {
        return Response::success('Group Analytics', $this->model->getGroupAnalytics((int)$id));
    }

    public function getGroupReports($id) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        return Response::success('Group Reports', $this->model->getGroupReports((int)$id, $page, $limit));
    }

    public function processGroupReport($groupId, $reportId) {
        return $this->processReport($reportId);
    }

    public function reports() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $status = $_GET['status'] ?? 'pending';
        return Response::success('Reports', $this->model->getReports($page, $limit, $status)); 
    }

    public function processReport($id) { 
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? 'resolve';
        $note = $data['note'] ?? '';
        
        if ($this->model->processReport((int)$id, $action, $note)) {
            return Response::success('Processed');
        }
        return Response::error('Failed', 500);
    }

    public function broadcast() { 
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['title']) || empty($data['content'])) {
            return Response::error('Missing title/content', 400);
        }
        if ($this->model->broadcast($data['title'], $data['content'])) {
            return Response::success('Broadcast sent');
        }
        return Response::error('Failed', 500);
    }

    public function hashtags() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $type = $_GET['type'] ?? null;
        $categoryId = $_GET['category_id'] ?? null;
        return Response::success('Hashtags', $this->model->getHashtags($page, $limit, $type, $categoryId)); 
    }

    public function createHashtag() { 
        $data = json_decode(file_get_contents('php://input'), true); 
        if (empty($data['name'])) {
            return Response::error('Missing name', 400);
        }
        $id = $this->model->createHashtag($data['name'], $data['type'] ?? 'hashtag', $data['category_id'] ?? null);
        if ($id) {
            return Response::success('Created', ['id' => $id], 201); 
        }
        return Response::error('Failed', 500);
    }

    public function updateHashtag($id) { 
        $data = json_decode(file_get_contents('php://input'), true); 
        if (empty($data['name'])) {
            return Response::error('Missing name', 400);
        }
        if ($this->model->updateHashtag((int)$id, $data['name'], $data['type'] ?? 'hashtag', $data['category_id'] ?? null)) {
            return Response::success('Updated');
        }
        return Response::error('Failed', 500); 
    }

    public function deleteHashtag($id) { 
        if ($this->model->deleteHashtag((int)$id)) {
            return Response::success('Deleted');
        }
        return Response::error('Failed', 500); 
    }

    // === TAG CATEGORIES ===
    public function tagCategories() {
        return Response::success('Tag Categories', $this->model->getTagCategories());
    }

    public function createTagCategory() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['name'])) {
            return Response::error('Missing name', 400);
        }
        $id = $this->model->createTagCategory($data);
        if ($id) {
            return Response::success('Category created', ['id' => $id], 201);
        }
        return Response::error('Failed to create category', 500);
    }

    public function updateTagCategory($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if ($this->model->updateTagCategory((int)$id, $data)) {
            return Response::success('Category updated');
        }
        return Response::error('Failed to update category', 500);
    }

    public function deleteTagCategory($id) {
        if ($this->model->deleteTagCategory((int)$id)) {
            return Response::success('Category deleted');
        }
        return Response::error('Failed to delete category', 500);
    }

    public function stats() { 
        try {
            return Response::success('Dashboard Stats', $this->model->getStats()); 
        } catch (Throwable $e) {
            error_log("AdminSystemController@stats Error: " . $e->getMessage());
            return Response::error('Lỗi khi lấy thống kê', 500, ['debug_error' => $e->getMessage()]);
        }
    }

    public function recommendation() { 
        return Response::success('Recommendation System', $this->model->getRecommendationStats()); 
    }

    public function backup() { 
        return Response::success('System Backup', $this->model->backupSystem()); 
    }

    // === RBAC METHODS ===
    public function getRoles() {
        AdminMiddleware::check('system.rbac');
        try {
            return Response::success('Roles', $this->model->getRoles());
        } catch (Throwable $e) {
            error_log("AdminSystemController@getRoles Error: " . $e->getMessage());
            return Response::error('Lỗi khi lấy danh sách Roles', 500, ['debug_error' => $e->getMessage()]);
        }
    }

    public function getRole($id) {
        $role = $this->model->getRole((int)$id);
        if (!$role) return Response::error('Role not found', 404);
        return Response::success('Role', $role);
    }

    public function createRole() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['name']) || empty($data['slug'])) {
            return Response::error('Missing name/slug', 400);
        }
        $id = $this->model->createRole($data);
        if ($id) return Response::success('Created', ['id' => $id], 201);
        return Response::error('Failed to create role', 500);
    }

    public function updateRole($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if ($this->model->updateRole((int)$id, $data)) {
            return Response::success('Updated');
        }
        return Response::error('Failed to update role', 500);
    }

    public function deleteRole($id) {
        if ($this->model->deleteRole((int)$id)) {
            return Response::success('Deleted');
        }
        return Response::error('Failed to delete role (system roles cannot be deleted)', 400);
    }

    public function getPermissions() {
        return Response::success('Permissions', $this->model->getPermissions());
    }

    public function updateRolePermissions($roleId) {
        $data = json_decode(file_get_contents('php://input'), true);
        $permissions = $data['permissions'] ?? [];
        if ($this->model->updateRolePermissions((int)$roleId, $permissions)) {
            return Response::success('Permissions updated');
        }
        return Response::error('Failed to update permissions', 500);
    }

    // === AUDIT LOG METHODS ===
    public function getAuditLogs() {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $search = $_GET['search'] ?? '';
        $type = $_GET['type'] ?? 'All';
        return Response::success('Audit Logs', $this->model->getAuditLogs($page, $limit, $search, $type));
    }

    public function getAuditLogStats() {
        return Response::success('Audit Log Stats', $this->model->getAuditLogStats());
    }
}
