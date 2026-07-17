<?php
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        $host = '127.0.0.1';
        $port = '5432';
        $dbname = 'dulichmxh';
        $user = 'postgres';
        $pass = '2026';
        
        try {
            $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
            $this->connection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_CASE => PDO::CASE_NATURAL,
                PDO::ATTR_EMULATE_PREPARES => false, // ✅ Dùng prepared statement thật
            ]);
        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Connection failed");
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
    
    /**
     * ✅ FIX: Bind params đúng cách cho PostgreSQL
     */
       /**
     * Bind params vào PDO statement - FIX cho positional params (?)
     */
    private function bindParams($stmt, $params) {
        foreach ($params as $key => $value) {
            // ✅ FIX QUAN TRỌNG: PDO positional params (?) cần index 1,2,3...
            // PHP array bắt đầu từ 0,1,2... nên cộng thêm 1 nếu key là số
            $param = is_int($key) ? $key + 1 : $key;
            
            if (is_int($value)) {
                $stmt->bindValue($param, $value, PDO::PARAM_INT);
            } elseif (is_bool($value)) {
                $stmt->bindValue($param, $value, PDO::PARAM_BOOL);
            } elseif (is_null($value)) {
                $stmt->bindValue($param, $value, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue($param, $value, PDO::PARAM_STR);
            }
        }
    }
    
    public function fetchAll($sql, $params = []) {
        try {
            // Debug: Log query để kiểm tra
            // error_log("SQL: " . $sql);
            // error_log("Params: " . print_r($params, true));
            
            $stmt = $this->connection->prepare($sql);
            $this->bindParams($stmt, $params);
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("FetchAll Error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }
    
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $this->bindParams($stmt, $params);
            $stmt->execute();
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log("Execute Error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }
    
    public function insert($sql, $params = [], $sequence = null) {
        try {
            $stmt = $this->connection->prepare($sql);
            $this->bindParams($stmt, $params);
            $stmt->execute();
            
            if ($sequence) {
                return (int)$this->connection->lastInsertId($sequence);
            }
            return (int)$this->connection->lastInsertId();
        } catch (PDOException $e) {
            error_log("Insert Error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollBack() {
        return $this->connection->rollBack();
    }
}
?>