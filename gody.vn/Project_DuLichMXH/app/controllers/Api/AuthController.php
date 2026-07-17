<?php
require_once __DIR__ . '/../BaseController.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Validator.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../config/app.php';

class AuthController extends BaseController {
    private $userModel;
    private $config;
    
    public function __construct() {
        $this->userModel = new User();
        $this->config = require __DIR__ . '/../../config/app.php';
    }

    /**
     * POST /api/auth/register
     * Đăng ký tài khoản mới
     */
    public function register() {
        try {
        $input = $this->getInput();
        
        // ✅ Validate required fields
        if (!Validator::required($input, ['username', 'email', 'password'])) {
            return $this->error('Thiếu username, email hoặc password', 400);
        }
        
        if (!Validator::email($input['email'])) {
            return $this->error('Email không hợp lệ', 400);
        }
        
        if (!Validator::password($input['password'], 
            $this->config['password']['min_length'],
            $this->config['password']['require_letters_and_numbers']
        )) {
            return $this->error('Mật khẩu phải có ít nhất 6 ký tự, gồm chữ và số', 400);
        }

        // ✅ Validate optional fields (full_name, phone)
        if (!empty($input['full_name']) && mb_strlen($input['full_name'], 'UTF-8') > 100) {
            return $this->error('Họ tên không được vượt quá 100 ký tự', 400);
        }
        
        if (!empty($input['phone'])) {
            // Remove spaces, dashes, dots before validate
            $cleanPhone = preg_replace('/[\s\-\.]/', '', $input['phone']);
            if (!preg_match('/^(0|\+84)[0-9]{9,10}$/', $cleanPhone)) {
                return $this->error('Số điện thoại không hợp lệ', 400);
            }
            // Update input với phone đã clean để lưu vào DB
            $input['phone'] = $cleanPhone;
        }
        
        // ✅ Validate các field optional khác nếu có
        if (!empty($input['avatar']) && !filter_var($input['avatar'], FILTER_VALIDATE_URL)) {
            return $this->error('Đường dẫn avatar không hợp lệ', 400);
        }

        // ✅ Check email exists
        if ($this->userModel->findByEmail($input['email'])) {
            return $this->error('Email đã tồn tại', 409);
        }

        // ✅ Create user (Model sẽ handle all allowed fields)
        $userId = $this->userModel->create($input);
        
        return $this->success('Đăng ký thành công.', [
            'user_id' => $userId
        ], 201);
        
    } catch (Exception $e) {
        error_log("AuthController@register Error: " . $e->getMessage());
        return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
    }
 }

    /**
     * POST /api/auth/login
     * Đăng nhập và trả JWT token
     */
    public function login() {
        try {
            $input = $this->getInput();
            
            if (empty($input['email']) || empty($input['password'])) {
                return $this->error('Thiếu email hoặc mật khẩu', 400);
            }

            // ✅ Find user by email (gọi Model)
            $user = $this->userModel->findByEmail($input['email']);

            // ✅ Verify password (gọi Model method)
            if (!$user || !$this->userModel->verifyPassword($input['password'], $user['password'])) {
                return $this->error('Sai email hoặc mật khẩu', 401);
            }
            
            // ✅ Check banned status (gọi Model)
            if ($user['status'] === 'banned') {
                return $this->error('Tài khoản đã bị khóa', 403);
            }

            // ✅ Generate JWT token (giữ nguyên logic cũ, dùng config)
            $token = JWTHandler::generateToken([
                'id' => $user['id'],
                'username' => $user['username'],
                'role_id' => $user['role_id']
            ], $this->config['jwt']);

            // ✅ Update last login (gọi Model)
            $this->userModel->updateLastLogin($user['id']);

            return $this->success('Đăng nhập thành công', [
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => $this->config['jwt']['expires_in'],
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'role_id' => $user['role_id']
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("AuthController@login Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }

    /**
     * POST /api/auth/logout
     * Đăng xuất (JWT stateless - client tự xóa token)
     */
    public function logout() {
        // Với JWT stateless, không cần xử lý server-side
        // (Optional) Nếu lưu token trong DB, xóa ở đây:
        // $this->db->execute("DELETE FROM user_tokens WHERE token = ?", [$token]);
        
        return $this->success('Đăng xuất thành công');
    }
    
    /**
     * POST /api/auth/refresh-token
     * Làm mới token khi sắp hết hạn
     */
    public function refreshToken() {
        try {
            // ✅ Use middleware để validate token (sạch hơn, tái sử dụng được)
            $user = AuthMiddleware::require();
            
            // ✅ Tạo token mới với data cũ
            $newToken = JWTHandler::generateToken([
                'id' => $user['id'],
                'username' => $user['username'],
                'role_id' => $user['role_id']
            ], $this->config['jwt']);
            
            return $this->success('Token refreshed', [
                'token' => $newToken,
                'expires_in' => $this->config['jwt']['expires_in']
            ]);
            
        } catch (Exception $e) {
            error_log("AuthController@refreshToken Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
}
?>