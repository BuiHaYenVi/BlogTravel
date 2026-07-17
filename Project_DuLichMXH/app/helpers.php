<?php

if (!function_exists('asset_url')) {
    /**
     * Generate a full URL for an asset based on the current host or configured BASE_URL.
     * 
     * @param string $path The relative path to the asset (e.g., '/uploads/avatars/user1.jpg')
     * @return string The absolute URL to the asset
     */
    function asset_url($path) {
        // Remove leading slash to prevent double slashes
        $path = ltrim($path, '/');
        
        // You can define a BASE_URL constant in your config. 
        // If not defined, we dynamically generate it.
        if (defined('BASE_URL')) {
            $baseUrl = rtrim(BASE_URL, '/');
        } else {
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $baseUrl = $protocol . '://' . $host . '/Project_DuLichMXH/public';
        }
        
        return $baseUrl . '/' . $path;
    }
}

if (!function_exists('sync_ban_to_chat')) {
    /**
     * Notify Chat Server to disconnect a banned user.
     * 
     * @param int $userId The ID of the user to be disconnected
     * @param string $action The action ('ban' or 'unban')
     * @return bool Success or failure
     */
    function sync_ban_to_chat($userId, $action = 'ban') {
        // In a real environment, this should be the internal IP/URL of the Node.js server
        $chatServerUrl = 'http://localhost:3001/internal/ban-user';
        $internalSecret = 'INTERNAL_SYNC_SECRET_2026';
        
        $data = json_encode([
            'user_id' => $userId,
            'action' => $action,
            'secret' => $internalSecret
        ]);

        $ch = curl_init($chatServerUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2); // Fast timeout for UX
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    }
}

if (!function_exists('sync_comment_to_socket')) {
    /**
     * Notify Chat Server to broadcast a new comment.
     * 
     * @param int $postId
     * @param array $commentData Full comment data including author details
     * @return bool Success or failure
     */
    function sync_comment_to_socket($postId, $commentData) {
        $chatServerUrl = 'http://localhost:3001/internal/new-comment';
        $internalSecret = 'INTERNAL_SYNC_SECRET_2026';
        
        $data = json_encode([
            'post_id' => $postId,
            'comment' => $commentData,
            'secret' => $internalSecret
        ]);

        $ch = curl_init($chatServerUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2); 
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    }
}

if (!function_exists('sync_notification_to_socket')) {
    /**
     * Notify Chat Server to push a new notification to a specific user.
     * 
     * @param int $userId The receiver ID
     * @param array $notifData The notification data
     * @return bool Success or failure
     */
    function sync_notification_to_socket($userId, $notifData) {
        $chatServerUrl = 'http://localhost:3001/internal/new-notification';
        $internalSecret = 'INTERNAL_SYNC_SECRET_2026';
        
        $data = json_encode([
            'user_id' => $userId,
            'notification' => $notifData,
            'secret' => $internalSecret
        ]);

        $ch = curl_init($chatServerUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    }
}

if (!function_exists('recalculateUserBadge')) {
    /**
     * Recalculate and update the user's badge based on blog and group post counts.
     *
     * @param int $userId The ID of the user
     * @return void
     */
    function recalculateUserBadge($userId) {
        $userId = (int)$userId;
        if ($userId <= 0) return;

        try {
            $db = \App\Config\Database::getInstance();
            
            // Count published blogs: post_type = 'blog' AND status = 'published'
            $blogSql = "SELECT COUNT(*) as total FROM posts WHERE user_id = :userId AND post_type = 'blog' AND status = 'published'";
            $blogResult = $db->fetchAll($blogSql, ['userId' => $userId]);
            $blogCount = (int)($blogResult[0]['total'] ?? 0);

            // Count approved group posts: post_type = 'group_post' AND status = 'approved'
            $groupSql = "SELECT COUNT(*) as total FROM posts WHERE user_id = :userId AND post_type = 'group_post' AND status = 'approved'";
            $groupResult = $db->fetchAll($groupSql, ['userId' => $userId]);
            $groupCount = (int)($groupResult[0]['total'] ?? 0);

            // Determine badge based on counts
            $badge = null;
            
            // Define badges with their conditions and weights
            if ($blogCount >= 30) {
                $badge = "Đại Sứ Du Lịch";
            } elseif ($groupCount >= 25) {
                $badge = "Trụ Cột Cộng Đồng";
            } elseif ($blogCount >= 15) {
                $badge = "Chuyên Gia Chia Sẻ";
            } elseif ($groupCount >= 10) {
                $badge = "Người Hoạt Động Tích Cực";
            } elseif ($blogCount >= 5) {
                $badge = "Blogger Năng Nổ";
            } elseif ($groupCount >= 1) {
                $badge = "Thành Viên Kết Nối";
            } elseif ($blogCount >= 1) {
                $badge = "Blogger Mới";
            }

            // Update user's badge
            $updateSql = "UPDATE users SET badge_title = :badge WHERE id = :userId";
            $db->execute($updateSql, ['badge' => $badge, 'userId' => $userId]);

        } catch (\Exception $e) {
            error_log("Error in recalculateUserBadge for user $userId: " . $e->getMessage());
        }
    }
}

