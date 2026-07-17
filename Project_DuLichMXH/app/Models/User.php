<?php
namespace App\Models;

class User extends BaseModel {
    protected $table = 'users';
    
    public function findByEmail($email) {
        $sql = "SELECT u.*, r.slug as role_slug, r.level as role_level 
                FROM {$this->table} u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.email = :email AND u.status != 'deleted' LIMIT 1";
        $result = $this->query($sql, ['email' => $email]);
        return $result[0] ?? null;
    }

    public function findByUsername($username) {
        $sql = "SELECT id FROM {$this->table} WHERE username = :username AND status != 'deleted' LIMIT 1";
        $result = $this->query($sql, ['username' => $username]);
        return $result[0] ?? null;
    }
    
    public function findById($id) {
        $sql = "SELECT u.id, u.username, u.email, u.full_name, u.avatar, u.bio, u.hometown, u.current_city, u.dob, u.education_school, u.workplace, u.interests, u.phone, u.status, u.role_id, u.is_verified, u.created_at, r.slug as role_slug, r.level as role_level 
                FROM {$this->table} u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = :id LIMIT 1";
        $result = $this->query($sql, ['id' => (int)$id]);
        return $result[0] ?? null;
    }

    /**
     * Lấy danh sách mã quyền (slugs) của một Role
     */
    public function getPermissionsByRoleId(int $roleId): array {
        $sql = "SELECT p.slug 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ?";
        $rows = $this->query($sql, [$roleId]);
        return array_column($rows, 'slug');
    }
    
    public function create($data) {
        $allowedFields = ['username', 'email', 'password', 'full_name', 'phone', 'avatar', 'bio', 'hometown', 'interests', 'auth_provider', 'is_verified', 'role_id', 'email_verified_at'];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));
        
        if (isset($filteredData['password'])) {
            $filteredData['password'] = password_hash($filteredData['password'], PASSWORD_DEFAULT);
        }
        
        // Default values if not provided
        if (!isset($filteredData['auth_provider'])) $filteredData['auth_provider'] = 'local';
        if (!isset($filteredData['is_verified'])) $filteredData['is_verified'] = false;
        if (!isset($filteredData['role_id'])) $filteredData['role_id'] = 5; // Mặc định là User (5)

        $fields = array_keys($filteredData);
        $placeholders = array_map(fn($f) => ":{$f}", $fields);
        
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ", status, created_at) 
                VALUES (" . implode(', ', $placeholders) . ", 'active', NOW())";
        
        $this->execute($sql, $filteredData);
        return $this->getLastInsertId('users_id_seq');
    }

    public function updatePassword($email, $newPassword) {
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $sql = "UPDATE {$this->table} SET password = :password WHERE email = :email";
        return $this->execute($sql, ['password' => $hashedPassword, 'email' => $email]);
    }

    public function checkBlockedOTP($email) {
        $sql = "SELECT blocked_until, EXTRACT(EPOCH FROM (blocked_until - NOW())) as seconds_left 
                FROM password_resets 
                WHERE email = :email AND blocked_until > NOW() LIMIT 1";
        $result = $this->query($sql, ['email' => $email]);
        $record = $result[0] ?? null;
        if ($record && $record['blocked_until']) {
            $secondsLeft = (int)$record['seconds_left'];
            $minutesLeft = ceil($secondsLeft / 60);
            return [
                'blocked' => true,
                'message' => "Chức năng OTP cho email này đang bị tạm khóa. Vui lòng thử lại sau {$minutesLeft} phút."
            ];
        }
        return ['blocked' => false];
    }

    public function verifyOTP($email, $otp) {
        $sql = "SELECT *, EXTRACT(EPOCH FROM (blocked_until - NOW())) as seconds_left 
                FROM password_resets 
                WHERE email = :email LIMIT 1";
        $result = $this->query($sql, ['email' => $email]);
        $record = $result[0] ?? null;

        if (!$record) {
            return [
                'success' => false,
                'message' => 'Mã xác thực OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại.'
            ];
        }
        
        // Kiểm tra xem OTP có đang bị khóa tạm thời không
        if ($record['blocked_until'] && (int)$record['seconds_left'] > 0) {
            $secondsLeft = (int)$record['seconds_left'];
            $minutesLeft = ceil($secondsLeft / 60);
            return [
                'success' => false,
                'message' => "Chức năng OTP của bạn đang bị khóa tạm thời. Vui lòng thử lại sau {$minutesLeft} phút."
            ];
        }

        // Kiểm tra xem OTP có bị hết hạn không
        if (strtotime($record['expires_at']) <= time()) {
            return [
                'success' => false,
                'message' => 'Mã xác thực OTP đã hết hạn. Vui lòng gửi lại mã mới.'
            ];
        }

        if ($record['otp_code'] === $otp) {
            return [
                'success' => true,
                'data' => $record
            ];
        }

        // Tăng số lần thử
        $newAttempts = (int)($record['attempts'] ?? 0) + 1;
        if ($newAttempts >= 3) {
            $newLockoutCount = (int)($record['lockout_count'] ?? 0) + 1;

            // Tính toán thời gian khóa dựa trên số lần vi phạm (lockout_count)
            $interval = '15 minutes';
            $timeString = '15 phút';
            if ($newLockoutCount === 2) {
                $interval = '1 hour';
                $timeString = '1 giờ';
            } elseif ($newLockoutCount >= 3) {
                $interval = '24 hours';
                $timeString = '24 giờ';
            }

            // Khóa, tăng lockout_count, và đặt otp_code = '' để vô hiệu hóa mã cũ
            $this->execute(
                "UPDATE password_resets 
                 SET attempts = ?, 
                     lockout_count = ?, 
                     blocked_until = NOW() + INTERVAL '$interval', 
                     otp_code = '' 
                 WHERE email = ?",
                [$newAttempts, $newLockoutCount, $email]
            );

            return [
                'success' => false,
                'message' => "Mã OTP đã bị hủy do nhập sai quá 3 lần. Chức năng OTP của bạn bị khóa trong $timeString."
            ];
        } else {
            $this->execute("UPDATE password_resets SET attempts = ? WHERE email = ?", [$newAttempts, $email]);
            $remaining = 3 - $newAttempts;
            return [
                'success' => false,
                'message' => "Mã xác thực OTP không đúng. Bạn còn {$remaining} lần nhập."
            ];
        }
    }

    public function createOTP($email, $otp) {
        // Kiểm tra xem có đang bị khóa không
        $blockCheck = $this->checkBlockedOTP($email);
        if ($blockCheck['blocked']) {
            return $blockCheck;
        }

        // Tìm xem có bản ghi OTP cũ nào không để bảo toàn lockout_count
        $sql = "SELECT id, lockout_count, blocked_until FROM password_resets WHERE email = :email LIMIT 1";
        $result = $this->query($sql, ['email' => $email]);
        $record = $result[0] ?? null;

        if ($record) {
            // Nếu đã qua hơn 24 giờ kể từ thời điểm hết hạn khóa cũ, reset lockout_count về 0
            $resetLockout = false;
            if ($record['blocked_until']) {
                $sqlCheck = "SELECT 1 FROM password_resets 
                             WHERE id = :id AND blocked_until < NOW() - INTERVAL '24 hours'";
                $resCheck = $this->query($sqlCheck, ['id' => (int)$record['id']]);
                if (!empty($resCheck)) {
                    $resetLockout = true;
                }
            }

            $lockoutCount = $resetLockout ? 0 : (int)$record['lockout_count'];

            $updateSql = "UPDATE password_resets 
                          SET otp_code = :otp, 
                              expires_at = NOW() + INTERVAL '5 minutes', 
                              attempts = 0, 
                              lockout_count = :lockout_count,
                              created_at = NOW() 
                          WHERE id = :id";
            $this->execute($updateSql, [
                'otp' => $otp, 
                'lockout_count' => $lockoutCount, 
                'id' => (int)$record['id']
            ]);
        } else {
            // Tạo mới hoàn toàn
            $insertSql = "INSERT INTO password_resets (email, otp_code, expires_at, attempts, lockout_count, created_at) 
                          VALUES (:email, :otp, NOW() + INTERVAL '5 minutes', 0, 0, NOW())";
            $this->execute($insertSql, ['email' => $email, 'otp' => $otp]);
        }

        return ['blocked' => false, 'success' => true];
    }

    public function deleteOTP($email) {
        return $this->execute("DELETE FROM password_resets WHERE email = ?", [$email]);
    }

    
    public function updateProfile($id, $data) {
        $allowedFields = ['full_name', 'bio', 'hometown', 'current_city', 'dob', 'education_school', 'workplace', 'phone', 'avatar', 'interests'];
        $sets = [];
        $params = ['id' => (int)$id];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (empty($sets)) return true; 

        $sql = "UPDATE users SET " . implode(', ', $sets) . ", updated_at = NOW() WHERE id = :id";
        $updated = $this->execute($sql, $params) >= 0;

        // Cập nhật bảng trung gian user_interests nếu có thay đổi interests
        if (array_key_exists('interests', $data)) {
            $interestsStr = $data['interests'] ?? '';
            $this->execute("DELETE FROM user_interests WHERE user_id = :user_id", ['user_id' => (int)$id]);
            
            if (!empty(trim($interestsStr))) {
                $tags = array_filter(array_map('trim', explode(',', str_replace(', ', ',', $interestsStr))));
                $tagModel = new Tag();
                foreach ($tags as $tagName) {
                    if (empty($tagName)) continue;
                    $tagId = $tagModel->findOrCreate($tagName, 'interest');
                    $this->execute(
                        "INSERT INTO user_interests (user_id, tag_id) VALUES (:user_id, :tag_id) ON CONFLICT DO NOTHING",
                        ['user_id' => (int)$id, 'tag_id' => $tagId]
                    );
                }
            }
        }

        return $updated;
    }

    public function verifyPassword($plainPassword, $hashedPassword) {
        return password_verify($plainPassword, $hashedPassword);
    }
    
    public function updateLastLogin($userId) {
        $sql = "UPDATE {$this->table} SET last_login_at = NOW() WHERE id = :id";
        return $this->execute($sql, ['id' => (int)$userId]);
    }

    /**
     * Lấy danh sách ID những người mà người dùng đang theo dõi
     */
    public function getFollowingIds($userId) {
        $sql = "SELECT following_id FROM follows WHERE follower_id = :id";
        $results = $this->query($sql, ['id' => (int)$userId]);
        if (!is_array($results)) return [];
        return array_map(fn($row) => (string)$row['following_id'], $results);
    }

    /**
     * Lấy các chỉ số thống kê của người dùng
     */
    public function getStats($userId) {
        $userId = (int)$userId;
        
        // Đếm bài viết (cả blog và post)
        $postsCount = $this->query("SELECT COUNT(*) as count FROM posts WHERE user_id = :id AND status = 'published'", ['id' => $userId])[0]['count'] ?? 0;
        
        // Đếm followers (người đang follow user này)
        $followersCount = $this->query("SELECT COUNT(*) as count FROM follows WHERE following_id = :id", ['id' => $userId])[0]['count'] ?? 0;
        
        // Đếm following (những người mà user này đang follow)
        $followingCount = $this->query("SELECT COUNT(*) as count FROM follows WHERE follower_id = :id", ['id' => $userId])[0]['count'] ?? 0;
        
        return [
            'posts_count' => (int)$postsCount,
            'followers_count' => (int)$followersCount,
            'following_count' => (int)$followingCount
        ];
    }

    /**
     * Tìm kiếm người dùng theo tên, email hoặc username
     */
    public function search($query, $limit = 10) {
        $sql = "SELECT id, username, full_name, avatar, email 
                FROM users 
                WHERE username ILIKE :q 
                   OR full_name ILIKE :q 
                   OR email ILIKE :q
                LIMIT :limit";
        return $this->query($sql, [
            'q' => "%$query%",
            'limit' => $limit
        ]);
    }

    /**
     * Gợi ý bạn đồng hành dựa trên sở thích và bạn chung
     */
    public function getSuggestedCompanions($userId, $limit = 10, $interestFilter = null, $search = null) {
        $userId = (int)$userId;
        
        // 1. Lấy sở thích của user hiện tại
        $currentUser = $this->findById($userId);
        $currentInterestsStr = $currentUser ? ($currentUser['interests'] ?? '') : '';
        $currentInterests = array_filter(array_map('trim', explode(',', str_replace(', ', ',', $currentInterestsStr))));
        $totalInterests = count($currentInterests);
        
        $sql = "
            WITH current_user_tags AS (
                SELECT tag_id 
                FROM user_interests 
                WHERE user_id = :user_id
            ),
            mutual_friends AS (
                SELECT f2.follower_id as other_user_id, COUNT(*) as count
                FROM follows f1
                JOIN follows f2 ON f1.following_id = f2.following_id
                WHERE f1.follower_id = :user_id
                GROUP BY f2.follower_id
            )
            SELECT 
                u.id, u.username, u.full_name, u.avatar, u.interests,
                COALESCE(mf.count, 0) as mutual_friends_count,
                (
                    SELECT COUNT(*) 
                    FROM user_interests ui
                    WHERE ui.user_id = u.id 
                      AND ui.tag_id IN (SELECT tag_id FROM current_user_tags)
                ) as common_tags_count,
                (
                    SELECT json_agg(DISTINCT t.name)
                    FROM user_interests ui
                    JOIN tags t ON ui.tag_id = t.id
                    WHERE ui.user_id = u.id 
                      AND ui.tag_id IN (SELECT tag_id FROM current_user_tags)
                ) as common_tags
            FROM users u
            LEFT JOIN mutual_friends mf ON u.id = mf.other_user_id
            WHERE u.id != :user_id 
              AND u.status = 'active'
              AND NOT EXISTS (
                  SELECT 1 FROM follows WHERE follower_id = :user_id AND following_id = u.id
              )
        ";

        $params = [
            'user_id' => $userId
        ];

        // Lọc theo tag cứng
        if ($interestFilter && $interestFilter !== 'Tất cả') {
            $sql .= " AND u.interests ILIKE :filter";
            $params['filter'] = "%$interestFilter%";
        }

        // Lọc theo từ khóa tìm kiếm (Search)
        if ($search) {
            $sql .= " AND (u.interests ILIKE :search OR u.full_name ILIKE :search OR u.username ILIKE :search)";
            $params['search'] = "%$search%";
        }

        $sql .= " ORDER BY common_tags_count DESC, mutual_friends_count DESC, u.created_at DESC LIMIT :limit";
        $params['limit'] = $limit;

        $results = $this->query($sql, $params);
        
        foreach ($results as &$row) {
            $commonCount = (int)$row['common_tags_count'];
            $rowInterests = !empty($row['interests']) ? array_filter(array_map('trim', explode(',', str_replace(', ', ',', $row['interests'])))) : [];
            $candidateCount = count($rowInterests);
            
            // Jaccard Similarity
            $unionCount = $totalInterests + $candidateCount - $commonCount;
            $row['matching_score'] = $unionCount > 0 ? round(($commonCount / $unionCount) * 100) : 0;
            
            // Đảm bảo score hợp lý cho những người có bạn chung hoặc ngẫu nhiên cực thấp
            if ($row['matching_score'] == 0 && $row['mutual_friends_count'] > 0) {
                $row['matching_score'] = min(40, (int)$row['mutual_friends_count'] * 10);
            } else if ($row['matching_score'] == 0) {
                $row['matching_score'] = rand(1, 5); // Fallback ngẫu nhiên siêu thấp
            }
            
            // Format tags
            $row['interests'] = $rowInterests;
            $row['common_tags'] = $row['common_tags'] ? json_decode($row['common_tags']) : [];
            
            // Mock avatars cho bạn chung
            $row['mutual_friends_avatars'] = [];
            for ($i = 0; $i < min(3, (int)$row['mutual_friends_count']); $i++) {
                $row['mutual_friends_avatars'][] = "https://i.pravatar.cc/150?u=" . ($row['id'] + $i);
            }
        }

        return $results;
    }

    public function getUserReviews($userId) {
        $sql = "SELECT r.*, l.name as location_name, l.slug as location_slug, l.image as location_image
                FROM reviews r
                JOIN locations l ON r.location_id = l.id
                WHERE r.user_id = :user_id AND r.status = 'approved'
                ORDER BY r.created_at DESC";
        return $this->query($sql, ['user_id' => (int)$userId]);
    }

    /**
     * Thực hiện xóa mềm tài khoản người dùng và dọn dẹp các dữ liệu liên quan (cascade)
     * trong một Database Transaction
     */
    public function softDelete($userId) {
        $userId = (int)$userId;
        $pdo = $this->db->getConnection();
        
        try {
            $pdo->beginTransaction();
            
            // 1. Cập nhật trạng thái người dùng và đổi email/username tránh xung đột
            $sqlUser = "UPDATE users 
                        SET status = 'deleted', 
                            email = 'del_' || id || '_' || email,
                            username = 'del_' || id || '_' || username,
                            updated_at = NOW() 
                        WHERE id = :id AND status != 'deleted'";
            $this->execute($sqlUser, ['id' => $userId]);
            
            // 2. Ẩn toàn bộ bài viết (post cá nhân, post nhóm, blog)
            $sqlPosts = "UPDATE posts 
                         SET status = 'deleted', 
                             updated_at = NOW() 
                         WHERE user_id = :user_id AND status != 'deleted'";
            $this->execute($sqlPosts, ['user_id' => $userId]);
            
            // 3. Ẩn toàn bộ tin ngắn (story)
            $sqlStories = "UPDATE stories 
                           SET is_active = FALSE, 
                               is_deleted = TRUE, 
                               updated_at = NOW() 
                           WHERE user_id = :user_id";
            $this->execute($sqlStories, ['user_id' => $userId]);
            
            // 4. Ẩn toàn bộ bình luận (comments)
            $sqlComments = "UPDATE comments 
                            SET status = 'deleted', 
                                updated_at = NOW() 
                            WHERE user_id = :user_id AND status != 'deleted'";
            $this->execute($sqlComments, ['user_id' => $userId]);
            
            // 5. Xóa các liên kết theo dõi (follows)
            $sqlFollows = "DELETE FROM follows 
                           WHERE follower_id = :user_id OR following_id = :user_id";
            $this->execute($sqlFollows, ['user_id' => $userId]);
            
            // 6. Xóa quyền/tư cách thành viên trong các nhóm
            $sqlMemberships = "DELETE FROM group_members 
                               WHERE user_id = :user_id";
            $this->execute($sqlMemberships, ['user_id' => $userId]);
            
            // 7. Ẩn các nhóm do người này sở hữu chính (owner)
            $sqlGroups = "UPDATE groups 
                          SET is_active = FALSE, 
                              updated_at = NOW() 
                          WHERE owner_id = :user_id AND is_active = TRUE";
            $this->execute($sqlGroups, ['user_id' => $userId]);
            
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log("User@softDelete Error: " . $e->getMessage());
            throw $e;
        }
    }
}
?>