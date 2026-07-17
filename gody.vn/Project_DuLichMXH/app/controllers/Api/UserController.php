<?php
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../config/database.php';

class UserController {
    private $db;
    
    public function __construct() {
        $database = Database::getInstance();
        $this->db = $database->getConnection();
    }
    
    public function show($id) {
        try {
            // ✅ Bổ sung location và interests vào câu query show
            $query = "SELECT u.id, u.username, u.email, u.full_name, u.avatar, 
                             u.bio, u.location, u.interests, u.hometown, u.dob, u.gender, u.phone,
                             u.post_count, u.follower_count, u.following_count,
                             u.created_at, u.last_login_at,
                             r.name as role_name, r.color as role_color
                      FROM users u
                      LEFT JOIN roles r ON u.role_id = r.id
                      WHERE u.id = :id AND u.status != 'banned'";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                Response::error('Người dùng không tồn tại', 404);
                return;
            }
            
            // Format interests từ string sang array cho frontend nếu cần
            if (isset($user['interests']) && is_string($user['interests'])) {
                $user['interests'] = array_filter(explode(', ', $user['interests']));
            } else {
                $user['interests'] = [];
            }
            
            Response::success($user);
        } catch (Exception $e) {
            Response::error('Lỗi: ' . $e->getMessage(), 500);
        }
    }
    
    public function update($id) {
        try {
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Response::error('Dữ liệu JSON không hợp lệ: ' . json_last_error_msg(), 400);
                return;
            }

            if (!$data) {
                Response::error('Không nhận được dữ liệu cập nhật', 400);
                return;
            }

            $updates = [];
            $params = [':id' => $id];
            
            // Danh sách các trường được phép lưu
            $allowedFields = ['full_name', 'bio', 'location', 'interests', 'hometown', 'phone', 'gender', 'dob'];
            
            foreach ($allowedFields as $field) {
                // Kiểm tra nếu trường tồn tại trong dữ liệu gửi lên (bao gồm cả chuỗi rỗng)
                if (array_key_exists($field, $data)) {
                    $value = $data[$field];
                    
                    // Nếu là mảng interests, chuyển sang chuỗi để lưu vào DB
                    if ($field === 'interests' && is_array($value)) {
                        $value = implode(', ', $value);
                    }
                    
                    $updates[] = "{$field} = :{$field}";
                    $params[":{$field}"] = $value;
                }
            }
            
            if (empty($updates)) {
                Response::error('Không có thông tin nào thay đổi', 400);
                return;
            }
            
            $updates[] = "updated_at = NOW()";
            $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            
            if ($stmt->execute($params)) {
                // Lấy lại dữ liệu đầy đủ sau khi update
                $fetchStmt = $this->db->prepare("SELECT id, username, email, full_name, avatar, bio, location, interests, hometown, phone, gender, dob FROM users WHERE id = :id");
                $fetchStmt->execute([':id' => $id]);
                $updatedUser = $fetchStmt->fetch(PDO::FETCH_ASSOC);
                
                // Format interests cho frontend
                if (isset($updatedUser['interests']) && is_string($updatedUser['interests'])) {
                    $updatedUser['interests'] = array_filter(explode(', ', $updatedUser['interests']));
                } else {
                    $updatedUser['interests'] = [];
                }

                Response::success($updatedUser, 200);
            } else {
                $errorInfo = $stmt->errorInfo();
                Response::error('Lỗi thực thi SQL: ' . ($errorInfo[2] ?? 'Không xác định'), 500);
            }
        } catch (Exception $e) {
            Response::error('Lỗi Server: ' . $e->getMessage(), 500);
        }
    }

    public function updateAvatar($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['avatar'])) {
                Response::error('Thiếu đường dẫn ảnh đại diện', 400);
                return;
            }
            $query = "UPDATE users SET avatar = :avatar, updated_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':avatar', $data['avatar']);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            if ($stmt->execute()) {
                Response::success(['message' => 'Cập nhật ảnh thành công']);
            } else {
                Response::error('Lỗi cập nhật ảnh', 500);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function uploadAvatar($id) {
        try {
            if (!isset($_FILES['avatar'])) {
                Response::error('Không tìm thấy file', 400);
                return;
            }
            $file = $_FILES['avatar'];
            $filename = time() . '_' . $file['name'];
            $path = __DIR__ . '/../../../public/uploads/avatars/' . $filename;
            
            if (!is_dir(dirname($path))) mkdir(dirname($path), 0755, true);
            
            if (move_uploaded_file($file['tmp_name'], $path)) {
                $url = '/uploads/avatars/' . $filename;
                $stmt = $this->db->prepare("UPDATE users SET avatar = :avatar WHERE id = :id");
                $stmt->execute([':avatar' => $url, ':id' => $id]);
                Response::success(['avatar_url' => $url]);
            } else {
                Response::error('Lỗi lưu file', 500);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function getFollowers($id) { /* Giữ nguyên ... */ }
    public function getFollowing($id) { /* Giữ nguyên ... */ }
    public function changePassword($id) { /* Giữ nguyên ... */ }
}
?>