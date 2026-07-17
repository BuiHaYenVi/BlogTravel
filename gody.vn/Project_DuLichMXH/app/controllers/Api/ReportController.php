<?php
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
// ✅ Report.php đã tự load BaseModel bên trong, nên chỉ cần require duy nhất file này
require_once __DIR__ . '/../../models/Report.php';

/**
 * Report Controller
 * Xử lý API báo cáo vi phạm
 * 
 * @package App\Controllers\Api
 */
class ReportController {
    
    private function getJsonInput(): array {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }
    
    private function getAuthUserId() {
        // TODO: Thay bằng AuthMiddleware::verifyToken() khi tích hợp hoàn chỉnh
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            // Giải mã token thực tế tại đây
            // return $decodedToken->user_id;
            return 1; // Demo placeholder
        }
        return false;
    }
    
    private function isAdmin(): bool {
        $userId = $this->getAuthUserId();
        if (!$userId) return false;
        
        $db = \Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT u.id, r.slug as role_slug 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = :id AND u.status = 'active'
        ");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();
        
        return $user && in_array($user['role_slug'], ['super-admin', 'admin', 'moderator']);
    }
    
    // ==================== PUBLIC API METHODS ====================
    
    public function store() {
        $userId = $this->getAuthUserId();
        if (!$userId) {
            return Response::error('Yêu cầu đăng nhập', 401);
        }
        
        $data = $this->getJsonInput();
        
        $required = ['reportable_type', 'reportable_id', 'reason'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return Response::error("Thiếu trường: {$field}", 422);
            }
        }
        
        $validTypes = [Report::TYPE_POST, Report::TYPE_COMMENT, Report::TYPE_USER, Report::TYPE_GROUP_POST];
        if (!in_array($data['reportable_type'], $validTypes)) {
            return Response::error('Loại đối tượng không hợp lệ', 422);
        }
        
        $validReasons = array_keys(Report::getReasons());
        if (!in_array($data['reason'], $validReasons)) {
            return Response::error('Lý do không hợp lệ', 422);
        }
        
        if (!is_numeric($data['reportable_id']) || (int)$data['reportable_id'] <= 0) {
            return Response::error('ID không hợp lệ', 422);
        }
        
        if ($data['reportable_type'] === Report::TYPE_USER && (int)$data['reportable_id'] == $userId) {
            return Response::error('Không thể báo cáo chính mình', 400);
        }
        
        if (!$this->targetExists($data['reportable_type'], (int)$data['reportable_id'])) {
            return Response::error('Đối tượng không tồn tại', 404);
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
            return Response::error('Bạn đã báo cáo nội dung này trước đó', 409);
        }
        
        return Response::success([
            'id' => $reportId,
            'message' => 'Báo cáo đã được gửi thành công',
            'status' => 'pending'
        ], 201);
    }
    
    public function reasons() {
        return Response::success(Report::getReasons());
    }
    
    public function show($reportId) {
        $userId = $this->getAuthUserId();
        if (!$userId) {
            return Response::error('Yêu cầu đăng nhập', 401);
        }
        
        $report = (new Report())->getReportDetail((int)$reportId);
        if (!$report) {
            return Response::error('Báo cáo không tồn tại', 404);
        }
        
        if ($report['reporter_id'] != $userId && !$this->isAdmin()) {
            return Response::error('Không có quyền', 403);
        }
        
        return Response::success($report);
    }
    
    public function index() {
        if (!$this->isAdmin()) {
            return Response::error('Không có quyền', 403);
        }
        
        $filters = [
            'status' => $_GET['status'] ?? null,
            'type' => $_GET['type'] ?? null,
            'reason' => $_GET['reason'] ?? null,
            'from_date' => $_GET['from_date'] ?? null,
            'to_date' => $_GET['to_date'] ?? null
        ];
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        
        $result = (new Report())->getReportsForAdmin($filters, $page, $limit);
        return Response::success($result);
    }
    
    public function review($reportId) {
        if (!$this->isAdmin()) {
            return Response::error('Không có quyền', 403);
        }
        
        $data = $this->getJsonInput();
        $action = $data['action'] ?? 'resolve';
        $adminNote = $data['note'] ?? null;
        
        if (!in_array($action, ['resolve', 'reject'])) {
            return Response::error('Hành động không hợp lệ', 422);
        }
        
        $status = $action === 'resolve' ? Report::STATUS_RESOLVED : Report::STATUS_REJECTED;
        $adminId = $this->getAuthUserId();
        
        $reportModel = new Report();
        $report = $reportModel->getReportDetail((int)$reportId);
        
        if (!$report) {
            return Response::error('Báo cáo không tồn tại', 404);
        }
        
        if ($report['status'] !== Report::STATUS_PENDING) {
            return Response::error('Báo cáo đã được xử lý', 400);
        }
        
        if (!$reportModel->updateReportStatus((int)$reportId, $status, $adminId, $adminNote)) {
            return Response::error('Không thể cập nhật', 500);
        }
        
        if ($action === 'resolve') {
            $this->handleViolation($report);
        }
        
        return Response::success([
            'message' => $action === 'resolve' ? 'Đã xử lý vi phạm' : 'Đã từ chối báo cáo',
            'report_id' => $reportId,
            'new_status' => $status
        ]);
    }
    
    public function destroy($reportId) {
        if (!$this->isAdmin()) {
            return Response::error('Không có quyền', 403);
        }
        
        $adminId = $this->getAuthUserId();
        if ((new Report())->deleteReport((int)$reportId, $adminId)) {
            return Response::success(['message' => 'Đã xóa báo cáo']);
        }
        return Response::error('Không thể xóa', 500);
    }
    
    // ==================== PRIVATE HELPERS ====================
    
    private function targetExists(string $type, int $id): bool {
        $db = \Database::getInstance()->getConnection();
        $tables = [
            Report::TYPE_POST => 'posts',
            Report::TYPE_COMMENT => 'comments',
            Report::TYPE_USER => 'users',
            Report::TYPE_GROUP_POST => 'group_posts'
        ];
        
        if (!isset($tables[$type])) return false;
        
        try {
            $stmt = $db->prepare("SELECT 1 FROM {$tables[$type]} WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            return (bool)$stmt->fetch();
        } catch (\PDOException $e) {
            error_log("targetExists error: " . $e->getMessage());
            return false;
        }
    }
    
    private function handleViolation(array $report): void {
        $pdo = \Database::getInstance()->getConnection();
        try {
            switch ($report['reportable_type']) {
                case Report::TYPE_POST:
                    $pdo->prepare("UPDATE posts SET status = 'hidden', updated_at = NOW() WHERE id = :id")
                        ->execute(['id' => $report['reportable_id']]);
                    break;
                case Report::TYPE_COMMENT:
                    $pdo->prepare("UPDATE comments SET status = 'hidden', updated_at = NOW() WHERE id = :id")
                        ->execute(['id' => $report['reportable_id']]);
                    break;
                case Report::TYPE_USER:
                    error_log("User {$report['reportable_id']} flagged by admin");
                    break;
                case Report::TYPE_GROUP_POST:
                    $pdo->prepare("UPDATE group_posts SET status = 'hidden', updated_at = NOW() WHERE id = :id")
                        ->execute(['id' => $report['reportable_id']]);
                    break;
            }
        } catch (PDOException $e) {
            error_log("handleViolation error: " . $e->getMessage());
        }
    }
}