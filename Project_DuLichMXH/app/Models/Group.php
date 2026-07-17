<?php
namespace App\Models;

use Exception;

class Group extends BaseModel {
    protected $table = 'groups';

    public function create($data) {
        try {
            $slug = $this->createSlug($data['name']);
            $checkSlug = $this->query("SELECT id FROM groups WHERE slug = :slug LIMIT 1", ['slug' => $slug]);
            if (!empty($checkSlug)) {
                $slug = $slug . '-' . substr(uniqid(), -5);
            }

            $sql = "INSERT INTO groups (name, slug, owner_id, category, description, cover_image, is_private, created_at) 
                    VALUES (:name, :slug, :owner_id, :category, :description, :cover_image, :is_private, NOW()) 
                    RETURNING id";
            
            $params = [
                'name'        => $data['name'],
                'slug'        => $slug,
                'owner_id'    => $data['owner_id'] ?? $data['creator_id'],
                'category'    => $data['category'] ?? 'General',
                'description' => $data['description'] ?? '',
                'cover_image' => $data['cover_image'] ?? null,
                'is_private'  => isset($data['is_private']) ? (bool)$data['is_private'] : false
            ];
            
            $result = $this->query($sql, $params);
            $groupId = $result[0]['id'] ?? null;
            
            if ($groupId) {
                $this->addMember($groupId, $params['owner_id'], 'owner');
                return ['id' => $groupId];
            }
            return ['id' => null, 'error' => 'Database insert failed'];
        } catch (Exception $e) {
            return ['id' => null, 'error' => $e->getMessage()];
        }
    }

    public function addMember($groupId, $userId, $role = 'member', $status = 'accepted', $invitedById = null) {
        try {
            $sql = "INSERT INTO group_members (group_id, user_id, role, status, invited_by_id, joined_at) 
                    VALUES (:group_id, :user_id, :role, :status, :invited_by_id, NOW())
                    ON CONFLICT (group_id, user_id) 
                    DO UPDATE SET status = EXCLUDED.status, role = EXCLUDED.role, invited_by_id = EXCLUDED.invited_by_id";
            return $this->execute($sql, [
                'group_id' => (int)$groupId, 
                'user_id' => (int)$userId, 
                'role' => $role,
                'status' => $status,
                'invited_by_id' => $invitedById
            ]);
        } catch (Exception $e) { 
            error_log("Group::addMember Error: " . $e->getMessage());
            return false; 
        }
    }

    public function getJoinRequests($groupId) {
        $sql = "SELECT u.id, u.username, u.avatar, u.email, gm.status, gm.joined_at as requested_at
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.group_id = :group_id AND gm.status = 'pending'
                ORDER BY gm.joined_at DESC";
        return $this->query($sql, ['group_id' => (int)$groupId]);
    }

    public function updateMemberStatus($groupId, $userId, $status) {
        $sql = "UPDATE group_members SET status = :status, joined_at = NOW() 
                WHERE group_id = :group_id AND user_id = :user_id";
        return $this->execute($sql, [
            'status' => $status,
            'group_id' => (int)$groupId,
            'user_id' => (int)$userId
        ]);
    }

    public function removeMember($groupId, $userId) {
        try {
            $sql = "DELETE FROM group_members WHERE group_id = :group_id AND user_id = :user_id AND role != 'owner'";
            return $this->execute($sql, ['group_id' => $groupId, 'user_id' => $userId]);
        } catch (Exception $e) { return false; }
    }

    public function getAll($currentUserId = null, $filters = []) {
        try {
            $conditions = [];
            $params = [];
            
            if ($currentUserId) {
                $params['current_user_id'] = $currentUserId;
            }

            if (!empty($filters['search'])) {
                $conditions[] = "g.name ILIKE :search";
                $params['search'] = "%" . $filters['search'] . "%";
            }

            if (!empty($filters['category']) && strtolower($filters['category']) !== 'all') {
                $conditions[] = "g.category ILIKE :category";
                $params['category'] = $filters['category'];
            }

            $whereClause = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

            $sql = "SELECT g.*, u.username as owner_name, u.avatar as owner_avatar,
                           (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'accepted') as actual_member_count" .
                           ($currentUserId ? ", (SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = :current_user_id AND status = 'accepted')) as is_joined,
                                              (SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = :current_user_id AND status = 'pending')) as is_pending" : ", false as is_joined, false as is_pending") .
                    " FROM groups g LEFT JOIN users u ON g.owner_id = u.id 
                    $whereClause 
                    ORDER BY g.created_at DESC";
                    
            return $this->query($sql, $params);
        } catch (Exception $e) { 
            error_log("Group::getAll Error: " . $e->getMessage());
            return []; 
        }
    }

    public function findById($id, $currentUserId = null) {
        try {
            $sql = "SELECT g.*, u.username as owner_name, u.avatar as owner_avatar,
                           (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'accepted') as actual_member_count" .
                           ($currentUserId ? ", (SELECT u2.username FROM group_members gm2 JOIN users u2 ON gm2.invited_by_id = u2.id WHERE gm2.group_id = g.id AND gm2.user_id = :current_user_id AND gm2.status = 'invited' LIMIT 1) as inviter_name" : ", NULL as inviter_name") .
                           ($currentUserId ? ", (SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = :current_user_id AND status = 'accepted')) as is_joined,
                                              (SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = :current_user_id AND status = 'invited')) as is_invited,
                                              (SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = :current_user_id AND status = 'pending')) as is_pending" : ", false as is_joined, false as is_invited, false as is_pending") .
                    " FROM groups g LEFT JOIN users u ON g.owner_id = u.id WHERE g.id = :id";
            $params = ['id' => $id];
            if ($currentUserId) $params['current_user_id'] = $currentUserId;
            $result = $this->query($sql, $params);
            return $result[0] ?? null;
        } catch (Exception $e) { 
            error_log("Group::findById Error: " . $e->getMessage());
            return null; 
        }
    }

    public function update($id, $data) {
        try {
            if (empty($data)) return false;
            $fields = [];
            $params = ['id' => $id];
            foreach ($data as $key => $value) {
                if ($key === 'id') continue;
                // Ánh xạ creator_id sang owner_id nếu có
                $dbKey = ($key === 'creator_id') ? 'owner_id' : $key;
                $fields[] = "$dbKey = :$key";
                $params[$key] = $value;
            }
            $sql = "UPDATE groups SET " . implode(', ', $fields) . " WHERE id = :id";
            $this->execute($sql, $params);
            return true;
        } catch (Exception $e) { return false; }
    }

    public function delete($id) {
        return $this->execute("DELETE FROM groups WHERE id = :id", ['id' => $id]);
    }

    public function getMembers($groupId) {
        try {
            $sql = "SELECT u.id, u.username, u.avatar, gm.role, gm.joined_at, gm.status
                    FROM group_members gm JOIN users u ON gm.user_id = u.id
                    WHERE gm.group_id = :group_id AND gm.status = 'accepted'
                    ORDER BY CASE WHEN gm.role = 'owner' THEN 1 ELSE 2 END, gm.joined_at ASC";
            return $this->query($sql, ['group_id' => $groupId]);
        } catch (Exception $e) { return []; }
    }

    public function getInvitations($userId) {
        $sql = "SELECT g.*, u.username as inviter_name, u.avatar as inviter_avatar, gm.joined_at as invited_at
                FROM groups g
                JOIN group_members gm ON g.id = gm.group_id
                LEFT JOIN users u ON gm.invited_by_id = u.id
                WHERE gm.user_id = :user_id AND gm.status = 'invited'
                ORDER BY gm.joined_at DESC";
        return $this->query($sql, ['user_id' => $userId]);
    }

    public function checkInvitation($groupId, $userId) {
        $sql = "SELECT 1 FROM group_members WHERE group_id = :group_id AND user_id = :user_id AND status = 'invited'";
        $result = $this->query($sql, ['group_id' => $groupId, 'user_id' => $userId]);
        return !empty($result);
    }

    /**
     * Lấy danh sách nhóm mà user đã tham gia
     */
    public function getUserRole($groupId, $userId) {
        $sql = "SELECT role FROM group_members WHERE group_id = :group_id AND user_id = :user_id AND status = 'accepted'";
        $result = $this->query($sql, ['group_id' => (int)$groupId, 'user_id' => (int)$userId]);
        return $result[0]['role'] ?? null;
    }

    public function updateMemberRole($groupId, $userId, $role) {
        $sql = "UPDATE group_members SET role = :role WHERE group_id = :group_id AND user_id = :user_id";
        return $this->execute($sql, ['role' => $role, 'group_id' => (int)$groupId, 'user_id' => (int)$userId]);
    }

    public function getByUser($userId) {
        $sql = "SELECT g.*, u.username as owner_name, u.avatar as owner_avatar,
                       (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.status = 'accepted') as actual_member_count,
                       gm.role as my_role
                FROM groups g
                JOIN group_members gm ON g.id = gm.group_id
                LEFT JOIN users u ON g.owner_id = u.id
                WHERE gm.user_id = :user_id AND gm.status = 'accepted'
                ORDER BY gm.joined_at DESC";
        return $this->query($sql, ['user_id' => (int)$userId]);
    }
}
?>