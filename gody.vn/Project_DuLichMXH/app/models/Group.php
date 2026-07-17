<?php
require_once __DIR__ . '/BaseModel.php';

class Group extends BaseModel {
    protected $table = 'groups';

    private function generateSlug($str) {
        $str = preg_replace("/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/", 'a', $str);
        $str = preg_replace("/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/", 'e', $str);
        $str = preg_replace("/(ì|í|ị|ỉ|ĩ)/", 'i', $str);
        $str = preg_replace("/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/", 'o', $str);
        $str = preg_replace("/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/", 'u', $str);
        $str = preg_replace("/(ỳ|ý|ỵ|ỷ|ỹ)/", 'y', $str);
        $str = preg_replace("/(đ)/", 'd', $str);
        $str = preg_replace("/(À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ)/", 'a', $str);
        $str = preg_replace("/(È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ)/", 'e', $str);
        $str = preg_replace("/(Ì|Í|Ị|Ỉ|Ĩ)/", 'i', $str);
        $str = preg_replace("/(Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ)/", 'o', $str);
        $str = preg_replace("/(Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ)/", 'u', $str);
        $str = preg_replace("/(Ỳ|Ý|Ỵ|Ỷ|Ỹ)/", 'y', $str);
        $str = preg_replace("/(Đ)/", 'd', $str);
        $str = preg_replace("/[^a-zA-Z0-9\s-]/", '', $str);
        $str = preg_replace("/[\s-]+/", " ", $str);
        $str = preg_replace("/[\s]/", "-", $str);
        $slug = strtolower(trim($str, '-'));
        return $slug . '-' . substr(uniqid(), -5);
    }

    public function create($data) {
        try {
            $slug = $this->generateSlug($data['name']);
            
            $sql = "INSERT INTO groups (name, slug, creator_id, category, description, cover_image, is_private, created_at) 
                    VALUES (:name, :slug, :creator_id, :category, :description, :cover_image, :is_private, NOW()) 
                    RETURNING id";
            
            $params = [
                'name'        => $data['name'],
                'slug'        => $slug,
                'creator_id'  => $data['creator_id'],
                'category'    => $data['category'] ?? 'General',
                'description' => $data['description'] ?? '',
                'cover_image' => $data['cover_image'] ?? null,
                'is_private'  => isset($data['is_private']) ? (bool)$data['is_private'] : false
            ];
            
            $result = $this->query($sql, $params);
            $groupId = $result[0]['id'] ?? null;
            
            if ($groupId) {
                $this->addMember($groupId, $data['creator_id'], 'owner');
                return ['id' => $groupId];
            }
            return ['id' => null, 'error' => 'Database insert error'];
        } catch (Exception $e) {
            return ['id' => null, 'error' => $e->getMessage()];
        }
    }

    public function delete($id) {
        try {
            return $this->execute("DELETE FROM groups WHERE id = :id", ['id' => $id]);
        } catch (Exception $e) { return false; }
    }

    public function update($id, $data) {
        try {
            $sets = [];
            $params = ['id' => $id];
            foreach ($data as $key => $value) {
                if ($key === 'name') {
                    $params['slug'] = $this->generateSlug($value);
                    $sets[] = "slug = :slug";
                }
                $sets[] = "$key = :$key";
                $params[$key] = $value;
            }
            if (empty($sets)) return false;
            return $this->execute("UPDATE groups SET " . implode(', ', $sets) . " WHERE id = :id", $params);
        } catch (Exception $e) { return false; }
    }

    public function addMember($groupId, $userId, $role = 'member') {
        try {
            $sql = "INSERT INTO group_members (group_id, user_id, role, joined_at) 
                    VALUES (:group_id, :user_id, :role, NOW())
                    ON CONFLICT (group_id, user_id) DO NOTHING";
            return $this->execute($sql, ['group_id' => $groupId, 'user_id' => $userId, 'role' => $role]);
        } catch (Exception $e) { return false; }
    }

    public function removeMember($groupId, $userId) {
        try {
            return $this->execute("DELETE FROM group_members WHERE group_id = :group_id AND user_id = :user_id", ['group_id' => $groupId, 'user_id' => $userId]);
        } catch (Exception $e) { return false; }
    }

    public function getAll($currentUserId = null) {
        try {
            $sql = "SELECT g.*, u.username as owner_name, u.avatar as owner_avatar,
                           (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as actual_member_count" .
                           ($currentUserId ? ", (SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = :current_user_id)) as is_joined" : ", false as is_joined") .
                    " FROM groups g LEFT JOIN users u ON g.creator_id = u.id ORDER BY g.created_at DESC";
            return $this->query($sql, $currentUserId ? ['current_user_id' => $currentUserId] : []);
        } catch (Exception $e) { return []; }
    }

    public function findById($id, $currentUserId = null) {
        try {
            $sql = "SELECT g.*, u.username as owner_name, u.avatar as owner_avatar,
                           (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as actual_member_count" .
                           ($currentUserId ? ", (SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = :current_user_id)) as is_joined" : ", false as is_joined") .
                    " FROM groups g LEFT JOIN users u ON g.creator_id = u.id WHERE g.id = :id";
            $params = ['id' => $id];
            if ($currentUserId) $params['current_user_id'] = $currentUserId;
            $result = $this->query($sql, $params);
            return $result[0] ?? null;
        } catch (Exception $e) { return null; }
    }

    public function getMembers($groupId) {
        try {
            $sql = "SELECT u.id, u.username, u.avatar, gm.role, gm.joined_at
                    FROM group_members gm JOIN users u ON gm.user_id = u.id
                    WHERE gm.group_id = :group_id
                    ORDER BY CASE WHEN gm.role = 'owner' THEN 1 WHEN gm.role = 'admin' THEN 2 ELSE 3 END, gm.joined_at ASC";
            return $this->query($sql, ['group_id' => $groupId]);
        } catch (Exception $e) { return []; }
    }
}
?>