<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\User;
use App\Models\Follow;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Group;
use App\Models\Location;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;

class UserController extends BaseController {
    
    public function show($id) {
        try {
            $userModel = new User();
            $user = $userModel->findById($id);
            if (!$user || $user['status'] === 'deleted') {
                return $this->error('Người dùng không tồn tại hoặc đã bị xóa', 404);
            }
            
            // Lấy stats
            $stats = $userModel->getStats($id);

            // Kiểm tra xem current user có đang follow người này không và ngược lại
            $isFollowing = false;
            $followsMe = false;
            try {
                $currentUser = AuthMiddleware::verifyToken(false);
                if ($currentUser) {
                    $followModel = new Follow();
                    $isFollowing = $followModel->isFollowing($currentUser['user_id'], $id);
                    $followsMe = $followModel->isFollowing($id, $currentUser['user_id']);
                }
            } catch (Exception $e) {}
            
            // Chuẩn hóa dữ liệu trả về giống update/login
            $responseData = [
                'id' => (string)$user['id'],
                'name' => $user['full_name'] ?: $user['username'],
                'username' => $user['username'],
                'email' => $user['email'],
                'avatar' => $user['avatar'],
                'bio' => $user['bio'] ?: '',
                'hometown' => $user['hometown'] ?: '',
                'current_city' => $user['current_city'] ?: '',
                'birth_date' => $user['dob'] ?: null,
                'education_school' => $user['education_school'] ?: '',
                'workplace' => $user['workplace'] ?: '',
                'location' => $user['hometown'] ?: '',
                'interests' => !empty($user['interests']) ? explode(', ', $user['interests']) : [],
                'stats' => $stats,
                'is_following' => $isFollowing,
                'follows_me' => $followsMe
            ];
            
            return $this->success('Lấy thông tin thành công', $responseData);
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }
    
    public function update($id) {
        try {
            // Xác thực token người dùng và trạng thái hoạt động
            $currentUser = AuthMiddleware::verifyToken();
            $currentUserId = (int)($currentUser['user_id'] ?? $currentUser['id'] ?? 0);
            
            // Chỉ chính mình hoặc Admin mới được phép cập nhật tài khoản này
            if ($currentUserId !== (int)$id) {
                return $this->error('Bạn không có quyền thực hiện hành động này.', 403);
            }

            $data = $this->getInput();
            
            if (!$data) {
                return $this->error('Dữ liệu không hợp lệ hoặc rỗng', 400);
            }

            $userModel = new User();
            
            // Chuẩn hóa dữ liệu để lưu vào PostgreSQL
            $updateData = [];
            
            // Xử lý Tên (Hỗ trợ cả full_name và name)
            if (isset($data['full_name'])) $updateData['full_name'] = $data['full_name'];
            elseif (isset($data['name'])) $updateData['full_name'] = $data['name'];
            
            // Xử lý Bio
            if (isset($data['bio'])) $updateData['bio'] = $data['bio'];
            
            // Xử lý Địa điểm (Hỗ trợ cả location và hometown)
            if (isset($data['hometown'])) $updateData['hometown'] = $data['hometown'];
            elseif (isset($data['location'])) $updateData['hometown'] = $data['location'];

            // Xử lý các trường thông tin cá nhân mới
            if (isset($data['current_city'])) $updateData['current_city'] = $data['current_city'];
            if (isset($data['birth_date'])) $updateData['dob'] = !empty($data['birth_date']) ? $data['birth_date'] : null;
            if (isset($data['education_school'])) $updateData['education_school'] = $data['education_school'];
            if (isset($data['workplace'])) $updateData['workplace'] = $data['workplace'];
            
            // Xử lý Sở thích
            if (isset($data['interests'])) {
                $updateData['interests'] = is_array($data['interests']) ? implode(', ', $data['interests']) : $data['interests'];
            }
            
            // Xử lý Ảnh
            if (isset($data['avatar'])) $updateData['avatar'] = $data['avatar'];

            // Thực hiện cập nhật
            $userModel->updateProfile($id, $updateData);
            
            // Lấy lại dữ liệu thật từ DB để trả về
            $updatedUser = $userModel->findById($id);
            
            if ($updatedUser) {
                // ✅ Tạo thông báo cho những người đang theo dõi
                $notification = new Notification();
                $followModel = new Follow();
                $followers = $followModel->getFollowers($id);
                foreach ($followers as $f) {
                    $notification->create([
                        'user_id' => $f['id'],
                        'actor_id' => $id,
                        'type' => 'profile_update',
                        'target_id' => $id,
                        'target_type' => 'user'
                    ]);
                }

                $responseData = [
                    'id' => (string)$updatedUser['id'],
                    'name' => $updatedUser['full_name'] ?: $updatedUser['username'],
                    'username' => $updatedUser['username'],
                    'email' => $updatedUser['email'],
                    'avatar' => $updatedUser['avatar'],
                    'bio' => $updatedUser['bio'] ?: '',
                    'hometown' => $updatedUser['hometown'] ?: '',
                    'current_city' => $updatedUser['current_city'] ?: '',
                    'birth_date' => $updatedUser['dob'] ?: null,
                    'education_school' => $updatedUser['education_school'] ?: '',
                    'workplace' => $updatedUser['workplace'] ?: '',
                    'location' => $updatedUser['hometown'] ?: '',
                    'interests' => !empty($updatedUser['interests']) ? explode(', ', $updatedUser['interests']) : []
                ];
                
                return $this->success('Cập nhật thông tin thành công', $responseData);
            } else {
                return $this->error('Lỗi: Không tìm thấy User sau khi lưu', 404);
            }
            
        } catch (Exception $e) {
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    public function uploadAvatar($id) {
        try {
            // Xác thực token người dùng và trạng thái hoạt động
            $currentUser = AuthMiddleware::verifyToken();
            $currentUserId = (int)($currentUser['user_id'] ?? $currentUser['id'] ?? 0);
            
            // Chỉ chính mình hoặc Admin mới được phép cập nhật tài khoản này
            if ($currentUserId !== (int)$id) {
                return $this->error('Bạn không có quyền thực hiện hành động này.', 403);
            }

            if (!isset($_FILES['avatar'])) {
                return $this->error('Không tìm thấy file upload', 400);
            }

            $file = $_FILES['avatar'];
            $filename = 'avatar_' . $id . '_' . time() . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
            $uploadDir = __DIR__ . '/../../../public/uploads/avatars/';
            
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
                $avatarUrl = asset_url('uploads/avatars/' . $filename);
                $userModel = new User();
                $userModel->updateProfile($id, ['avatar' => $avatarUrl]);
                return $this->success('Upload thành công', ['avatar_url' => $avatarUrl]);
            } else {
                return $this->error('Lưu file thất bại', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    public function search() {
        try {
            $query = $_GET['q'] ?? '';
            if (empty($query)) {
                return $this->success('Query rỗng', []);
            }
            
            $userModel = new User();
            $users = $userModel->search($query);
            
            // Map dữ liệu để trả về format chuẩn
            $results = array_map(function($u) {
                return [
                    'id' => (string)$u['id'],
                    'name' => $u['full_name'] ?: $u['username'],
                    'username' => $u['username'],
                    'avatar' => $u['avatar'],
                    'email' => $u['email']
                ];
            }, $users);
            
            return $this->success('Tìm kiếm thành công', $results);
        } catch (Exception $e) {
            return $this->error('Lỗi tìm kiếm: ' . $e->getMessage(), 500);
        }
    }

    public function getUserPosts($id) {
        try {
            $postModel = new Post();
            
            // Lấy ID người dùng hiện tại (nếu có đăng nhập) để biết họ đã Like bài viết chưa
            $currentUserId = null;
            try {
                $user = AuthMiddleware::verifyToken(false);
                $currentUserId = $user['user_id'] ?? $user['id'] ?? null;
            } catch (Exception $e) {
                // Không đăng nhập cũng không sao, chỉ là không thấy trạng thái Like của mình
            }

            $posts = $postModel->getByUser($id, 20, $currentUserId);
            
            // Giải mã JSON cho trường images (được gộp bằng json_agg trong SQL)
            foreach ($posts as &$post) {
                if (isset($post['images']) && is_string($post['images'])) {
                    $post['images'] = json_decode($post['images'], true);
                }
            }
            
            return $this->success('Lấy bài viết thành công', $posts);
        } catch (Exception $e) {
            error_log("UserController::getUserPosts Error: " . $e->getMessage());
            return $this->error('Lỗi khi lấy danh sách bài viết: ' . $e->getMessage(), 500);
        }
    }

    public function getUserPhotos($id) {
        try {
            $postModel = new Post();
            $photos = $postModel->getMediaByUser($id);
            return $this->success('Lấy hình ảnh thành công', $photos);
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    public function getUserGroups($id) {
        try {
            $groupModel = new Group();
            $groups = $groupModel->getByUser($id);
            return $this->success('Lấy hội nhóm thành công', $groups);
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    public function getUserLocations($id) {
        try {
            $locationModel = new Location();
            $locations = $locationModel->getVisitedByUser($id);
            return $this->success('Lấy địa điểm thành công', $locations);
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    public function getUserReviews($id) {
        try {
            $userModel = new User();
            $reviews = $userModel->getUserReviews($id);
            return $this->success('Lấy đánh giá thành công', $reviews);
        } catch (Exception $e) {
            return $this->error('Lỗi khi lấy danh sách đánh giá: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/users/{id}
     * Xóa mềm tài khoản người dùng và cascade dọn dẹp nội dung liên quan
     */
    public function destroy($id) {
        try {
            // Xác thực token người dùng
            $currentUser = AuthMiddleware::verifyToken();
            $currentUserId = (int)($currentUser['user_id'] ?? $currentUser['id'] ?? 0);
            $currentUserRole = $currentUser['role'] ?? $currentUser['role_slug'] ?? 'user';
            
            $targetUserId = (int)$id;

            // Kiểm tra phân quyền: Chỉ chính mình hoặc Admin mới được phép xóa tài khoản này
            if ($currentUserId !== $targetUserId && $currentUserRole !== 'admin') {
                return $this->error('Bạn không có quyền thực hiện hành động này.', 403);
            }

            $userModel = new User();
            $user = $userModel->findById($targetUserId);
            if (!$user || $user['status'] === 'deleted') {
                return $this->error('Tài khoản không tồn tại hoặc đã bị xóa trước đó.', 404);
            }

            if ($userModel->softDelete($targetUserId)) {
                return $this->success('Đã xóa tài khoản thành công!');
            }

            return $this->error('Không thể thực hiện xóa tài khoản.', 500);
        } catch (Exception $e) {
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
}
