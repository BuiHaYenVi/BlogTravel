<?php
// ✅ SỬA PATH: Cùng thư mục nên dùng './BaseModel.php'
require_once __DIR__ . '/BaseModel.php';

class AdminUserModel extends BaseModel {
    protected $table = 'users';

    public function getAllPaginated(int $page = 1, int $limit = 20): array {
        $offset = ($page - 1) * $limit;
        
        $totalResult = $this->query("SELECT COUNT(*) as total FROM {$this->table} WHERE status != 'deleted'");
        $total = (int)($totalResult[0]['total'] ?? 0);
        
        $users = $this->query("
            SELECT u.id, u.username, u.email, u.full_name, u.avatar, u.status, u.created_at,
                   r.name as role_name, r.color as role_color
            FROM {$this->table} u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.status != 'deleted'
            ORDER BY u.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ");

        return [
            'data' => $users,
            'pagination' => [
                'total' => $total, 'page' => $page, 'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ]
        ];
    }

    public function findByIdWithDetails(int $id): ?array {
        $result = $this->query("
            SELECT u.*, r.name as role_name, r.slug as role_slug, r.level as role_level
            FROM {$this->table} u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?
        ", [$id]);
        return $result[0] ?? null;
    }

    public function searchByNameOrEmail(string $keyword): array {
        $searchTerm = "%{$keyword}%";
        return $this->query("
            SELECT id, username, email, full_name, status, created_at
            FROM {$this->table}
            WHERE (username ILIKE ? OR email ILIKE ? OR full_name ILIKE ?) AND status != 'deleted'
            LIMIT 50
        ", [$searchTerm, $searchTerm, $searchTerm]);
    }

    public function updateStatus(int $id, string $status): bool {
        $result = $this->execute(
            "UPDATE {$this->table} SET status = ?, updated_at = NOW() WHERE id = ? AND status != 'deleted'",
            [$status, $id]
        );
        return $result > 0;
    }

    public function softDelete(int $id): bool {
        return $this->updateStatus($id, 'deleted');
    }
}