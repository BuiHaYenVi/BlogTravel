<?php
require_once __DIR__ . '/BaseModel.php';

class User extends BaseModel {
    protected $table = 'users';
    
    /**
     * Tìm user theo email
     */
    public function findByEmail($email) {
        $sql = "SELECT * FROM {$this->table} WHERE email = :email LIMIT 1";
        $result = $this->query($sql, ['email' => $email]);
        return $result[0] ?? null;
    }
    
    /**
     * Tìm user theo ID
     */
    public function findById($id) {
        return $this->find($id);
    }
    
    /**
     * Tạo user mới
     * @return int User ID mới
     */
    public function create($data) {
        $allowedFields = [
        'username', 'email', 'password', 'full_name', 'phone',
        'avatar', 'bio', 'dob', 'gender', 'hometown'
    ];
    
    // Lọc chỉ lấy các field có trong whitelist
    $filteredData = array_intersect_key($data, array_flip($allowedFields));
    
    // ✅ Hash password trước khi lưu
    if (isset($filteredData['password'])) {
        $filteredData['password'] = password_hash($filteredData['password'], PASSWORD_DEFAULT);
    }
    
    // ✅ Build dynamic SQL
    $fields = array_keys($filteredData);
    $placeholders = array_map(fn($f) => ":{$f}", $fields);
    
    $sql = "INSERT INTO {$this->table} 
            (" . implode(', ', $fields) . ", status, created_at) 
            VALUES (" . implode(', ', $placeholders) . ", 'active', NOW())";
    
    // ✅ Execute INSERT query
    $this->execute($sql, $filteredData);
    
    // ✅ ✅ ✅ FIX: Lấy lastInsertId trực tiếp từ PDO connection (KHÔNG gọi $this->insert() lại)
    $pdo = $this->db->getConnection();
    $lastId = $pdo->lastInsertId('users_id_seq'); // PostgreSQL sequence
    
    return (int)$lastId;
    }
    
    /**
     * Verify password
     */
    public function verifyPassword($plainPassword, $hashedPassword) {
        return password_verify($plainPassword, $hashedPassword);
    }
    
    /**
     * Kiểm tra user có bị ban không
     */
    public function isBanned($userId) {
        $user = $this->findById($userId);
        return $user && $user['status'] === 'banned';
    }
    
    /**
     * Cập nhật last_login_at
     */
    public function updateLastLogin($userId) {
        $sql = "UPDATE {$this->table} SET last_login_at = NOW() WHERE id = :id";
        return $this->execute($sql, ['id' => $userId]);
    }
    
    /**
     * Đổi mật khẩu
     */
    public function updatePassword($userId, $newPassword) {
        $sql = "UPDATE {$this->table} 
                SET password = :password, updated_at = NOW() 
                WHERE id = :id";
        return $this->execute($sql, [
            'id' => $userId,
            'password' => password_hash($newPassword, PASSWORD_DEFAULT)
        ]);
    }
}
?>