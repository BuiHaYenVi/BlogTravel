<?php
namespace App\Models;

use Exception;

class Story extends BaseModel {
    protected $table = 'stories';

    public function __construct() {
        parent::__construct();
        $this->initLikesTable();
    }

    /**
     * Khởi tạo bảng story_likes nếu chưa tồn tại
     */
    private function initLikesTable() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS story_likes (
                id SERIAL PRIMARY KEY,
                story_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_story_likes_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
                CONSTRAINT fk_story_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT uq_story_likes UNIQUE (story_id, user_id)
            )";
            $this->execute($sql);
        } catch (Exception $e) {
            error_log("StoryModel@initLikesTable Error: " . $e->getMessage());
        }
    }

    /**
     * Tạo tin ngắn mới
     * 
     * @param array $data Chứa user_id, media_url, media_type, caption
     * @return int|false ID của story mới tạo
     */
    public function createStory(array $data) {
        try {
            $data['is_active'] = true;
            $data['is_deleted'] = false;
            
            $fields = array_keys($data);
            $placeholders = array_map(fn($f) => ":$f", $fields);
            
            $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ") 
                    VALUES (" . implode(', ', $placeholders) . ") RETURNING id";
            
            $res = $this->query($sql, $data);
            return $res[0]['id'] ?? false;
        } catch (Exception $e) {
            error_log("StoryModel@createStory Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Tìm story theo ID
     */
    public function findById($id) {
        $sql = "SELECT s.*, u.username, u.full_name as creator_name, u.avatar as creator_avatar 
                FROM {$this->table} s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = :id AND s.is_active = TRUE AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)";
        $res = $this->query($sql, ['id' => (int)$id]);
        return $res[0] ?? null;
    }

    /**
     * Lấy danh sách tin ngắn chưa hết hạn của chính mình và những người đang follow
     * 
     * @param int $userId ID người dùng hiện tại
     * @return array Cấu trúc cây grouped by user_id
     */
    public function getActiveFeed(int $userId): array {
        try {
            $sql = "SELECT s.id, s.user_id, s.media_url, s.media_type, s.caption, s.created_at, s.expires_at,
                           u.username, u.full_name, u.avatar,
                           (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as like_count,
                           EXISTS(SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = :user_id) as is_liked
                    FROM {$this->table} s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.is_active = TRUE 
                      AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
                      AND s.expires_at > NOW()
                      AND (s.user_id = :user_id OR s.user_id IN (SELECT following_id FROM follows WHERE follower_id = :user_id))
                    ORDER BY s.user_id, s.created_at ASC";
            
            $rows = $this->query($sql, ['user_id' => $userId]);
            
            // Nhóm dữ liệu theo người dùng để tối ưu việc render phía Frontend
            $grouped = [];
            foreach ($rows as $row) {
                $uid = $row['user_id'];
                if (!isset($grouped[$uid])) {
                    $grouped[$uid] = [
                        'user_id' => (string)$uid,
                        'username' => $row['username'],
                        'full_name' => $row['full_name'] ?: $row['username'],
                        'avatar' => $row['avatar'],
                        'stories' => []
                    ];
                }
                
                $grouped[$uid]['stories'][] = [
                    'id' => (string)$row['id'],
                    'media_url' => $row['media_url'],
                    'media_type' => $row['media_type'],
                    'caption' => $row['caption'],
                    'created_at' => $row['created_at'],
                    'expires_at' => $row['expires_at'],
                    'like_count' => (int)$row['like_count'],
                    'is_liked' => (bool)$row['is_liked']
                ];
            }
            
            // Xếp tin của chính User đăng nhập lên đầu tiên của bảng tin
            $feed = [];
            if (isset($grouped[$userId])) {
                $feed[] = $grouped[$userId];
                unset($grouped[$userId]);
            }
            
            // Thêm các story của người khác vào sau
            foreach ($grouped as $userFeed) {
                $feed[] = $userFeed;
            }
            
            return $feed;
            
        } catch (Exception $e) {
            error_log("StoryModel@getActiveFeed Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy danh sách tin ngắn chưa hết hạn của MỘT người dùng cụ thể
     * 
     * @param int $userId ID người dùng cần lấy story
     * @param int $currentUserId ID người dùng hiện tại đang đăng nhập
     * @return array Danh sách các story
     */
    public function getUserStories(int $userId, int $currentUserId = 0): array {
        try {
            $sql = "SELECT s.id, s.user_id, s.media_url, s.media_type, s.caption, s.created_at, s.expires_at,
                           (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as like_count,
                           EXISTS(SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = :current_user_id) as is_liked
                    FROM {$this->table} s
                    WHERE s.user_id = :user_id 
                      AND s.is_active = TRUE 
                      AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
                      AND s.expires_at > NOW()
                    ORDER BY s.created_at ASC";
            
            $rows = $this->query($sql, [
                'user_id' => $userId, 
                'current_user_id' => $currentUserId ?: $userId
            ]);

            $stories = [];
            foreach ($rows as $row) {
                $stories[] = [
                    'id' => (string)$row['id'],
                    'user_id' => (string)$row['user_id'],
                    'media_url' => $row['media_url'],
                    'media_type' => $row['media_type'],
                    'caption' => $row['caption'],
                    'created_at' => $row['created_at'],
                    'expires_at' => $row['expires_at'],
                    'like_count' => (int)$row['like_count'],
                    'is_liked' => (bool)$row['is_liked']
                ];
            }
            return $stories;
        } catch (Exception $e) {
            error_log("StoryModel@getUserStories Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Thả tim hoặc Bỏ thả tim cho tin ngắn
     */
    public function toggleLike(int $storyId, int $userId): array {
        try {
            $sqlCheck = "SELECT 1 FROM story_likes WHERE story_id = :story_id AND user_id = :user_id";
            $exists = $this->query($sqlCheck, ['story_id' => $storyId, 'user_id' => $userId]);
            
            if ($exists) {
                $sqlDel = "DELETE FROM story_likes WHERE story_id = :story_id AND user_id = :user_id";
                $this->execute($sqlDel, ['story_id' => $storyId, 'user_id' => $userId]);
                $isLiked = false;
            } else {
                $sqlIns = "INSERT INTO story_likes (story_id, user_id) VALUES (:story_id, :user_id)";
                $this->execute($sqlIns, ['story_id' => $storyId, 'user_id' => $userId]);
                $isLiked = true;
            }
            
            $sqlCount = "SELECT COUNT(*) as cnt FROM story_likes WHERE story_id = :story_id";
            $cntRes = $this->query($sqlCount, ['story_id' => $storyId]);
            $likeCount = (int)($cntRes[0]['cnt'] ?? 0);
            
            return [
                'is_liked' => $isLiked,
                'like_count' => $likeCount
            ];
        } catch (Exception $e) {
            error_log("StoryModel@toggleLike Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Lấy toàn bộ kho lưu trữ tin ngắn của người dùng (kể cả đã hết hạn)
     */
    public function getArchive(int $userId): array {
        try {
            $sql = "SELECT s.id, s.user_id, s.media_url, s.media_type, s.caption, s.created_at, s.expires_at,
                           u.username, u.full_name, u.avatar,
                           (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as like_count,
                           EXISTS(SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = :user_id) as is_liked
                    FROM {$this->table} s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.user_id = :user_id AND s.is_active = TRUE AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
                    ORDER BY s.created_at DESC";
            
            $rows = $this->query($sql, ['user_id' => $userId]);
            
            $stories = [];
            foreach ($rows as $row) {
                $stories[] = [
                    'id' => (string)$row['id'],
                    'media_url' => $row['media_url'],
                    'media_type' => $row['media_type'],
                    'caption' => $row['caption'],
                    'created_at' => $row['created_at'],
                    'expires_at' => $row['expires_at'],
                    'like_count' => (int)$row['like_count'],
                    'is_liked' => (bool)$row['is_liked']
                ];
            }
            return $stories;
        } catch (Exception $e) {
            error_log("StoryModel@getArchive Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Xóa mềm tin ngắn
     */
    public function deleteStory(int $id): bool {
        try {
            $sql = "UPDATE {$this->table} SET is_active = FALSE, is_deleted = TRUE WHERE id = :id";
            return $this->execute($sql, ['id' => $id]) > 0;
        } catch (Exception $e) {
            error_log("StoryModel@deleteStory Error: " . $e->getMessage());
            return false;
        }
    }
}
