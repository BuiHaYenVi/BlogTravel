<?php
namespace App\Models;

use App\Config\Database;

abstract class BaseModel {
    protected $db;
    protected $table;

    public function __construct() {
        $this->db = Database::getInstance();
    }    
    protected function query($sql, $params = []) {
        return $this->db->fetchAll($sql, $params);
    }
    
    protected function execute($sql, $params = []) {
        return $this->db->execute($sql, $params);
    }
    
    protected function insert($sql, $params = [], $sequence = null) {
        return $this->db->insert($sql, $params, $sequence);
    }
    
    protected function getLastInsertId($sequence = null) {
        $pdo = $this->db->getConnection();
        $id = $pdo->lastInsertId($sequence);
        return (int)$id;
    }

    protected function createSlug($str) {
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
        return strtolower(trim($str, '-'));
    }

    public function find($id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
        $result = $this->query($sql, ['id' => $id]);
        return $result[0] ?? null;
    }

    /**
     * Lấy bản ghi đầu tiên khớp với điều kiện
     * @param string $where Câu lệnh WHERE (vd: "user_id = :user_id")
     * @param array $params Tham số bind
     * @return array|null
     */
    public function first($where, $params = []) {
        $sql = "SELECT * FROM {$this->table} WHERE {$where} LIMIT 1";
        $result = $this->query($sql, $params);
        return $result[0] ?? null;
    }
}
?>