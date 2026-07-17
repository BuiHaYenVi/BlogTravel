<?php
// ✅ Đường dẫn chuẩn tuyệt đối
require_once __DIR__ . '/BaseAdminController.php';
require_once __DIR__ . '/../../models/AdminUserModel.php';  // Lùi 2 cấp về app/models/
require_once __DIR__ . '/../../utils/Response.php';          // Lùi 2 cấp về app/utils/

class AdminUserController extends BaseAdminController {
    private $model;
    
    public function __construct() {
        parent::__construct();
        $this->model = new AdminUserModel();
    }

    public function index() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        return Response::success('Danh sách người dùng', $this->model->getAllPaginated($page, $limit)); 
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

    public function ban($id) { 
        if ($this->model->updateStatus((int)$id, 'banned')) {
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
        if ($this->model->softDelete((int)$id)) {
            return Response::success('Đã xóa tài khoản khỏi hệ thống');
        }
        return Response::error('Xóa tài khoản thất bại', 500); 
    }
}