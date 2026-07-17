<?php
namespace App\Models;

use Exception;

/**
 * Report Model
 * Xử lý logic báo cáo vi phạm
 * Tương thích với schema: reports table trong dulichmxh
 * 
 * @package App\Models
 */
class Report extends BaseModel {
    protected $table = 'reports';
    
    // ===== CONSTANTS: Reportable Types =====
    const TYPE_POST = 'post';
    const TYPE_COMMENT = 'comment';
    const TYPE_USER = 'user';
    const TYPE_GROUP_POST = 'group_post';
    const TYPE_TRIP = 'trip';
    const TYPE_STORY = 'story';
    
    // ===== CONSTANTS: Reasons =====
    const REASON_SPAM = 'spam';
    const REASON_INAPPROPRIATE = 'inappropriate';
    const REASON_HARASSMENT = 'harassment';
    const REASON_NOT_INTERESTED = 'not_interested';
    const REASON_COPYRIGHT = 'copyright';
    const REASON_FAKE = 'fake';
    const REASON_OTHER = 'other';
    
    // ===== CONSTANTS: Status =====
    const STATUS_PENDING = 'pending';
    const STATUS_REVIEWED = 'reviewed';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_REJECTED = 'rejected';
    
    /**
     * Lấy danh sách lý do báo cáo
     */
    public static function getReasons(): array {
        return [
            self::REASON_SPAM => 'Spam',
            self::REASON_INAPPROPRIATE => 'Nội dung không phù hợp',
            self::REASON_HARASSMENT => 'Quấy rối',
            self::REASON_NOT_INTERESTED => 'Chỉ là tôi không thích nội dung này',
            self::REASON_COPYRIGHT => 'Vi phạm bản quyền',
            self::REASON_FAKE => 'Thông tin giả mạo',
            self::REASON_OTHER => 'Lý do khác'
        ];
    }
    
    /**
     * Lấy danh sách trạng thái
     */
    public static function getStatuses(): array {
        return [
            self::STATUS_PENDING => 'Chờ xử lý',
            self::STATUS_REVIEWED => 'Đã xem',
            self::STATUS_RESOLVED => 'Đã giải quyết',
            self::STATUS_REJECTED => 'Từ chối'
        ];
    }
    
    /**
     * Tạo báo cáo mới
     */
    public function createReport(array $data) {
        try {
            $existing = $this->first(
                "reporter_id = :reporter_id AND reportable_type = :type AND reportable_id = :target_id AND status = :status",
                [
                    'reporter_id' => $data['reporter_id'],
                    'type' => $data['reportable_type'],
                    'target_id' => $data['reportable_id'],
                    'status' => self::STATUS_PENDING
                ]
            );
            
            if ($existing) {
                return false;
            }
            
            $sql = "INSERT INTO {$this->table} 
                    (reporter_id, reportable_type, reportable_id, reason, description, status, created_at, updated_at) 
                    VALUES 
                    (:reporter_id, :type, :target_id, :reason, :description, :status, NOW(), NOW())";
            
            $params = [
                'reporter_id' => $data['reporter_id'],
                'type' => $data['reportable_type'],
                'target_id' => (int)$data['reportable_id'],
                'reason' => $data['reason'],
                'description' => $data['description'] ?? null,
                'status' => self::STATUS_PENDING
            ];
            
            $this->execute($sql, $params);
            return $this->getLastInsertId('reports_id_seq');
            
        } catch (Exception $e) {
            error_log("Report create error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy chi tiết một báo cáo
     */
    public function getReportDetail(int $id): ?array {
        $sql = "SELECT r.*, 
                       u.username as reporter_name,
                       u.email as reporter_email,
                       a.username as admin_name
                FROM {$this->table} r
                LEFT JOIN users u ON r.reporter_id = u.id
                LEFT JOIN users a ON r.admin_id = a.id
                WHERE r.id = :id";
        
        $report = $this->query($sql, ['id' => $id]);
        if (!$report) return null;
        
        $report = $report[0];
        $report['target_info'] = $this->getTargetInfo($report['reportable_type'], $report['reportable_id']);
        return $report;
    }
    
    /**
     * Lấy danh sách báo cáo cho admin
     */
    public function getReportsForAdmin(array $filters = [], int $page = 1, int $limit = 20): array {
        $where = [];
        $params = [];
        
        if (!empty($filters['status'])) {
            $where[] = "status = :status";
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['type'])) {
            $where[] = "reportable_type = :type";
            $params['type'] = $filters['type'];
        }
        if (!empty($filters['reason'])) {
            $where[] = "reason = :reason";
            $params['reason'] = $filters['reason'];
        }
        if (!empty($filters['reporter_id'])) {
            $where[] = "reporter_id = :reporter_id";
            $params['reporter_id'] = $filters['reporter_id'];
        }
        if (!empty($filters['from_date'])) {
            $where[] = "created_at >= :from_date";
            $params['from_date'] = $filters['from_date'];
        }
        if (!empty($filters['to_date'])) {
            $where[] = "created_at <= :to_date";
            $params['to_date'] = $filters['to_date'];
        }
        
        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $countSql = "SELECT COUNT(*) as total FROM {$this->table} {$whereClause}";
        $total = (int)($this->query($countSql, $params)[0]['total'] ?? 0);
        
        $offset = ($page - 1) * $limit;
        $params['limit'] = (int)$limit;
        $params['offset'] = (int)$offset;

        $sql = "SELECT r.*, 
                       u.username as reporter_name,
                       u.email as reporter_email,
                       a.username as admin_name
                FROM {$this->table} r
                LEFT JOIN users u ON r.reporter_id = u.id
                LEFT JOIN users a ON r.admin_id = a.id
                {$whereClause}
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $reports = $this->query($sql, $params);
        foreach ($reports as &$report) {
            $report['target_info'] = $this->getTargetInfo($report['reportable_type'], $report['reportable_id']);
        }
        
        return [
            'data' => $reports,
            'pagination' => [
                'total' => $total,
                'per_page' => $limit,
                'current_page' => $page,
                'total_pages' => ceil($total / $limit),
                'has_next' => $page * $limit < $total,
                'has_prev' => $page > 1
            ]
        ];
    }
    
    /**
     * Lấy thông tin đối tượng bị report
     */
    private function getTargetInfo(string $type, int $id): ?array {
        $pdo = $this->db->getConnection();
        switch ($type) {
            case self::TYPE_POST:
                $stmt = $pdo->prepare("SELECT id, title, user_id, post_type, created_at FROM posts WHERE id = :id");
                $stmt->execute(['id' => $id]);
                $data = $stmt->fetch();
                return $data ? array_merge($data, ['type' => 'post', 'label' => $data['post_type'] === 'blog' ? 'Blog' : 'Bài viết']) : null;
                
            case self::TYPE_COMMENT:
                $stmt = $pdo->prepare("SELECT id, content, user_id, post_id, created_at FROM comments WHERE id = :id");
                $stmt->execute(['id' => $id]);
                $data = $stmt->fetch();
                return $data ? array_merge($data, ['type' => 'comment', 'label' => 'Bình luận']) : null;
                
            case self::TYPE_USER:
                $stmt = $pdo->prepare("SELECT id, username, email, created_at FROM users WHERE id = :id");
                $stmt->execute(['id' => $id]);
                $data = $stmt->fetch();
                return $data ? array_merge($data, ['type' => 'user', 'label' => 'Người dùng']) : null;
                
            case self::TYPE_GROUP_POST:
                $stmt = $pdo->prepare("SELECT id, title, user_id, created_at FROM posts WHERE id = :id");
                $stmt->execute(['id' => $id]);
                $data = $stmt->fetch();
                return $data ? array_merge($data, ['type' => 'group_post', 'label' => 'Bài viết nhóm']) : null;
                
            case self::TYPE_TRIP:
                $stmt = $pdo->prepare("
                    SELECT t.id, t.title, t.description, t.user_id, t.created_at, u.username 
                    FROM trips t
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.id = :id
                ");
                $stmt->execute(['id' => $id]);
                $data = $stmt->fetch();
                return $data ? array_merge($data, ['type' => 'trip', 'label' => 'Chuyến đi']) : null;
                
            case self::TYPE_STORY:
                $stmt = $pdo->prepare("
                    SELECT s.id, s.media_url, s.media_type, s.caption, s.user_id, s.created_at, u.username 
                    FROM stories s
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE s.id = :id
                ");
                $stmt->execute(['id' => $id]);
                $data = $stmt->fetch();
                return $data ? array_merge($data, ['type' => 'story', 'label' => 'Tin ngắn 24h']) : null;
                
            default:
                return null;
        }
    }
    
    /**
     * Cập nhật trạng thái báo cáo
     */
    public function updateReportStatus(int $reportId, string $status, ?int $adminId = null, ?string $adminNote = null): bool {
        $validStatuses = [self::STATUS_REVIEWED, self::STATUS_RESOLVED, self::STATUS_REJECTED];
        if (!in_array($status, $validStatuses)) return false;
        
        $sql = "UPDATE {$this->table} 
                SET status = :status, admin_id = :admin_id, admin_note = :admin_note, updated_at = NOW()
                WHERE id = :id";
        
        return $this->execute($sql, [
            'status' => $status,
            'admin_id' => $adminId,
            'admin_note' => $adminNote,
            'id' => $reportId
        ]) > 0;
    }
    
    /**
     * Kiểm tra số lượng report pending
     */
    public function getPendingReportCount(string $type, int $id): int {
        $result = $this->query(
            "SELECT COUNT(*) as cnt FROM {$this->table} 
             WHERE reportable_type = :type AND reportable_id = :id AND status = :status",
            ['type' => $type, 'id' => $id, 'status' => self::STATUS_PENDING]
        );
        return (int)($result[0]['cnt'] ?? 0);
    }
    
    /**
     * Soft delete report
     */
    public function deleteReport(int $reportId, int $adminId): bool {
        return $this->updateReportStatus($reportId, self::STATUS_REJECTED, $adminId, 'Xóa bởi admin');
    }
}