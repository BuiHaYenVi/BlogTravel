<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Report;
use App\Models\Notification;
use App\Models\AdminNotification;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;
use App\Config\Database;
use App\Utils\Env;
use PDO;
use PDOException;

/**
 * Report Controller
 * Xử lý API báo cáo vi phạm
 * 
 * @package App\Controllers\Api
 */
class ReportController extends BaseController {
    
    private function getAuthUserId() {
        try {
            $user = AuthMiddleware::verifyToken();
            return $user['user_id'];
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function isAdmin(): bool {
        try {
            $user = AuthMiddleware::verifyToken();
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                SELECT u.id, r.slug as role_slug 
                FROM users u 
                LEFT JOIN roles r ON u.role_id = r.id 
                WHERE u.id = :id AND u.status = 'active'
            ");
            $stmt->execute(['id' => $user['user_id']]);
            $userData = $stmt->fetch();
            
            return $userData && in_array($userData['role_slug'], ['super-admin', 'admin', 'moderator']);
        } catch (Exception $e) {
            return false;
        }
    }
    
    // ==================== PUBLIC API METHODS ====================
    
    public function store() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];
        } catch (Exception $e) {
            return $this->error('Yêu cầu đăng nhập', 401);
        }
        
        $data = $this->getInput();
        $errors = [];

        // 1. Kiểm tra các trường bắt buộc
        $required = ['reportable_type', 'reportable_id', 'reason'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $errors[$field] = "Trường {$field} là bắt buộc.";
            }
        }

        // 2. Kiểm tra loại đối tượng hợp lệ
        if (empty($errors['reportable_type'])) {
            $validTypes = [Report::TYPE_POST, Report::TYPE_COMMENT, Report::TYPE_USER, Report::TYPE_GROUP_POST, Report::TYPE_TRIP, Report::TYPE_STORY];
            if (!in_array($data['reportable_type'], $validTypes)) {
                $errors['reportable_type'] = 'Loại đối tượng không hợp lệ (hỗ trợ: post, comment, user, group_post, trip, story).';
            }
        }

        // 3. Kiểm tra lý do hợp lệ
        if (empty($errors['reason'])) {
            $validReasons = array_keys(Report::getReasons());
            if (!in_array($data['reason'], $validReasons)) {
                $errors['reason'] = 'Lý do báo cáo không hợp lệ.';
            }

            // Nếu lý do là 'khác', yêu cầu phải có mô tả chi tiết (description)
            if ($data['reason'] === Report::REASON_OTHER && (empty($data['description']) || trim($data['description']) === '')) {
                $errors['description'] = 'Vui lòng cung cấp mô tả chi tiết cho lý do "Khác".';
            }
        }

        // 4. Kiểm tra ID đối tượng
        if (empty($errors['reportable_id'])) {
            if (!is_numeric($data['reportable_id']) || (int)$data['reportable_id'] <= 0) {
                $errors['reportable_id'] = 'ID đối tượng phải là một số nguyên dương.';
            }
        }

        // 5. Trả về lỗi nếu validate thất bại
        if (!empty($errors)) {
            return $this->error('Validation Failed', 422, $errors);
        }
        
        if ($data['reportable_type'] === Report::TYPE_USER && (int)$data['reportable_id'] == $userId) {
            return $this->error('Không thể báo cáo chính mình', 400);
        }
        
        if (!$this->targetExists($data['reportable_type'], (int)$data['reportable_id'])) {
            return $this->error('Đối tượng không tồn tại', 404);
        }
        
        $report = new Report();
        $reportId = $report->createReport([
            'reporter_id' => $userId,
            'reportable_type' => $data['reportable_type'],
            'reportable_id' => (int)$data['reportable_id'],
            'reason' => $data['reason'],
            'description' => trim($data['description'] ?? '') ?: null
        ]);
        
        if (!$reportId) {
            return $this->error('Bạn đã báo cáo nội dung này trước đó và đang chờ xử lý', 409);
        }

        // 🆕 LƯU THÔNG BÁO ADMIN & GỌI SOCKET
        $this->notifyAdmin($currentUser, $data);
        
        return $this->success('Báo cáo đã được gửi thành công. Chúng tôi sẽ sớm xem xét.', [
            'id' => $reportId,
            'status' => 'pending'
        ], 201);
    }
    
    public function reasons() {
        return $this->success('Danh sách lý do', Report::getReasons());
    }
    
    public function show($reportId) {
        $userId = $this->getAuthUserId();
        if (!$userId) {
            return $this->error('Yêu cầu đăng nhập', 401);
        }
        
        $report = (new Report())->getReportDetail((int)$reportId);
        if (!$report) {
            return $this->error('Báo cáo không tồn tại', 404);
        }
        
        if ($report['reporter_id'] != $userId && !$this->isAdmin()) {
            return $this->error('Không có quyền', 403);
        }
        
        return $this->success('Chi tiết báo cáo', $report);
    }
    
    public function index() {
        try {
            $user = AuthMiddleware::verifyToken();
            $userId = $user['user_id'];
        } catch (Exception $e) {
            return $this->error('Yêu cầu đăng nhập', 401);
        }
        
        $filters = [
            'status' => $_GET['status'] ?? null,
            'type' => $_GET['type'] ?? null,
            'reason' => $_GET['reason'] ?? null,
            'from_date' => $_GET['from_date'] ?? null,
            'to_date' => $_GET['to_date'] ?? null
        ];
        
        // Nếu không phải admin, chỉ cho xem report của chính mình
        if (!$this->isAdmin()) {
            $filters['reporter_id'] = $userId;
        }
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        
        $result = (new Report())->getReportsForAdmin($filters, $page, $limit);
        return $this->success('Danh sách báo cáo', $result);
    }
    
    public function review($reportId) {
        if (!$this->isAdmin()) {
            return $this->error('Không có quyền', 403);
        }
        
        $data = $this->getInput();
        $action = $data['action'] ?? 'resolve';
        $adminNote = $data['note'] ?? null;
        
        if (!in_array($action, ['resolve', 'reject'])) {
            return $this->error('Hành động không hợp lệ', 422);
        }
        
        $status = $action === 'resolve' ? Report::STATUS_RESOLVED : Report::STATUS_REJECTED;
        $adminId = $this->getAuthUserId();
        
        $reportModel = new Report();
        $report = $reportModel->getReportDetail((int)$reportId);
        
        if (!$report) {
            return $this->error('Báo cáo không tồn tại', 404);
        }
        
        if ($report['status'] !== Report::STATUS_PENDING) {
            return $this->error('Báo cáo đã được xử lý', 400);
        }
        
        if (!$reportModel->updateReportStatus((int)$reportId, $status, $adminId, $adminNote)) {
            return $this->error('Không thể cập nhật', 500);
        }
        
        if ($action === 'resolve') {
            $this->handleViolation($report);
        }
        
        return $this->success($action === 'resolve' ? 'Đã xử lý vi phạm' : 'Đã từ chối báo cáo', [
            'report_id' => $reportId,
            'new_status' => $status
        ]);
    }
    
    public function destroy($reportId) {
        if (!$this->isAdmin()) {
            return $this->error('Không có quyền', 403);
        }
        
        $adminId = $this->getAuthUserId();
        if ((new Report())->deleteReport((int)$reportId, $adminId)) {
            return $this->success('Đã xóa báo cáo');
        }
        return $this->error('Không thể xóa', 500);
    }
    
    // ==================== PRIVATE HELPERS ====================
    
    private function notifyAdmin($currentUser, $data) {
        try {
            $adminNotif = new AdminNotification();
            $typeStr = 'bài viết';
            if ($data['reportable_type'] === Report::TYPE_COMMENT) $typeStr = 'bình luận';
            if ($data['reportable_type'] === Report::TYPE_USER) $typeStr = 'người dùng';
            if ($data['reportable_type'] === Report::TYPE_STORY) $typeStr = 'tin ngắn';
            if ($data['reportable_type'] === Report::TYPE_TRIP) $typeStr = 'chuyến đi';
            if ($data['reportable_type'] === Report::TYPE_GROUP_POST) $typeStr = 'bài viết nhóm';

            $notifData = [
                'sender_id' => $currentUser['user_id'],
                'sender_name' => $currentUser['username'] ?? 'User',
                'reason' => $data['reason'],
                'message' => "{$currentUser['username']} đã báo cáo 1 {$typeStr}.",
                'target_id' => $data['reportable_id']
            ];

            // 1. Lưu vào Database
            $adminNotif->createNotification('report_' . str_replace('App\\Models\\', '', $data['reportable_type']), $notifData);

            // 2. Gọi cURL sang Node.js
            $chatServerPort = Env::get('PORT', '3001'); // Port mặc định là 3001 theo cấu hình Node.js
            $internalSecret = Env::get('INTERNAL_SYNC_SECRET', 'INTERNAL_SYNC_SECRET_2026');
            $url = "http://127.0.0.1:{$chatServerPort}/internal/new-admin-notification";

            $payload = json_encode([
                'secret' => $internalSecret,
                'notification' => [
                    'type' => 'report_' . str_replace('App\\Models\\', '', $data['reportable_type']),
                    'data' => $notifData,
                    'is_read' => false,
                    'time_ago' => 'vừa xong'
                ]
            ]);

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 2); // Tránh block main thread
            curl_exec($ch);
            curl_close($ch);

        } catch (Exception $e) {
            error_log("Failed to notify admin: " . $e->getMessage());
        }
    }

    private function targetExists(string $type, int $id): bool {
        $db = Database::getInstance()->getConnection();
        $tables = [
            Report::TYPE_POST => 'posts',
            Report::TYPE_COMMENT => 'comments',
            Report::TYPE_USER => 'users',
            Report::TYPE_GROUP_POST => 'posts', // Cả post thường và post nhóm đều ở bảng posts
            Report::TYPE_TRIP => 'trips',
            Report::TYPE_STORY => 'stories'
        ];
        
        if (!isset($tables[$type])) return false;
        
        try {
            $stmt = $db->prepare("SELECT 1 FROM {$tables[$type]} WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            return (bool)$stmt->fetch();
        } catch (PDOException $e) {
            error_log("targetExists error: " . $e->getMessage());
            return false;
        }
    }
    
    private function handleViolation(array $report): void {
        $pdo = Database::getInstance()->getConnection();
        try {
            $notification = new Notification();
            $ownerId = null;

            switch ($report['reportable_type']) {
                case Report::TYPE_POST:
                case Report::TYPE_GROUP_POST:
                    $stmt = $pdo->prepare("SELECT user_id FROM posts WHERE id = :id");
                    $stmt->execute(['id' => $report['reportable_id']]);
                    $ownerId = $stmt->fetchColumn();
                    
                    $pdo->prepare("UPDATE posts SET status = 'hidden', updated_at = NOW() WHERE id = :id")
                        ->execute(['id' => $report['reportable_id']]);
                    
                    if ($ownerId) {
                        $notification->create([
                            'user_id' => $ownerId,
                            'actor_id' => $this->getAuthUserId(),
                            'type' => 'system_alert',
                            'target_id' => $report['reportable_id'],
                            'target_type' => 'post',
                            'custom_message' => 'Bài viết của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.'
                        ]);
                    }
                    break;
                case Report::TYPE_COMMENT:
                    $stmt = $pdo->prepare("SELECT user_id FROM comments WHERE id = :id");
                    $stmt->execute(['id' => $report['reportable_id']]);
                    $ownerId = $stmt->fetchColumn();

                    $pdo->prepare("UPDATE comments SET status = 'hidden', updated_at = NOW() WHERE id = :id")
                        ->execute(['id' => $report['reportable_id']]);
                    
                    if ($ownerId) {
                        $notification->create([
                            'user_id' => $ownerId,
                            'actor_id' => $this->getAuthUserId(),
                            'type' => 'system_alert',
                            'target_id' => $report['reportable_id'],
                            'target_type' => 'comment',
                            'custom_message' => 'Bình luận của bạn đã bị xóa do vi phạm tiêu chuẩn cộng đồng.'
                        ]);
                    }
                    break;
                case Report::TYPE_USER:
                    $ownerId = $report['reportable_id'];
                    $pdo->prepare("UPDATE users SET status = 'banned', updated_at = NOW() WHERE id = :id")
                        ->execute(['id' => $report['reportable_id']]);
                    
                    if ($ownerId) {
                        $notification->create([
                            'user_id' => $ownerId,
                            'actor_id' => $this->getAuthUserId(),
                            'type' => 'system_alert',
                            'target_id' => $report['reportable_id'],
                            'target_type' => 'user',
                            'custom_message' => 'Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng.'
                        ]);
                    }
                    break;
                case Report::TYPE_TRIP:
                    $stmt = $pdo->prepare("SELECT user_id FROM trips WHERE id = :id");
                    $stmt->execute(['id' => $report['reportable_id']]);
                    $ownerId = $stmt->fetchColumn();
                    
                    $pdo->prepare("UPDATE trips SET status = 'hidden', is_public = FALSE, updated_at = NOW() WHERE id = :id")
                        ->execute(['id' => $report['reportable_id']]);
                    
                    if ($ownerId) {
                        $notification->create([
                            'user_id' => $ownerId,
                            'actor_id' => $this->getAuthUserId(),
                            'type' => 'system_alert',
                            'target_id' => $report['reportable_id'],
                            'target_type' => 'trip',
                            'custom_message' => 'Chuyến đi của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.'
                        ]);
                    }
                    break;
                case Report::TYPE_STORY:
                    $stmt = $pdo->prepare("SELECT user_id FROM stories WHERE id = :id");
                    $stmt->execute(['id' => $report['reportable_id']]);
                    $ownerId = $stmt->fetchColumn();
                    
                    $pdo->prepare("UPDATE stories SET is_active = FALSE, updated_at = NOW() WHERE id = :id")
                        ->execute(['id' => $report['reportable_id']]);
                    
                    if ($ownerId) {
                        $notification->create([
                            'user_id' => $ownerId,
                            'actor_id' => $this->getAuthUserId(),
                            'type' => 'system_alert',
                            'target_id' => $report['reportable_id'],
                            'target_type' => 'story',
                            'custom_message' => 'Tin ngắn 24h của bạn đã bị gỡ bỏ do vi phạm tiêu chuẩn cộng đồng.'
                        ]);
                    }
                    break;
            }
        } catch (PDOException $e) {
            error_log("handleViolation error: " . $e->getMessage());
        }
    }
}
