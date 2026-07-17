<?php
namespace App\Models;

class AdminUserModel extends BaseModel {
    protected $table = 'users';

    public function getAllPaginated(int $page = 1, int $limit = 20, $search = '', $status = 'All', $role = 'All'): array {
        $offset = ($page - 1) * $limit;
        
        $where = ["u.status != 'deleted'"];
        $params = [];

        if (!empty($search)) {
            $where[] = "(u.username ILIKE ? OR u.email ILIKE ? OR u.full_name ILIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($status !== 'All') {
            $where[] = "u.status = ?";
            $params[] = strtolower($status);
        }

        if ($role !== 'All') {
            $where[] = "r.name = ?";
            $params[] = $role;
        }

        $whereClause = implode(' AND ', $where);
        
        $totalResult = $this->query("SELECT COUNT(*) as total FROM {$this->table} u LEFT JOIN roles r ON u.role_id = r.id WHERE $whereClause", $params);
        $total = (int)($totalResult[0]['total'] ?? 0);
        
        $users = $this->query("
            SELECT u.id, u.username, u.email, u.full_name, u.avatar, u.status, u.created_at, u.role_id,
                   u.is_verified, u.badge_title,
                   r.name as role_name, r.color as role_color, r.slug as role_slug,
                   (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) as content_count
            FROM {$this->table} u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE $whereClause
            ORDER BY u.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ", $params);

        return [
            'data' => $users,
            'pagination' => [
                'total' => $total, 'page' => $page, 'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ]
        ];
    }

    public function findByIdWithDetails(int $id): ?array {
        $sql = "SELECT u.*, r.name as role_name, r.slug as role_slug, r.level as role_level,
                (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.post_type = 'blog') as blogs_count,
                (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.post_type = 'post') as posts_count,
                (SELECT COUNT(*) FROM group_members gm WHERE gm.user_id = u.id) as groups_count
                FROM {$this->table} u 
                LEFT JOIN roles r ON u.role_id = r.id 
                WHERE u.id = ?";
        $result = $this->query($sql, [$id]);
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
        $userModel = new User();
        return $userModel->softDelete($id);
    }

    public function updateUser(int $id, array $data): bool {
        $allowedFields = ['role_id', 'status', 'badge_title'];
        $sets = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = ?";
                // Normalize empty string to NULL for nullable fields
                $val = $data[$field];
                if ($field === 'badge_title' && $val === '') {
                    $val = null;
                }
                $params[] = $val;
            }
        }
        
        if (empty($sets)) return false;
        
        $params[] = $id;
        $setClause = implode(', ', $sets);
        
        $result = $this->execute(
            "UPDATE {$this->table} SET $setClause, updated_at = NOW() WHERE id = ?",
            $params
        );
        return $result > 0;
    }

    public function getContent(int $userId, int $limit = 10): array {
        $sql = "SELECT 'post' as type, id, content as title, created_at, status, 0 as likes_count 
                FROM posts WHERE user_id = ? AND post_type = 'post'
                UNION ALL
                SELECT 'blog' as type, id, title, created_at, status, like_count as likes_count 
                FROM posts WHERE user_id = ? AND post_type = 'blog'
                ORDER BY created_at DESC LIMIT ?";
        return $this->query($sql, [$userId, $userId, $limit]);
    }

    public function getReports(int $userId): array {
        $sql = "SELECT r.*, u.username as reporter 
                FROM reports r 
                JOIN users u ON r.reporter_id = u.id 
                WHERE r.reportable_type = 'user' AND r.reportable_id = ?
                ORDER BY r.created_at DESC";
        return $this->query($sql, [$userId]);
    }

    public function updateVerification(int $id, bool $isVerified): bool {
        $result = $this->execute(
            "UPDATE {$this->table} SET is_verified = ?, updated_at = NOW() WHERE id = ?",
            [$isVerified, $id]
        );
        return $result > 0;
    }
}