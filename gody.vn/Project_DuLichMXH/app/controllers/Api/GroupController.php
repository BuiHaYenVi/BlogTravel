<?php
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../models/Group.php';

class GroupController {
    private $groupModel;
    
    public function __construct() {
        $this->groupModel = new Group();
    }

    public function create() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['name'])) {
                Response::error('Tên nhóm không được để trống', 400);
            }
            
            $groupData = [
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'category' => $data['category'] ?? 'General',
                'cover_image' => $data['cover_image'] ?? null,
                'creator_id' => $currentUser['user_id'],
                'is_private' => $data['is_private'] ?? false
            ];
            
            $result = $this->groupModel->create($groupData);
            
            if (!$result['id']) {
                Response::error('Lỗi tạo nhóm: ' . ($result['error'] ?? 'Không xác định'), 500);
            }
            
            Response::success('Tạo nhóm thành công', ['id' => $result['id']]);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function index() {
        try {
            $userId = null;
            try {
                $user = AuthMiddleware::verifyToken();
                $userId = $user['user_id'] ?? null;
            } catch (Exception $e) {}
            Response::success('Danh sách nhóm', $this->groupModel->getAll($userId));
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function show($id) {
        try {
            $userId = null;
            try {
                $user = AuthMiddleware::verifyToken();
                $userId = $user['user_id'] ?? null;
            } catch (Exception $e) {}
            $group = $this->groupModel->findById($id, $userId);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);
            Response::success('Chi tiết nhóm', $group);
        } catch (Exception $e) {
            Response::error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function update($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $group = $this->groupModel->findById($id);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);
            if ($group['creator_id'] != $currentUser['user_id']) Response::error('Không có quyền', 403);
            
            $data = json_decode(file_get_contents('php://input'), true);
            $allowed = ['name', 'description', 'category', 'cover_image', 'is_private'];
            $updateData = [];
            foreach ($allowed as $f) if (isset($data[$f])) $updateData[$f] = $data[$f];
            
            if (empty($updateData)) Response::error('Không có dữ liệu', 400);
            if ($this->groupModel->update($id, $updateData)) Response::success('Thành công');
            else Response::error('Lỗi cập nhật', 500);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function destroy($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $group = $this->groupModel->findById($id);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);
            if ($group['creator_id'] != $currentUser['user_id']) Response::error('Không có quyền', 403);
            if ($this->groupModel->delete($id)) Response::success('Thành công');
            else Response::error('Lỗi xóa', 500);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function join($id) {
        try {
            $u = AuthMiddleware::verifyToken();
            if ($this->groupModel->addMember($id, $u['user_id'])) Response::success('Thành công');
            else Response::error('Thất bại', 500);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function leave($id) {
        try {
            $u = AuthMiddleware::verifyToken();
            $g = $this->groupModel->findById($id);
            if ($g && $g['creator_id'] == $u['user_id']) Response::error('Chủ nhóm không thể rời', 400);
            if ($this->groupModel->removeMember($id, $u['user_id'])) Response::success('Thành công');
            else Response::error('Thất bại', 500);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function members($id) {
        try {
            Response::success('Thành viên', $this->groupModel->getMembers($id));
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
?>