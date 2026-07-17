<?php
namespace App\Config;

use App\Utils\Env;
use PDO;
use PDOException;
use Exception;

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '5432');
        $dbname = Env::get('DB_NAME', 'dulichmxh');
        $user = Env::get('DB_USER', 'postgres');
        $pass = Env::get('DB_PASSWORD', '');
        
        try {
            $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
            $this->connection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_CASE => PDO::CASE_NATURAL,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Kết nối Database thất bại: " . $e->getMessage());
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    private function bindParams($stmt, $params) {
        foreach ($params as $key => $value) {
            // Hỗ trợ cả positional (?) và named params (:name hoặc name)
            $param = is_int($key) ? $key + 1 : (strpos($key, ':') === 0 ? $key : ":$key");
            
            if (is_int($value)) {
                $stmt->bindValue($param, $value, PDO::PARAM_INT);
            } elseif (is_bool($value)) {
                $stmt->bindValue($param, $value, PDO::PARAM_BOOL);
            } elseif (is_null($value)) {
                $stmt->bindValue($param, $value, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue($param, (string)$value, PDO::PARAM_STR);
            }
        }
    }
    
    public function fetchAll($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $this->bindParams($stmt, $params);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Lỗi truy vấn (fetchAll): " . $e->getMessage() . " | SQL: " . $sql);
        }
    }
    
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $this->bindParams($stmt, $params);
            $stmt->execute();
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new Exception("Lỗi thực thi (execute): " . $e->getMessage() . " | SQL: " . $sql);
        }
    }
    
    public function insert($sql, $params = [], $sequence = null) {
        try {
            $stmt = $this->connection->prepare($sql);
            $this->bindParams($stmt, $params);
            $stmt->execute();
            return (int)$this->connection->lastInsertId($sequence);
        } catch (PDOException $e) {
            throw new Exception("Lỗi thêm dữ liệu (insert): " . $e->getMessage() . " | SQL: " . $sql);
        }
    }
    
    public function beginTransaction() { return $this->connection->beginTransaction(); }
    public function inTransaction() { return $this->connection->inTransaction(); }
    public function commit() { return $this->connection->commit(); }
    public function rollBack() { return $this->connection->rollBack(); }
}
?>