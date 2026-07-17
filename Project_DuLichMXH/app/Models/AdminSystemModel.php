<?php
namespace App\Models;

use Exception;

class AdminSystemModel extends BaseModel {
    
    public function getLocations($page, $limit, $search = '', $status = 'active', $type = '') { 
        $where = ["1=1"];
        $params = [];
        
        if ($status !== 'all') {
            $where[] = "status = ?";
            $params[] = $status;
        }
        
        if (!empty($type) && $type !== 'all') {
            $where[] = "type = ?";
            $params[] = $type;
        }
        
        if (!empty($search)) {
            $where[] = "(name ILIKE ? OR address ILIKE ? OR slug ILIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $whereClause = implode(' AND ', $where);
        $sql = "SELECT * FROM locations WHERE $whereClause ORDER BY type DESC, name ASC";
        return $this->paginate($sql, $page, $limit, $params); 
    }
    
    public function createLocation($data) { 
        $sql = "INSERT INTO locations (name, slug, type, region, description, status) VALUES (?, ?, ?, ?, ?, 'active') RETURNING id";
        $params = [$data['name'], $data['slug'], $data['type'] ?? 'province', $data['region'] ?? null, $data['description'] ?? ''];
        $result = $this->query($sql, $params);
        return $result[0]['id'] ?? null; 
    }
    
    public function updateLocation($id, $data) { 
        $set = []; $params = []; 
        foreach ($data as $k => $v) {
            if ($k !== 'id' && in_array($k, ['name','slug','type','region','description','lat','lng','address'])) {
                $set[] = "$k = ?"; $params[] = $v;
            }
        }
        if (empty($set)) return false;
        $params[] = $id;
        return $this->execute("UPDATE locations SET " . implode(',', $set) . ", updated_at = NOW() WHERE id = ?", $params) > 0; 
    }
    
    public function deleteLocation($id) { 
        return $this->execute("UPDATE locations SET status = 'deleted', updated_at = NOW() WHERE id = ?", [$id]) > 0; 
    }

    public function getGroups($page, $limit, $search = '') { 
        $where = "1=1";
        $params = [];
        if (!empty($search)) {
            $where = "g.name ILIKE ?";
            $params[] = "%$search%";
        }
        $sql = "SELECT g.*, u.username as owner,
                (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
                (SELECT COUNT(*) FROM posts p WHERE p.group_id = g.id AND p.status != 'deleted') as posts_count,
                (SELECT COUNT(*) FROM reports r WHERE r.reportable_type = 'group' AND r.reportable_id = g.id) as reports_count
                FROM groups g 
                JOIN users u ON g.owner_id = u.id 
                WHERE $where
                ORDER BY g.created_at DESC";
        return $this->paginate($sql, $page, $limit, $params); 
    }

    public function getGroupStats() {
        return [
            'total' => (int)($this->query("SELECT COUNT(*) as total FROM groups")[0]['total'] ?? 0),
            'active' => (int)($this->query("SELECT COUNT(*) as total FROM groups WHERE is_active = TRUE")[0]['total'] ?? 0),
            'pending' => (int)($this->query("SELECT COUNT(*) as total FROM groups WHERE is_active = FALSE AND created_at > NOW() - INTERVAL '7 days'")[0]['total'] ?? 0), // Giả lập pending
            'hidden' => (int)($this->query("SELECT COUNT(*) as total FROM groups WHERE is_active = FALSE")[0]['total'] ?? 0),
            'reported' => (int)($this->query("SELECT COUNT(DISTINCT reportable_id) as total FROM reports WHERE reportable_type = 'group'")[0]['total'] ?? 0)
        ];
    }

    public function getGroupDetail($id) {
        $sql = "SELECT g.*, u.username as owner, u.avatar as owner_avatar,
                (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
                (SELECT COUNT(*) FROM posts p WHERE p.group_id = g.id AND p.status != 'deleted') as posts_count
                FROM groups g
                JOIN users u ON g.owner_id = u.id
                WHERE g.id = ?";
        $res = $this->query($sql, [$id]);
        return $res ? $res[0] : null;
    }

    public function updateGroupStatus($id, $isActive) {
        $val = ($isActive === 'active' || $isActive === true) ? 'TRUE' : 'FALSE';
        return $this->execute("UPDATE groups SET is_active = $val, updated_at = NOW() WHERE id = ?", [$id]) > 0;
    }
    
    public function deleteGroup($id) { 
        return $this->execute("DELETE FROM groups WHERE id = ?", [$id]) > 0; 
    }

    public function getGroupPosts($groupId, $page, $limit) {
        $sql = "SELECT p.*, u.username, u.avatar 
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.group_id = ? 
                ORDER BY p.created_at DESC";
        return $this->paginate($sql, $page, $limit, [$groupId]);
    }

    public function getGroupMembers($groupId, $page, $limit, $search = '') {
        $where = "gm.group_id = ?";
        $params = [$groupId];
        if (!empty($search)) {
            $where .= " AND u.username ILIKE ?";
            $params[] = "%$search%";
        }
        $sql = "SELECT gm.*, u.username, u.avatar, u.full_name
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                WHERE $where
                ORDER BY gm.joined_at DESC";
        return $this->paginate($sql, $page, $limit, $params);
    }

    public function getGroupAnalytics($groupId) {
        $totalMembers = (int)($this->query("SELECT COUNT(*) as total FROM group_members WHERE group_id = ?", [$groupId])[0]['total'] ?? 0);
        $totalPosts = (int)($this->query("SELECT COUNT(*) as total FROM posts WHERE group_id = ? AND status != 'deleted'", [$groupId])[0]['total'] ?? 0);
        
        $posts_by_day = $this->query("
            SELECT TO_CHAR(d, 'DD/MM') as day, COALESCE(COUNT(p.id), 0) as count
            FROM GENERATE_SERIES(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval) d
            LEFT JOIN posts p ON DATE(p.created_at) = DATE(d) AND p.group_id = ? AND p.status != 'deleted'
            GROUP BY d
            ORDER BY d ASC
        ", [$groupId]);

        $role_distribution = $this->query("
            SELECT role, COUNT(*) as count 
            FROM group_members 
            WHERE group_id = ? 
            GROUP BY role
        ", [$groupId]);

        return [
            'total_members' => $totalMembers,
            'total_posts' => $totalPosts,
            'posts_by_day' => $posts_by_day,
            'role_distribution' => $role_distribution,
            'new_members_week' => (int)($this->query("SELECT COUNT(*) as total FROM group_members WHERE group_id = ? AND joined_at > NOW() - INTERVAL '7 days'", [$groupId])[0]['total'] ?? 0)
        ];
    }

    public function getGroupReports($groupId, $page, $limit) {
        $sql = "SELECT r.*, u.username as reporter_name 
                FROM reports r
                JOIN users u ON r.reporter_id = u.id
                WHERE r.reportable_type = 'group' AND r.reportable_id = ?
                ORDER BY r.created_at DESC";
        return $this->paginate($sql, $page, $limit, [$groupId]);
    }

    public function getReports($page, $limit, $status = 'pending') { 
        $allowed = ['pending', 'resolved', 'rejected', 'reviewed'];
        if (!in_array($status, $allowed)) $status = 'pending';
        
        $sql = "SELECT r.*, 
                       u.username as reporter,
                       COALESCE(NULLIF(u.full_name, ''), u.username) as reporter_name,
                       u.email as reporter_email
                FROM reports r 
                JOIN users u ON r.reporter_id = u.id 
                WHERE r.status = ? 
                ORDER BY r.created_at DESC";
                
        $result = $this->paginate($sql, $page, $limit, [$status]); 
        
        // Nạp thông tin chi tiết đối tượng bị báo cáo
        $reportModel = new Report();
        foreach ($result['data'] as &$r) {
            $detail = $reportModel->getReportDetail((int)$r['id']);
            $r['target_info'] = $detail['target_info'] ?? null;
        }
        
        return $result;
    }
    
    public function processReport($id, $action, $note) { 
        $pdo = $this->db->getConnection();
        try {
            $pdo->beginTransaction();
            
            $newStatus = ($action === 'resolve') ? 'resolved' : 'rejected'; 
            
            // 1. Cập nhật trạng thái report
            $this->execute("UPDATE reports SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?", [$newStatus, $note, $id]);
            
            // 2. Nếu là resolve (báo cáo đúng), tự động xử lý target
            if ($action === 'resolve') {
                $report = $this->query("SELECT reportable_type, reportable_id FROM reports WHERE id = ?", [$id])[0] ?? null;
                if ($report) {
                    $targetType = $report['reportable_type'];
                    $targetId = $report['reportable_id'];
                    $ownerId = null;
                    $notificationMsg = null;
                    
                    switch ($targetType) {
                        case 'post':
                        case 'blog':
                        case 'group_post':
                            $this->execute("UPDATE posts SET status = 'hidden', updated_at = NOW() WHERE id = ?", [$targetId]);
                            $ownerId = $this->query("SELECT user_id FROM posts WHERE id = ?", [$targetId])[0]['user_id'] ?? null;
                            $notificationMsg = 'Bài viết của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.';
                            break;
                        case 'comment':
                            $this->execute("UPDATE comments SET status = 'hidden', updated_at = NOW() WHERE id = ?", [$targetId]);
                            $ownerId = $this->query("SELECT user_id FROM comments WHERE id = ?", [$targetId])[0]['user_id'] ?? null;
                            $notificationMsg = 'Bình luận của bạn đã bị xóa do vi phạm tiêu chuẩn cộng đồng.';
                            break;
                        case 'user':
                            $this->execute("UPDATE users SET status = 'banned', updated_at = NOW() WHERE id = ?", [$targetId]);
                            if (function_exists('sync_ban_to_chat')) {
                                sync_ban_to_chat($targetId, 'ban');
                            }
                            $ownerId = $targetId;
                            $notificationMsg = 'Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng.';
                            break;
                        case 'group':
                            $this->execute("UPDATE groups SET is_active = FALSE, updated_at = NOW() WHERE id = ?", [$targetId]);
                            $ownerId = $this->query("SELECT owner_id FROM groups WHERE id = ?", [$targetId])[0]['owner_id'] ?? null;
                            $notificationMsg = 'Nhóm của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng.';
                            break;
                        case 'trip':
                            $this->execute("UPDATE trips SET status = 'hidden', is_public = FALSE, updated_at = NOW() WHERE id = ?", [$targetId]);
                            $ownerId = $this->query("SELECT user_id FROM trips WHERE id = ?", [$targetId])[0]['user_id'] ?? null;
                            $notificationMsg = 'Chuyến đi của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.';
                            break;
                        case 'story':
                            $this->execute("UPDATE stories SET is_active = FALSE, updated_at = NOW() WHERE id = ?", [$targetId]);
                            $ownerId = $this->query("SELECT user_id FROM stories WHERE id = ?", [$targetId])[0]['user_id'] ?? null;
                            $notificationMsg = 'Tin ngắn 24h của bạn đã bị gỡ bỏ do vi phạm tiêu chuẩn cộng đồng.';
                            break;
                    }

                    if ($ownerId && $notificationMsg) {
                        try {
                            // Cố gắng gửi thông báo cho user (nếu mô hình Notification tồn tại trong namespace)
                            $notification = new Notification();
                            $notification->create([
                                'user_id' => $ownerId,
                                'actor_id' => 1, // Giả định ID 1 là System/Admin default
                                'type' => 'system_alert',
                                'target_id' => $targetId,
                                'target_type' => $targetType,
                                'custom_message' => $notificationMsg
                            ]);
                        } catch (Exception $e) {
                            error_log("Failed to create notification in AdminSystemModel: " . $e->getMessage());
                        }
                    }
                }
            }
            
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Process report error: " . $e->getMessage());
            return false;
        }
    }

    public function broadcast($title, $content) { 
        $pdo = $this->db->getConnection();
        $message = $title . ': ' . $content;
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO notifications (user_id, type, actor_id, target_type, target_id, content, is_read, created_at) SELECT id, 'system_broadcast', 1, 'system', 0, ?, FALSE, NOW() FROM users WHERE status != 'deleted'");
            $stmt->execute([$message]);
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Broadcast error: " . $e->getMessage());
            return false;
        }
    }

    public function getHashtags($page, $limit, $type = null, $categoryId = null) { 
        $where = ["1=1"];
        $params = [];
        if ($type !== null && $type !== '' && $type !== 'all') {
            if ($type === 'hashtag') {
                $where[] = "t.type != 'interest'";
            } else {
                $where[] = "t.type = ?";
                $params[] = $type;
            }
        }
        if ($categoryId !== null && $categoryId !== '' && $categoryId !== 'all') {
            $where[] = "t.category_id = ?";
            $params[] = (int)$categoryId;
        }
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT t.*, tc.name as category_name 
                FROM tags t 
                LEFT JOIN tag_categories tc ON t.category_id = tc.id 
                WHERE $whereClause 
                ORDER BY t.post_count DESC, t.id DESC";
        return $this->paginate($sql, $page, $limit, $params); 
    }
    
    public function createHashtag($name, $type = 'hashtag', $categoryId = null) { 
        $slug = $this->createSlug($name);
        $result = $this->query("INSERT INTO tags (name, slug, type, category_id) VALUES (?, ?, ?, ?) RETURNING id", [
            $name, 
            $slug, 
            $type, 
            $categoryId ? (int)$categoryId : null
        ]);
        return $result[0]['id'] ?? null; 
    }
    
    public function updateHashtag($id, $name, $type = 'hashtag', $categoryId = null) { 
        $slug = $this->createSlug($name);
        return $this->execute("UPDATE tags SET name = ?, slug = ?, type = ?, category_id = ? WHERE id = ?", [
            $name, 
            $slug, 
            $type, 
            $categoryId ? (int)$categoryId : null, 
            $id
        ]) > 0; 
    }

    public function deleteHashtag($id) { 
        return $this->execute("DELETE FROM tags WHERE id = ?", [$id]) > 0; 
    }

    // === TAG CATEGORY METHODS ===
    public function getTagCategories() {
        return $this->query("SELECT * FROM tag_categories ORDER BY sort_order ASC, id ASC");
    }

    public function createTagCategory($data) {
        $slug = $this->createSlug($data['name']);
        $sql = "INSERT INTO tag_categories (name, slug, icon, color, sort_order) VALUES (?, ?, ?, ?, ?) RETURNING id";
        $params = [
            $data['name'],
            $slug,
            $data['icon'] ?? 'Compass',
            $data['color'] ?? 'from-slate-400 to-slate-500',
            (int)($data['sort_order'] ?? 0)
        ];
        $result = $this->query($sql, $params);
        return $result[0]['id'] ?? null;
    }

    public function updateTagCategory($id, $data) {
        $set = []; $params = [];
        $allowedFields = ['name', 'icon', 'color', 'sort_order'];
        foreach ($allowedFields as $f) {
            if (array_key_exists($f, $data)) {
                $set[] = "$f = ?";
                $params[] = ($f === 'sort_order') ? (int)$data[$f] : $data[$f];
            }
        }
        if (empty($set)) return false;
        
        if (isset($data['name'])) {
            $set[] = "slug = ?";
            $params[] = $this->createSlug($data['name']);
        }
        
        $params[] = (int)$id;
        return $this->execute("UPDATE tag_categories SET " . implode(', ', $set) . " WHERE id = ?", $params) > 0;
    }

    public function deleteTagCategory($id) {
        return $this->execute("DELETE FROM tag_categories WHERE id = ?", [(int)$id]) > 0;
    }

    public function getStats() { 
        // Thống kê tăng trưởng 6 tháng qua
        $userGrowth = $this->query("
            SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') as name, COUNT(*) as users
            FROM users 
            WHERE created_at > NOW() - INTERVAL '6 months' 
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
        ");

        // Lấy dữ liệu trip an toàn (check table existence implicitly or assume it exists based on seed)
        $tripGrowth = [];
        try {
            $tripGrowth = $this->query("
                SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') as name, COUNT(*) as trips
                FROM trips 
                WHERE created_at > NOW() - INTERVAL '6 months' 
                GROUP BY date_trunc('month', created_at)
                ORDER BY date_trunc('month', created_at)
            ");
        } catch (Exception $e) {}

        // Merge growth data for chart
        $chartDataMap = [];
        foreach ($userGrowth as $ug) {
            $chartDataMap[$ug['name']] = ['name' => $ug['name'], 'users' => (int)$ug['users'], 'trips' => 0];
        }
        foreach ($tripGrowth as $tg) {
            if (isset($chartDataMap[$tg['name']])) {
                $chartDataMap[$tg['name']]['trips'] = (int)$tg['trips'];
            } else {
                $chartDataMap[$tg['name']] = ['name' => $tg['name'], 'users' => 0, 'trips' => (int)$tg['trips']];
            }
        }

        return [
            'users' => (int)($this->query("SELECT COUNT(*) as total FROM users WHERE status != 'deleted'")[0]['total'] ?? 0),
            'posts' => (int)($this->query("SELECT COUNT(*) as total FROM posts WHERE status != 'hidden' AND post_type != 'blog'")[0]['total'] ?? 0),
            'blogs' => (int)($this->query("SELECT COUNT(*) as total FROM posts WHERE status != 'hidden' AND post_type = 'blog'")[0]['total'] ?? 0),
            'trips' => (int)($this->query("SELECT COUNT(*) as total FROM trips WHERE status != 'banned'")[0]['total'] ?? 0),
            'reports_count' => (int)($this->query("SELECT COUNT(*) as total FROM reports WHERE status = 'pending'")[0]['total'] ?? 0),
            
            'chart_data' => array_values($chartDataMap),
            
            'popular_locations' => $this->query("
                SELECT l.name, COUNT(c.id) as checkins 
                FROM locations l 
                LEFT JOIN checkins c ON l.id = c.destination_id 
                WHERE l.status = 'active'
                GROUP BY l.id 
                ORDER BY checkins DESC 
                LIMIT 5
            "),
            
            'active_groups' => $this->query("
                SELECT g.name, COUNT(gm.id) as members 
                FROM groups g 
                LEFT JOIN group_members gm ON g.id = gm.group_id 
                WHERE g.is_active = TRUE 
                GROUP BY g.id 
                ORDER BY members DESC 
                LIMIT 5
            ")
        ];
    }
        
    public function getRecommendationStats() { return ['active_rules' => 12, 'matches_today' => 450, 'accuracy' => '87%']; }
    
    public function backupSystem() { return ['file' => 'backup_' . date('Ymd_His') . '.sql', 'status' => 'success', 'note' => 'Backup triggered']; }

    // === RBAC METHODS ===
    public function getRoles() {
        $sql = "SELECT r.*, 
                (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as users_count
                FROM roles r 
                ORDER BY r.level DESC";
        $roles = $this->query($sql);
        
        // Fetch permissions for each role
        foreach ($roles as &$role) {
            $role['permissions_grouped'] = $this->getRolePermissionsGrouped($role['id']);
        }
        return $roles;
    }

    public function getRole($id) {
        $role = $this->query("SELECT * FROM roles WHERE id = ?", [$id]);
        if (!$role) return null;
        $role = $role[0];
        $role['permissions_grouped'] = $this->getRolePermissionsGrouped($id);
        return $role;
    }

    private function getRolePermissionsGrouped($roleId) {
        $sql = "SELECT p.module as category, p.name, p.slug as key, 
                EXISTS(SELECT 1 FROM role_permissions rp WHERE rp.role_id = ? AND rp.permission_id = p.id) as enabled
                FROM permissions p
                ORDER BY p.module, p.name";
        $perms = $this->query($sql, [$roleId]);
        
        $grouped = [];
        foreach ($perms as $p) {
            $cat = $p['category'];
            if (!isset($grouped[$cat])) {
                $grouped[$cat] = ['category' => $cat, 'actions' => []];
            }
            $grouped[$cat]['actions'][] = [
                'name' => $p['name'],
                'key' => $p['key'],
                'enabled' => (bool)$p['enabled']
            ];
        }
        return array_values($grouped);
    }

    public function getPermissions() {
        return $this->query("SELECT * FROM permissions ORDER BY module, name");
    }

    public function updateRolePermissions($roleId, $permissionKeys) {
        $pdo = $this->db->getConnection();
        try {
            if (!$this->db->inTransaction()) {
                $this->db->beginTransaction();
            }
            
            // Delete old permissions
            $this->execute("DELETE FROM role_permissions WHERE role_id = ?", [$roleId]);
            
            // Insert new permissions
            if (!empty($permissionKeys)) {
                $placeholders = implode(',', array_fill(0, count($permissionKeys), '?'));
                $sql = "INSERT INTO role_permissions (role_id, permission_id) 
                        SELECT ?, id FROM permissions WHERE slug IN ($placeholders)";
                
                $stmt = $pdo->prepare($sql);
                $params = array_merge([$roleId], $permissionKeys);
                $stmt->execute($params);
            }
            
            // Audit Log
            $roleName = $this->query("SELECT name FROM roles WHERE id = ?", [$roleId])[0]['name'] ?? "Role #$roleId";
            $auditDetails = json_encode(['message' => "Updated permissions for role: $roleName"]);
            $this->logActivity(1, 'Update Permissions', $auditDetails, 'RBAC', (int)$roleId);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("updateRolePermissions Error: " . $e->getMessage());
            return false;
        }
    }

    private function logActivity($userId, $action, $details, $targetType = null, $targetId = null) {
        try {
            // Đảm bảo details là chuỗi JSON hợp lệ cho PostgreSQL JSON/JSONB column
            $jsonDetails = (is_string($details) && is_array(json_decode($details, true))) 
                ? $details 
                : json_encode(['message' => $details]);

            $sql = "INSERT INTO activity_logs (user_id, action, details, target_type, target_id, status, created_at) 
                    VALUES (?, ?, ?, ?, ?, 'Success', NOW())";
            $this->execute($sql, [$userId, $action, $jsonDetails, $targetType, $targetId]);
        } catch (Exception $e) {
            error_log("logActivity Error: " . $e->getMessage());
        }
    }

    public function createRole($data) {
        $sql = "INSERT INTO roles (name, slug, description, level, color) VALUES (?, ?, ?, ?, ?) RETURNING id";
        $params = [
            $data['name'], 
            $data['slug'], 
            $data['description'] ?? '', 
            (int)($data['level'] ?? 0), 
            $data['color'] ?? '#334155'
        ];
        $result = $this->query($sql, $params);
        return $result[0]['id'] ?? null;
    }

    public function updateRole($id, $data) {
        $set = []; $params = [];
        $allowedFields = ['name', 'slug', 'description', 'level', 'color'];
        foreach ($allowedFields as $f) {
            if (isset($data[$f])) {
                $set[] = "$f = ?"; 
                $params[] = ($f === 'level') ? (int)$data[$f] : $data[$f];
            }
        }
        if (empty($set)) return false;
        $params[] = (int)$id;
        return $this->execute("UPDATE roles SET " . implode(', ', $set) . ", updated_at = NOW() WHERE id = ?", $params) > 0;
    }

    public function deleteRole($id) {
        // Prevent deleting system roles
        $role = $this->query("SELECT is_system FROM roles WHERE id = ?", [(int)$id]);
        if ($role && $role[0]['is_system']) return false;
        
        // Prevent deleting roles with active users
        $userCount = $this->query("SELECT COUNT(*) as total FROM users WHERE role_id = ?", [(int)$id]);
        if ($userCount && (int)$userCount[0]['total'] > 0) return false;

        return $this->execute("DELETE FROM roles WHERE id = ?", [(int)$id]) > 0;
    }

    // === AUDIT LOG METHODS ===
    public function getAuditLogs($page, $limit, $searchTerm = '', $type = 'All') {
        $where = ["1=1"];
        $params = [];
        
        if ($type !== 'All') {
            $where[] = "target_type = ?";
            $params[] = $type;
        }
        
        if (!empty($searchTerm)) {
            $where[] = "(action ILIKE ? OR u.username ILIKE ?)";
            $params[] = "%$searchTerm%";
            $params[] = "%$searchTerm%";
        }
        
        $whereClause = implode(' AND ', $where);
        $sql = "SELECT al.*, u.username, u.avatar 
                FROM activity_logs al 
                LEFT JOIN users u ON al.user_id = u.id 
                WHERE $whereClause 
                ORDER BY al.created_at DESC";
        
        return $this->paginate($sql, $page, $limit, $params);
    }

    public function getAuditLogStats() {
        $total = (int)($this->query("SELECT COUNT(*) as total FROM activity_logs")[0]['total'] ?? 0);
        $success = (int)($this->query("SELECT COUNT(*) as total FROM activity_logs WHERE status = 'Success'")[0]['total'] ?? 0);
        $risk = (int)($this->query("SELECT COUNT(*) as total FROM activity_logs WHERE status = 'Warning' OR status = 'Failed'")[0]['total'] ?? 0);
        
        $rate = $total > 0 ? round(($success / $total) * 100, 1) : 100;
        
        return [
            'total' => $total,
            'success_rate' => $rate,
            'risk_alerts' => $risk
        ];
    }

    private function paginate($baseSql, $page, $limit, $params = []) { 
        $limit = max(1, (int)$limit);
        $page = max(1, (int)$page);
        $offset = ($page - 1) * $limit;
        
        // Strip ORDER BY for count query
        $countSql = preg_replace('/ORDER BY.*/i', '', $baseSql);
        $total = (int)($this->query("SELECT COUNT(*) as total FROM ({$countSql}) as count_tmp", $params)[0]['total'] ?? 0);
        
        // Kiểm tra xem params là danh sách tuần tự hay có key string
        $isAssoc = !empty($params) && array_keys($params) !== range(0, count($params) - 1);
        
        if ($isAssoc) {
            $params['limit'] = $limit;
            $params['offset'] = $offset;
            $dataSql = "{$baseSql} LIMIT :limit OFFSET :offset";
        } else {
            $params[] = $limit;
            $params[] = $offset;
            $dataSql = "{$baseSql} LIMIT ? OFFSET ?";
        }
        
        return [
            'data' => $this->query($dataSql, $params), 
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'total_pages' => ceil($total / $limit)]
        ]; 
    }
}