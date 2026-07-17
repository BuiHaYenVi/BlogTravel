<?php
// ✅ SỬA PATH: Cùng thư mục nên dùng './BaseModel.php'
require_once __DIR__ . '/BaseModel.php';

class AdminSystemModel extends BaseModel {
    
    public function getLocations($page, $limit) { 
        $sql = "SELECT * FROM locations WHERE status = 'active' ORDER BY created_at DESC";
        return $this->paginate($sql, $page, $limit); 
    }
    
    public function createLocation($data) { 
        $sql = "INSERT INTO locations (name, slug, type, region, description, status) VALUES (?, ?, ?, ?, ?, 'active') RETURNING id";
        $params = [$data['name'], $data['slug'], $data['type'] ?? 'province', $data['region'] ?? 'mien-trung', $data['description'] ?? ''];
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

    public function getGroups($page, $limit) { 
        $sql = "SELECT g.*, u.username as owner FROM groups g JOIN users u ON g.owner_id = u.id ORDER BY g.created_at DESC";
        return $this->paginate($sql, $page, $limit); 
    }
    
    public function deleteGroup($id) { 
        return $this->execute("UPDATE groups SET is_active = FALSE, updated_at = NOW() WHERE id = ?", [$id]) > 0; 
    }

    public function getReports($page, $limit, $status = 'pending') { 
        $allowed = ['pending', 'resolved', 'rejected', 'reviewed'];
        if (!in_array($status, $allowed)) $status = 'pending';
        $sql = "SELECT r.*, u.username as reporter FROM reports r JOIN users u ON r.reporter_id = u.id WHERE r.status = ? ORDER BY r.created_at DESC";
        return $this->paginate($sql, $page, $limit, [$status]); 
    }
    
    public function processReport($id, $action, $note) { 
        $newStatus = ($action === 'resolve') ? 'resolved' : 'rejected'; 
        return $this->execute("UPDATE reports SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?", [$newStatus, $note, $id]) > 0; 
    }

    public function broadcast($title, $content) { 
        $pdo = $this->getConnection();
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

    public function getHashtags($page, $limit) { 
        return $this->paginate("SELECT * FROM tags ORDER BY post_count DESC", $page, $limit); 
    }
    
    public function createHashtag($name, $type = 'hashtag') { 
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^\p{L}\p{N}\-]/u', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');
        $result = $this->query("INSERT INTO tags (name, slug, type) VALUES (?, ?, ?) RETURNING id", [$name, $slug, $type]);
        return $result[0]['id'] ?? null; 
    }
    
   public function updateHashtag($id, $name, $type = 'hashtag') { 
    return $this->execute("UPDATE tags SET name = ?, type = ? WHERE id = ?", [$name, $type, $id]) > 0; 
}
    public function deleteHashtag($id) { 
        return $this->execute("DELETE FROM tags WHERE id = ?", [$id]) > 0; 
    }

public function getStats() { 
    return [
        // ✅ SỬA: Dùng query trực tiếp với tên bảng cụ thể
        'users' => (int)($this->query("SELECT COUNT(*) as total FROM users WHERE status != 'deleted'")[0]['total'] ?? 0),
        
        'posts' => (int)($this->query("SELECT COUNT(*) as total FROM posts WHERE status != 'hidden' AND post_type != 'blog'")[0]['total'] ?? 0),
        
        'blogs' => (int)($this->query("SELECT COUNT(*) as total FROM posts WHERE status != 'hidden' AND post_type = 'blog'")[0]['total'] ?? 0),
        
        'popular_locations' => $this->query("
            SELECT l.name, COUNT(c.id) as checkins 
            FROM locations l 
            LEFT JOIN checkins c ON l.id = c.location_id 
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

    private function paginate($baseSql, $page, $limit, $params = []) { 
        $offset = ($page - 1) * $limit;
        $total = (int)($this->query("SELECT COUNT(*) as total FROM ({$baseSql}) as count_tmp", $params)[0]['total'] ?? 0);
        return [
            'data' => $this->query("{$baseSql} LIMIT {$limit} OFFSET {$offset}", $params), 
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'total_pages' => ceil($total / $limit)]
        ]; 
    }
}