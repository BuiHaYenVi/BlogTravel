<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Group;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\Comment;
use App\Models\Notification;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use App\Config\Database;
use Exception;

class GroupController extends BaseController {
    private $groupModel;
    
    public function __construct() {
        $this->groupModel = new Group();
    }

    public function create() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['name'])) Response::error('Tên nhóm không được để trống', 400);
            
            $groupData = [
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'category' => $data['category'] ?? 'General',
                'cover_image' => $data['cover_image'] ?? null,
                'owner_id' => $currentUser['user_id'],
                'is_private' => $data['is_private'] ?? false
            ];
            
            $result = $this->groupModel->create($groupData);
            if (!$result['id']) Response::error('Lỗi tạo nhóm: ' . ($result['error'] ?? 'Không xác định'), 500);
            Response::success('Tạo nhóm thành công', ['id' => $result['id']]);
        } catch (Exception $e) { Response::error('Lỗi server: ' . $e->getMessage(), 500); }
    }

    public function update($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $group = $this->groupModel->findById($id);
            
            if (!$group) Response::error('Không tìm thấy nhóm', 404);
            
            // Kiểm tra quyền: Chủ nhóm hoặc Admin (role_id = 2 là admin giả định)
            $ownerId = $group['owner_id'] ?? $group['creator_id'] ?? null;
            $isAdmin = (isset($currentUser['role_id']) && (int)$currentUser['role_id'] === 2);
            
            if ((string)$ownerId !== (string)$currentUser['user_id'] && !$isAdmin) {
                Response::error('Bạn không có quyền chỉnh sửa nhóm này. Owner: ' . $ownerId . ', Current: ' . $currentUser['user_id'], 403);
            }
            
            $updateData = [];

            // 1. Kiểm tra FILE (Ảnh bìa)
            if (isset($_FILES['cover_image'])) {
                if ($_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
                    $file = $_FILES['cover_image'];
                    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
                    
                    if (!in_array($ext, $allowed)) {
                        Response::error('Định dạng file không hỗ trợ: ' . $ext, 400);
                    }

                    $filename = 'group_' . $id . '_' . time() . '.' . $ext;
                    $uploadDir = __DIR__ . '/../../../public/uploads/groups/';
                    
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    
                    if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
                        $updateData['cover_image'] = '/uploads/groups/' . $filename;
                    } else {
                        Response::error('Lỗi khi di chuyển file vào thư mục upload. Hãy kiểm tra quyền ghi thư mục.', 500);
                    }
                } else {
                    $errorMsg = 'Lỗi upload file: code ' . $_FILES['cover_image']['error'];
                    Response::error($errorMsg, 400);
                }
            }

            // 2. Kiểm tra các trường POST khác
            $fields = ['name', 'description', 'category', 'is_private'];
            foreach ($fields as $f) {
                if (isset($_POST[$f])) {
                    $val = $_POST[$f];
                    if ($f === 'is_private') $val = ($val === 'true' || $val === '1');
                    $updateData[$f] = $val;
                }
            }

            // 3. Fallback cho JSON nếu vẫn trống
            if (empty($updateData)) {
                $jsonData = json_decode(file_get_contents('php://input'), true);
                if ($jsonData) {
                    foreach ($fields as $f) {
                        if (isset($jsonData[$f])) $updateData[$f] = $jsonData[$f];
                    }
                    if (isset($jsonData['cover_image'])) $updateData['cover_image'] = $jsonData['cover_image'];
                }
            }
            
            if (empty($updateData)) {
                Response::error('Không tìm thấy dữ liệu để cập nhật (Ảnh hoặc Thông tin)', 400);
            }
            
            if ($this->groupModel->update($id, $updateData)) {
                $groupUpdated = $this->groupModel->findById($id);
                Response::success('Cập nhật thành công', $groupUpdated);
            } else {
                Response::error('Lỗi truy vấn Database khi cập nhật nhóm', 500);
            }
        } catch (Exception $e) { 
            Response::error('Lỗi ngoại lệ: ' . $e->getMessage(), 500); 
        }
    }

    public function index() {
        try {
            $userId = null;
            try { 
                $user = AuthMiddleware::verifyToken(false); 
                $userId = $user['user_id'] ?? null; 
            } catch (Exception $e) {}

            $filters = [
                'search' => $_GET['search'] ?? null,
                'category' => $_GET['category'] ?? null
            ];

            Response::success('Danh sách nhóm', $this->groupModel->getAll($userId, $filters));
        } catch (Exception $e) { Response::error('Lỗi server: ' . $e->getMessage(), 500); }
    }

    public function show($id) {
        try {
            $userId = null;
            try { 
                $user = AuthMiddleware::verifyToken(false); 
                $userId = $user['user_id'] ?? null; 
            } catch (Exception $e) {}
            
            $group = $this->groupModel->findById($id, $userId);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);
            Response::success('Chi tiết nhóm', $group);
        } catch (Exception $e) { Response::error('Lỗi server: ' . $e->getMessage(), 500); }
    }

    public function destroy($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $group = $this->groupModel->findById($id);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);
            if ((string)$group['owner_id'] !== (string)$currentUser['user_id']) Response::error('Không có quyền', 403);
            if ($this->groupModel->delete($id)) Response::success('Giải tán nhóm thành công');
            else Response::error('Lỗi khi giải tán nhóm', 500);
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function join($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $group = $this->groupModel->findById($id);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);

            // Nếu nhóm riêng tư thì set status = pending, công khai thì accepted
            $status = $group['is_private'] ? 'pending' : 'accepted';
            
            if ($this->groupModel->addMember($id, $currentUser['user_id'], 'member', $status)) {
                // ✅ Nếu nhóm riêng tư, gửi thông báo cho chủ nhóm
                if ($status === 'pending') {
                    try {
                        $notification = new Notification();
                        $ownerId = $group['owner_id'] ?? $group['creator_id'] ?? null;
                        if ($ownerId) {
                            $notification->create([
                                'user_id' => $ownerId,
                                'actor_id' => $currentUser['user_id'],
                                'type' => 'group_join_request',
                                'target_id' => $id,
                                'target_type' => 'group'
                            ]);
                        }
                    } catch (Exception $e) {
                        error_log("Notification error (group_join_request): " . $e->getMessage());
                    }
                }
                Response::success($status === 'pending' ? 'Đã gửi yêu cầu tham gia' : 'Tham gia thành công');
            } else {
                Response::error('Tham gia thất bại', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function inviteMember($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $group = $this->groupModel->findById($id);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);

            $members = $this->groupModel->getMembers($id);
            $isMember = false;
            foreach ($members as $m) {
                if ((string)$m['id'] === (string)$currentUser['user_id']) {
                    $isMember = true;
                    break;
                }
            }
            if (!$isMember) Response::error('Bạn phải là thành viên nhóm mới có thể mời người khác', 403);

            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['user_id'] ?? null;

            if (!$userId) Response::error('Thiếu user_id', 400);

            foreach ($members as $m) {
                if ((string)$m['id'] === (string)$userId) {
                    Response::error('Người này đã là thành viên của nhóm', 400);
                }
            }

            // Thêm vào nhóm với trạng thái 'invited' và lưu ID người mời
            if ($this->groupModel->addMember($id, $userId, 'member', 'invited', $currentUser['user_id'])) {
                // ✅ Tạo thông báo mời vào nhóm
                try {
                    $notification = new Notification();
                    $notification->create([
                        'user_id' => $userId,
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'group_invite',
                        'target_id' => $id,
                        'target_type' => 'group'
                    ]);
                } catch (Exception $e) {
                    error_log("Notification error (group_invite): " . $e->getMessage());
                }
                Response::success('Đã gửi lời mời tham gia nhóm');
            } else {
                Response::error('Lỗi khi mời thành viên', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function getMyInvitations() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $invites = $this->groupModel->getInvitations($currentUser['user_id']);
            Response::success('Danh sách lời mời', $invites);
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function acceptInvite($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $exists = $this->groupModel->checkInvitation($id, $currentUser['user_id']);
            
            if (!$exists) Response::error('Không tìm thấy lời mời hợp lệ', 404);

            if ($this->groupModel->updateMemberStatus($id, $currentUser['user_id'], 'accepted')) {
                Response::success('Đã chấp nhận lời mời, chào mừng bạn đến với nhóm!');
            } else {
                Response::error('Thất bại khi chấp nhận lời mời', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function rejectInvite($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            if ($this->groupModel->removeMember($id, $currentUser['user_id'])) {
                Response::success('Đã từ chối lời mời');
            } else {
                Response::error('Thất bại khi từ chối lời mời', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function getJoinRequests($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $myRole = $this->groupModel->getUserRole($id, $currentUser['user_id']);
            if (!$myRole || !in_array($myRole, ['owner', 'admin', 'moderator'])) {
                Response::error('Không có quyền', 403);
            }
            Response::success('Danh sách yêu cầu', $this->groupModel->getJoinRequests($id));
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function approveRequest($groupId, $userId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $myRole = $this->groupModel->getUserRole($groupId, $currentUser['user_id']);
            if (!$myRole || !in_array($myRole, ['owner', 'admin', 'moderator'])) {
                Response::error('Không có quyền', 403);
            }

            if ($this->groupModel->updateMemberStatus($groupId, $userId, 'accepted')) {
                // ✅ Thông báo cho người được duyệt
                try {
                    $notification = new Notification();
                    $notification->create([
                        'user_id' => $userId,
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'group_request_approved',
                        'target_id' => $groupId,
                        'target_type' => 'group'
                    ]);
                } catch (Exception $e) {
                    error_log("Notification error (group_request_approved): " . $e->getMessage());
                }
                Response::success('Đã chấp nhận yêu cầu');
            } else {
                Response::error('Thất bại', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function rejectRequest($groupId, $userId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $myRole = $this->groupModel->getUserRole($groupId, $currentUser['user_id']);
            if (!$myRole || !in_array($myRole, ['owner', 'admin', 'moderator'])) {
                Response::error('Không có quyền', 403);
            }

            if ($this->groupModel->removeMember($groupId, $userId)) {
                // ✅ Thông báo cho người bị từ chối
                try {
                    $notification = new Notification();
                    $notification->create([
                        'user_id' => $userId,
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'group_request_rejected',
                        'target_id' => $groupId,
                        'target_type' => 'group'
                    ]);
                } catch (Exception $e) {
                    error_log("Notification error (group_request_rejected): " . $e->getMessage());
                }
                Response::success('Đã từ chối yêu cầu');
            } else {
                Response::error('Thất bại', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function leave($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $group = $this->groupModel->findById($id);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);
            
            $ownerId = $group['owner_id'] ?? $group['creator_id'] ?? null;
            if ((string)$ownerId === (string)$currentUser['user_id']) {
                Response::error('Chủ nhóm không thể rời nhóm.', 400);
            }

            if ($this->groupModel->removeMember($id, $currentUser['user_id'])) {
                Response::success('Rời nhóm thành công');
            } else {
                Response::error('Rời nhóm thất bại', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function getPosts($id) {
        try {
            $postModel = new Post();
            $user = AuthMiddleware::verifyToken(false);
            $currentUserId = $user['user_id'] ?? null;
            
            $group = $this->groupModel->findById($id);
            if (!$group) Response::error('Không tìm thấy nhóm', 404);
            if ($group['is_private']) {
                $myRole = $currentUserId ? $this->groupModel->getUserRole($id, $currentUserId) : null;
                if (!$myRole) {
                    Response::error('Nhóm này là riêng tư. Bạn cần tham gia nhóm để xem bài viết.', 403);
                }
            }

            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            Response::success('Danh sách bài viết', $postModel->getPostsList($limit, $id, $currentUserId));
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    private function resolveId($idOrSlug) {
        if (is_numeric($idOrSlug)) return (int)$idOrSlug;
        $res = $this->groupModel->query("SELECT id FROM groups WHERE slug = :slug", ['slug' => $idOrSlug]);
        return $res[0]['id'] ?? 0;
    }

    public function createPost($idOrSlug) {
        try {
            $id = $this->resolveId($idOrSlug);
            $currentUser = AuthMiddleware::verifyToken();
            
            $myRole = $this->groupModel->getUserRole($id, $currentUser['user_id']);
            if (!$myRole) {
                Response::error('Chỉ thành viên nhóm mới được đăng bài viết', 403);
            }
            
            $postModel = new Post();
            $mediaModel = new PostMedia();

            $content = $_POST['content'] ?? '';
            $locationId = $_POST['location_id'] ?? null;
            $title = $_POST['title'] ?? (mb_substr($content, 0, 50) . '...');

            if (empty($content)) Response::error('Nội dung không được để trống', 400);

            $postId = $postModel->create($currentUser['user_id'], [
                'group_id' => $id,
                'title' => $title,
                'content' => $content,
                'location_id' => $locationId,
                'post_type' => 'group_post'
            ]);

            if (!$postId) Response::error('Lỗi khi tạo bài viết', 500);

            $imageUrls = [];
            if (isset($_FILES['images'])) {
                $files = $_FILES['images'];
                $uploadDir = __DIR__ . '/../../../public/uploads/posts/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

                if (is_array($files['name'])) {
                    for ($i = 0; $i < count($files['name']); $i++) {
                        if ($files['error'][$i] === UPLOAD_ERR_OK) {
                            $ext = strtolower(pathinfo($files['name'][$i], PATHINFO_EXTENSION));
                            $filename = 'post_' . $postId . '_' . $i . '_' . time() . '.' . $ext;
                            if (move_uploaded_file($files['tmp_name'][$i], $uploadDir . $filename)) {
                                $imageUrls[] = '/uploads/posts/' . $filename;
                            }
                        }
                    }
                }
            }

            if (!empty($imageUrls)) $mediaModel->attachToPost($postId, $imageUrls);

            $notification = new Notification();
            $group = $this->groupModel->findById($id);
            $ownerId = $group['owner_id'] ?? $group['creator_id'] ?? null;

            $post = $postModel->getPostDetailRaw($postId);
            $message = 'Đăng bài thành công';
            if ($post['status'] === 'pending') {
                $message = 'Đăng bài thành công, vui lòng chờ quản trị viên duyệt.';
                if ($ownerId && (string)$ownerId !== (string)$currentUser['user_id']) {
                    $notification->create([
                        'user_id' => $ownerId,
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'group_post_pending',
                        'target_id' => $id,
                        'target_type' => 'group',
                        'custom_message' => "<b>{$currentUser['full_name']}</b> đã đăng bài viết mới trong nhóm, đang chờ bạn duyệt."
                    ]);
                }
            }

            Response::success($message, $post);
        } catch (Exception $e) { Response::error('Lỗi server: ' . $e->getMessage(), 500); }
    }

    public function getPostComments($groupId, $postId) {
        try {
            $commentModel = new Comment();
            
            // Lấy user hiện tại để xác định is_liked (không bắt buộc)
            $userId = null;
            try {
                $user = AuthMiddleware::verifyToken(false);
                $userId = $user['user_id'] ?? null;
            } catch (Exception $e) {}

            Response::success('Danh sách bình luận', $commentModel->getPostComments($postId, $userId));
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function commentOnPost($groupId, $postId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $commentModel = new Comment();
            $input = json_decode(file_get_contents('php://input'), true);
            $content = $input['content'] ?? '';
            $parentId = $input['parent_id'] ?? null;

            if (empty($content)) Response::error('Nội dung không được để trống', 400);

            $commentId = $commentModel->create($postId, $currentUser['user_id'], $content, $parentId);
            if ($commentId) Response::success('Thành công', ['comment_id' => $commentId]);
            else Response::error('Lỗi khi lưu bình luận', 500);
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    /**
     * Cập nhật vai trò thành viên (chỉ Owner mới có quyền)
     */
    public function updateMemberRole($idOrSlug, $userId) {
        try {
            $groupId = $this->resolveId($idOrSlug);
            $currentUser = AuthMiddleware::verifyToken();
            $myRole = $this->groupModel->getUserRole($groupId, $currentUser['user_id']);
            
            if ($myRole !== 'owner') {
                Response::error('Chỉ Quản trị viên sáng lập mới có quyền cập nhật vai trò', 403);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $role = $input['role'] ?? '';

            if (!in_array($role, ['admin', 'moderator', 'member'])) {
                Response::error('Vai trò không hợp lệ', 400);
            }

            if ((int)$currentUser['user_id'] === (int)$userId) {
                Response::error('Bạn không thể tự cập nhật vai trò của chính mình', 400);
            }

            // Kiểm tra xem thành viên cần cập nhật có tồn tại trong nhóm không
            $targetRole = $this->groupModel->getUserRole($groupId, $userId);
            if (!$targetRole) {
                Response::error('Thành viên không tồn tại trong nhóm hoặc chưa tham gia', 404);
            }

            if ($targetRole === 'owner') {
                Response::error('Không thể thay đổi vai trò của Quản trị viên sáng lập', 400);
            }

            if ($this->groupModel->updateMemberRole($groupId, $userId, $role)) {
                Response::success('Cập nhật vai trò thành công');
            } else {
                Response::error('Lỗi khi cập nhật vai trò', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    /**
     * Trục xuất thành viên khỏi nhóm
     */
    public function kickMember($idOrSlug, $userId) {
        try {
            $groupId = $this->resolveId($idOrSlug);
            $currentUser = AuthMiddleware::verifyToken();
            
            if ((int)$currentUser['user_id'] === (int)$userId) {
                Response::error('Bạn không thể tự trục xuất chính mình. Hãy dùng chức năng rời nhóm.', 400);
            }

            $myRole = $this->groupModel->getUserRole($groupId, $currentUser['user_id']);
            if (!$myRole || !in_array($myRole, ['owner', 'admin'])) {
                Response::error('Bạn không có quyền trục xuất thành viên', 403);
            }

            $targetRole = $this->groupModel->getUserRole($groupId, $userId);
            if (!$targetRole) {
                Response::error('Thành viên không tồn tại hoặc chưa tham gia nhóm', 404);
            }

            // Quản trị viên (admin) chỉ được trục xuất Kiểm duyệt viên (moderator) hoặc Thành viên (member)
            if ($myRole === 'admin' && in_array($targetRole, ['owner', 'admin'])) {
                Response::error('Bạn không có quyền trục xuất người có cấp bậc bằng hoặc cao hơn', 403);
            }

            if ($this->groupModel->removeMember($groupId, $userId)) {
                Response::success('Trục xuất thành viên thành công');
            } else {
                Response::error('Lỗi khi trục xuất thành viên', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    /**
     * Xử lý bài viết (Duyệt hoặc Từ chối)
     */
    public function processPost($idOrSlug, $postId) {
        try {
            $groupId = $this->resolveId($idOrSlug);
            $currentUser = AuthMiddleware::verifyToken();
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? ''; // 'approved' hoặc 'rejected'

            if (!in_array($action, ['approved', 'rejected'])) {
                Response::error('Hành động không hợp lệ', 400);
            }

            $myRole = $this->groupModel->getUserRole($groupId, $currentUser['user_id']);
            if (!$myRole || !in_array($myRole, ['admin', 'owner', 'moderator'])) {
                Response::error('Bạn không có quyền xử lý bài viết trong nhóm này', 403);
            }

            $postModel = new Post();
            $post = $postModel->getPostDetailRaw($postId);
            if (!$post) Response::error('Không tìm thấy bài viết', 404);

            $authorRole = $this->groupModel->getUserRole($groupId, $post['user_id']);

            // Logic phân quyền:
            // Admin/Owner: Duyệt tất cả.
            // Moderator: Chỉ duyệt của Member. Không duyệt của Mod/Admin khác.
            if ($myRole === 'moderator' && ($authorRole === 'admin' || $authorRole === 'owner' || $authorRole === 'moderator')) {
                Response::error('Bạn không có quyền xử lý bài viết của người có cấp bậc bằng hoặc cao hơn', 403);
            }

            $isApproved = ($action === 'approved');
            if ($postModel->updateApprovalStatus($postId, $action, $isApproved)) {
                $group = $this->groupModel->findById($groupId);
                $notification = new Notification();
                
                $message = $isApproved ? "Bài viết của bạn trong nhóm <b>{$group['name']}</b> đã được duyệt." : "Bài viết của bạn trong nhóm <b>{$group['name']}</b> đã bị từ chối.";
                $notifType = $isApproved ? 'group_request_approved' : 'group_request_rejected';

                $notification->create([
                    'user_id' => $post['user_id'],
                    'actor_id' => $currentUser['user_id'],
                    'type' => $notifType,
                    'target_id' => $groupId,
                    'target_type' => 'group',
                    'custom_message' => $message
                ]);

                Response::success($isApproved ? 'Đã duyệt bài viết' : 'Đã từ chối bài viết');
            } else {
                Response::error('Lỗi khi cập nhật trạng thái bài viết', 500);
            }
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function getPendingPosts($idOrSlug) {
        try {
            $groupId = $this->resolveId($idOrSlug);
            $currentUser = AuthMiddleware::verifyToken();
            $myRole = $this->groupModel->getUserRole($groupId, $currentUser['user_id']);

            if (!$myRole || !in_array($myRole, ['admin', 'owner', 'moderator'])) {
                Response::error('Bạn không có quyền xem bài viết chờ duyệt', 403);
            }

            $postModel = new Post();
            Response::success('Bài viết chờ duyệt', $postModel->getPendingPostsByGroup($groupId));
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function members($id) {
        try {
            Response::success('Danh sách thành viên', $this->groupModel->getMembers($id));
        } catch (Exception $e) { Response::error($e->getMessage(), 500); }
    }

    public function fixDatabasePosts() {
        try {
            $db = Database::getInstance()->getConnection();
            $output = "--- BẮT ĐẦU CẬP NHẬT CẤU TRÚC DATABASE ---\n";
            $db->exec("ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE");
            $db->exec("ALTER TABLE posts ADD COLUMN IF NOT EXISTS original_post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL");
            $db->exec("ALTER TABLE group_members ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'accepted'");
            $db->exec("ALTER TABLE group_members ADD COLUMN IF NOT EXISTS invited_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL");
            try { $db->exec("ALTER TABLE group_members ADD CONSTRAINT group_user_unique UNIQUE (group_id, user_id)"); } catch (Exception $e) {}
            Response::success('Cập nhật database thành công', $output);
        } catch (Exception $e) { Response::error('Lỗi fix database: ' . $e->getMessage(), 500); }
    }
}
