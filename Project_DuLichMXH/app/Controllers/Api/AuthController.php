<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\User;
use App\Utils\Response;
use App\Utils\JWTHandler;
use App\Utils\Validator;
use App\Middleware\AuthMiddleware;
use Exception;

class AuthController extends BaseController {
    private $userModel;
    private $config;
    
    public function __construct() {
        $this->userModel = new User();
        $this->config = require __DIR__ . '/../../config/app.php';
    }

    /**
     * Helper kiểm tra xem có cần Bypass gửi mail hay không.
     * Trả về true nếu là tài khoản test/mock (sẽ trả mã OTP về frontend)
     * Trả về false nếu là tài khoản thật (phải bắn email qua PHPMailer)
     */
    private function isMockEmail($email) {
        $email = strtolower($email);
        $isGmail = str_ends_with($email, '@gmail.com');
        $isTestAccount = (strpos($email, 'test') !== false || strpos($email, 'mock') !== false);
        
        // Nếu LÀ @gmail.com VÀ KHÔNG CHỨA từ test/mock -> Chắc chắn là người dùng thật, không bypass
        if ($isGmail && !$isTestAccount) {
            return false;
        }

        // Các đuôi khác hoặc chứa test/mock -> Bypass trả debug_otp
        return true;
    }

    /**
     * POST /api/auth/send-register-otp
     * Gửi OTP xác thực trước khi đăng ký
     */
    public function sendRegisterOTP() {
        try {
            $input = $this->getInput();
            $email = $input['email'] ?? '';

            if (!Validator::email($email)) {
                return $this->error('Email không hợp lệ', 400);
            }

            // Kiểm tra email đã tồn tại chưa
            if ($this->userModel->findByEmail($email)) {
                return $this->error('Email này đã được đăng ký tài khoản', 409);
            }

            // Sinh mã OTP 5 số
            $otp = str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
            $otpResult = $this->userModel->createOTP($email, $otp);
            if ($otpResult['blocked']) {
                return $this->error($otpResult['message'], 429);
            }

            $isMockEmail = $this->isMockEmail($email);
            $responseData = ['message' => 'Mã xác thực đã được gửi tới ' . $email];
            
            if ($isMockEmail) {
                $responseData['debug_otp'] = $otp; // Bypass cho dev test
            } else {
                // Bắt buộc gửi mail thật
                $sent = \App\Utils\MailHelper::sendOTP($email, $otp);
                if (!$sent) {
                    return $this->error('Không thể gửi email lúc này, vui lòng liên hệ Admin.', 500);
                }
            }

            return $this->success('Thành công', $responseData);
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/auth/verify-otp
     * Xác thực mã OTP mà không thực hiện đăng ký hoặc đổi mật khẩu ngay lập tức
     */
    public function verifyOTP() {
        try {
            $input = $this->getInput();
            $email = $input['email'] ?? '';
            $otp = $input['otp'] ?? '';

            if (!$email || !$otp) {
                return $this->error('Thiếu email hoặc mã OTP', 400);
            }

            $otpCheck = $this->userModel->verifyOTP($email, $otp);
            if (!$otpCheck['success']) {
                return $this->error($otpCheck['message'], 400);
            }
            $otpRecord = $otpCheck['data'];

            return $this->success('Xác thực OTP thành công', [
                'email' => $email,
                'verified' => true
            ]);
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/auth/register
     * Đăng ký tài khoản mới (Yêu cầu OTP)
     */
    public function register() {
        try {
            $input = $this->getInput();
            
            // Bắt buộc có OTP
            if (!Validator::required($input, ['username', 'email', 'password', 'otp'])) {
                return $this->error('Thiếu thông tin đăng ký hoặc mã OTP', 400);
            }
            
            // 1. Kiểm tra OTP trước
            $otpCheck = $this->userModel->verifyOTP($input['email'], $input['otp']);
            if (!$otpCheck['success']) {
                return $this->error($otpCheck['message'], 400);
            }
            $otpRecord = $otpCheck['data'];

            // 2. Kiểm tra email/username lần cuối
            if ($this->userModel->findByEmail($input['email'])) {
                return $this->error('Email đã tồn tại', 409);
            }
            if ($this->userModel->findByUsername($input['username'])) {
                return $this->error('Tên đăng nhập đã tồn tại', 409);
            }

            // 3. Tạo user - email_verified_at = NOW(), is_verified = FALSE (VIP check)
            $input['auth_provider'] = 'local';
            $input['is_verified'] = false; 
            $input['email_verified_at'] = date('Y-m-d H:i:s');

            $userId = $this->userModel->create($input);
            $user = $this->userModel->findById($userId);
            
            // Xóa OTP sau khi dùng
            $this->userModel->deleteOTP($input['email']);

            // Tự động đăng nhập luôn sau khi đăng ký thành công
            $frontendUser = $this->formatUserForFrontend($user);
            $token = JWTHandler::generateToken($frontendUser);

            return $this->success('Đăng ký và xác thực tài khoản thành công.', [
                'token' => $token,
                'user' => $frontendUser
            ], 201);
            
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/auth/google-login
     * Đăng nhập qua Google
     */
    public function googleLogin() {
        try {
            $input = $this->getInput();
            if (empty($input['email'])) {
                return $this->error('Thiếu thông tin Google', 400);
            }

            $user = $this->userModel->findByEmail($input['email']);

            if (!$user) {
                // Tạo user mới từ Google
                $newUserData = [
                    'email' => $input['email'],
                    'username' => $input['username'] ?? explode('@', $input['email'])[0] . rand(100, 999),
                    'full_name' => $input['full_name'] ?? $input['name'] ?? '',
                    'avatar' => $input['avatar'] ?? '',
                    'password' => bin2hex(random_bytes(10)), // Mật khẩu ngẫu nhiên
                    'auth_provider' => 'google',
                    'is_verified' => false,
                    'email_verified_at' => date('Y-m-d H:i:s')
                ];
                $userId = $this->userModel->create($newUserData);
                $user = $this->userModel->findById($userId);
            }

            // Tạo token
            $frontendUser = $this->formatUserForFrontend($user);
            $token = JWTHandler::generateToken($frontendUser);

            return $this->success('Đăng nhập Google thành công', [
                'token' => $token,
                'user' => $frontendUser
            ]);
        } catch (Exception $e) {
            return $this->error('Lỗi Google Auth: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/auth/login
     */
    public function login() {
        try {
            $input = $this->getInput();
            if (empty($input['email']) || empty($input['password'])) {
                return $this->error('Thiếu email hoặc mật khẩu', 400);
            }

            $user = $this->userModel->findByEmail($input['email']);

            if (!$user || !$this->userModel->verifyPassword($input['password'], $user['password'])) {
                return $this->error('Sai email hoặc mật khẩu', 401);
            }

            // ✅ Bảo vệ Mock: Nếu provider là mock thì bypass verify check
            $isMock = ($user['auth_provider'] === 'mock');

            if (!$isMock && $user['auth_provider'] === 'local' && empty($user['email_verified_at'])) {
                return $this->error('Tài khoản chưa được xác thực email', 403);
            }
            
            if ($user['status'] === 'banned') {
                return $this->error('Tài khoản đã bị khóa', 403);
            }

            $this->userModel->updateLastLogin($user['id']);
            $frontendUser = $this->formatUserForFrontend($user);
            $token = JWTHandler::generateToken($frontendUser);

            return $this->success('Đăng nhập thành công', [
                'token' => $token,
                'user' => $frontendUser
            ]);
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/auth/forgot-password
     */
    public function forgotPassword() {
        try {
            $input = $this->getInput();
            $email = $input['email'] ?? '';

            if (!$email) return $this->error('Vui lòng nhập email', 400);

            $user = $this->userModel->findByEmail($email);
            if (!$user) return $this->error('Email không tồn tại trong hệ thống', 404);

            // Sinh mã OTP 5 số
            $otp = str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
            $otpResult = $this->userModel->createOTP($email, $otp);
            if ($otpResult['blocked']) {
                return $this->error($otpResult['message'], 429);
            }

            $isMockEmail = $this->isMockEmail($email);
            $responseData = ['message' => 'Mã OTP đã được gửi'];

            if ($isMockEmail) {
                $responseData['debug_otp'] = $otp; // Bypass cho dev test
            } else {
                // Gửi mail thật qua PHPMailer
                $sent = \App\Utils\MailHelper::sendOTP($email, $otp);
                if (!$sent) {
                    return $this->error('Không thể gửi email lúc này, vui lòng liên hệ Admin.', 500);
                }
            }

            return $this->success('Thành công', $responseData);
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword() {
        try {
            $input = $this->getInput();
            $email = $input['email'] ?? '';
            $otp = $input['otp'] ?? '';
            $newPassword = $input['password'] ?? '';

            if (!$email || !$otp || !$newPassword) {
                return $this->error('Thiếu thông tin xác thực', 400);
            }

            $otpCheck = $this->userModel->verifyOTP($email, $otp);
            if (!$otpCheck['success']) {
                return $this->error($otpCheck['message'], 400);
            }
            $otpRecord = $otpCheck['data'];

            // Update password
            $this->userModel->updatePassword($email, $newPassword);
            $this->userModel->deleteOTP($email);

            return $this->success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
        } catch (Exception $e) {
            return $this->error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Helper to format user for frontend
     */
    private function formatUserForFrontend($user) {
        return [
            'id' => (string)$user['id'],
            'username' => $user['username'] ?? '',
            'name' => ($user['full_name'] ?? '') ?: ($user['username'] ?? ''),
            'email' => $user['email'] ?? '',
            'avatar' => $user['avatar'] ?? '',
            'role_id' => $user['role_id'] ?? 3,
            'role' => $user['role_slug'] ?? 'user',
            'role_level' => isset($user['role_level']) ? (int)$user['role_level'] : 1,
            'auth_provider' => $user['auth_provider'] ?? 'local',
            'permissions' => $this->userModel->getPermissionsByRoleId((int)$user['role_id']),
            'following' => $this->userModel->getFollowingIds($user['id'])
        ];
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
                'id' => $user['user_id'] ?? $user['id'] ?? null,
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