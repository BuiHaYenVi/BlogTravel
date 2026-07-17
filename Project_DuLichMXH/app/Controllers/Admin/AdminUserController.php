<?php

namespace App\Controllers\Admin;

use App\Models\AdminUserModel;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;
use Throwable;

class AdminUserController extends BaseAdminController {
    private $model;
    
    public function __construct() {
        parent::__construct();
        $this->model = new AdminUserModel();
    }

    public function index() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? 'All';
        $role = $_GET['role'] ?? 'All';
        return Response::success('Danh sách người dùng', $this->model->getAllPaginated($page, $limit, $search, $status, $role)); 
    }

    public function show($id) { 
        $user = $this->model->findByIdWithDetails((int)$id);
        if (!$user) {
            return Response::error('Người dùng không tồn tại', 404);
        }
        return Response::success('Chi tiết người dùng', $user); 
    }

    public function search() { 
        $q = trim($_GET['q'] ?? '');
        if (strlen($q) < 2) {
            return Response::error('Từ khóa tìm kiếm quá ngắn (≥2 ký tự)', 400);
        }
        return Response::success('Kết quả tìm kiếm', $this->model->searchByNameOrEmail($q)); 
    }

    public function updateUser($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data)) {
                return Response::error('Dữ liệu không hợp lệ', 400);
            }
            
            // Check if user exists first to return 404 instead of 500 if not found
            $user = $this->model->findByIdWithDetails((int)$id);
            if (!$user) {
                return Response::error('Người dùng không tồn tại', 404);
            }

            // Prevent self-lock
            if (isset($data['status']) && $data['status'] === 'banned') {
                $currentUser = AuthMiddleware::verifyToken();
                $currentUserId = $currentUser['user_id'] ?? $currentUser['id'] ?? null;
                if ($currentUserId && (int)$currentUserId === (int)$id) {
                    return Response::error('Bạn không thể tự khóa tài khoản của chính mình', 400);
                }
            }

            if ($this->model->updateUser((int)$id, $data)) {
                return Response::success('Cập nhật người dùng thành công');
            }
            return Response::error('Cập nhật thất bại', 500);
        } catch (Throwable $e) {
            error_log("AdminUserController@updateUser Error: " . $e->getMessage());
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    public function ban($id) { 
        $currentUser = AuthMiddleware::verifyToken();
        $currentUserId = $currentUser['user_id'] ?? $currentUser['id'] ?? null;
        if ($currentUserId && (int)$currentUserId === (int)$id) {
            return Response::error('Bạn không thể tự khóa tài khoản của chính mình', 400);
        }

        if ($this->model->updateStatus((int)$id, 'banned')) {
            sync_ban_to_chat((int)$id, 'ban');
            return Response::success('Đã khóa tài khoản');
        }
        return Response::error('Khóa tài khoản thất bại', 500); 
    }

    public function unban($id) { 
        if ($this->model->updateStatus((int)$id, 'active')) {
            return Response::success('Đã mở khóa tài khoản');
        }
        return Response::error('Mở khóa tài khoản thất bại', 500); 
    }

    public function destroy($id) { 
        $currentUser = AuthMiddleware::verifyToken();
        $currentUserId = $currentUser['user_id'] ?? $currentUser['id'] ?? null;
        if ($currentUserId && (int)$currentUserId === (int)$id) {
            return Response::error('Bạn không thể tự xóa tài khoản của chính mình', 400);
        }

        if ($this->model->softDelete((int)$id)) {
            return Response::success('Đã xóa tài khoản khỏi hệ thống');
        }
        return Response::error('Xóa tài khoản thất bại', 500); 
    }

    public function getContent($id) {
        $limit = (int)($_GET['limit'] ?? 10);
        return Response::success('User Content', $this->model->getContent((int)$id, $limit));
    }

    public function getReports($id) {
        return Response::success('User Reports', $this->model->getReports((int)$id));
    }

    /**
     * Toggle VIP/verified status for a user (Blue Tick)
     * PUT /api/admin/users/{id}/verify
     */
    public function verify($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['is_verified'])) {
                return Response::error('Thiếu trường is_verified', 400);
            }

            $user = $this->model->findByIdWithDetails((int)$id);
            if (!$user) {
                return Response::error('Người dùng không tồn tại', 404);
            }

            $isVerified = (bool)$data['is_verified'];

            if ($this->model->updateVerification((int)$id, $isVerified)) {
                $msg = $isVerified ? 'Đã cấp tích xanh VIP thành công' : 'Đã thu hồi tích xanh VIP';
                return Response::success($msg, ['is_verified' => $isVerified]);
            }
            return Response::error('Cập nhật thất bại', 500);
        } catch (Throwable $e) {
            error_log("AdminUserController@verify Error: " . $e->getMessage());
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
}
