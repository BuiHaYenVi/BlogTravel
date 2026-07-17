<?php
require_once __DIR__ . '/BaseModel.php';

class Follow extends BaseModel {
    protected $table = 'follows';
    
    /**
     * Follow một user
     * @param int $followerId ID người thực hiện follow
     * @param int $followingId ID người được follow
     * @return bool True nếu thành công
     * @throws Exception Nếu đã follow rồi
     */
    public function follow($followerId, $followingId) {
        // Check if already following
        if ($this->isFollowing($followerId, $followingId)) {
            throw new Exception('Already following');
        }
        
        $query = "INSERT INTO {$this->table} (follower_id, following_id, created_at) 
                  VALUES (:follower_id, :following_id, NOW())";
        
        return $this->execute($query, [
            'follower_id' => $followerId,
            'following_id' => $followingId
        ]);
    }
    
    /**
     * Unfollow một user
     * @param int $followerId ID người thực hiện unfollow
     * @param int $followingId ID người bị unfollow
     * @return bool True nếu thành công
     */
    public function unfollow($followerId, $followingId) {
        $query = "DELETE FROM {$this->table} 
                  WHERE follower_id = :follower_id AND following_id = :following_id";
        
        return $this->execute($query, [
            'follower_id' => $followerId,
            'following_id' => $followingId
        ]);
    }
    
    /**
     * Kiểm tra đã follow chưa
     * @param int $followerId
     * @param int $followingId
     * @return bool
     */
    public function isFollowing($followerId, $followingId) {
        $query = "SELECT id FROM {$this->table} 
                  WHERE follower_id = :follower_id AND following_id = :following_id 
                  LIMIT 1";
        
        $result = $this->query($query, [
            'follower_id' => $followerId,
            'following_id' => $followingId
        ]);
        
        return !empty($result);
    }
    
    /**
     * Lấy danh sách followers của một user
     * @param int $userId ID user cần lấy followers
     * @return array Danh sách followers
     */
    public function getFollowers($userId) {
        $query = "SELECT u.id, u.username, u.avatar, u.bio, f.created_at as followed_at
                  FROM {$this->table} f
                  JOIN users u ON f.follower_id = u.id
                  WHERE f.following_id = :user_id AND u.status != 'banned'
                  ORDER BY f.created_at DESC";
        
        return $this->query($query, ['user_id' => $userId]);
    }
    
    /**
     * Lấy danh sách following của một user
     * @param int $userId ID user cần lấy following
     * @return array Danh sách following
     */
    public function getFollowing($userId) {
        $query = "SELECT u.id, u.username, u.avatar, u.bio, f.created_at as followed_at
                  FROM {$this->table} f
                  JOIN users u ON f.following_id = u.id
                  WHERE f.follower_id = :user_id AND u.status != 'banned'
                  ORDER BY f.created_at DESC";
        
        return $this->query($query, ['user_id' => $userId]);
    }
    
    /**
     * Đếm số followers
     * @param int $userId
     * @return int
     */
    public function countFollowers($userId) {
        $query = "SELECT COUNT(*) as total FROM {$this->table} 
                  WHERE following_id = :user_id";
        
        $result = $this->query($query, ['user_id' => $userId]);
        return (int)($result[0]['total'] ?? 0);
    }
    
    /**
     * Đếm số following
     * @param int $userId
     * @return int
     */
    public function countFollowing($userId) {
        $query = "SELECT COUNT(*) as total FROM {$this->table} 
                  WHERE follower_id = :user_id";
        
        $result = $this->query($query, ['user_id' => $userId]);
        return (int)($result[0]['total'] ?? 0);
    }
}
?>