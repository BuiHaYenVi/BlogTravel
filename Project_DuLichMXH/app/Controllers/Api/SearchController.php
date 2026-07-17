<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Search;
use App\Utils\Response;
use Exception;

class SearchController extends BaseController {
    private $searchModel;
    
    public function __construct() {
        $this->searchModel = new Search();
    }
    
    /**
     * GET /api/search
     * Tìm kiếm đa dạng: posts, locations, users, groups
     */
    public function index() {
        try {
            // ✅ Get & validate input
            $keyword = trim($_GET['q'] ?? '');
            $type = $_GET['type'] ?? 'all'; // all, post, location, user, group
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            
            // Validate keyword
            if (empty($keyword) || mb_strlen($keyword, 'UTF-8') < 2) {
                return $this->error('Vui lòng nhập từ khóa tìm kiếm (ít nhất 2 ký tự)', 400);
            }
            
            // Validate type
            $allowedTypes = ['all', 'post', 'location', 'user', 'group'];
            if (!in_array($type, $allowedTypes)) {
                return $this->error('Loại tìm kiếm không hợp lệ', 400);
            }
            
            // Sanitize keyword (prevent SQL injection extra layer)
            $keyword = htmlspecialchars($keyword, ENT_QUOTES, 'UTF-8');
            
            // ✅ Call Model
            $results = $this->searchModel->searchAll($keyword, $type, $limit);
            
            // ✅ Get total counts for pagination info
            $counts = $this->searchModel->countResults($keyword, $type);
            
            return $this->success('Kết quả tìm kiếm', [
                'keyword' => $keyword,
                'type' => $type,
                'results' => $results,
                'counts' => $counts,
                'limit' => $limit
            ]);
            
        } catch (Exception $e) {
            error_log("SearchController@index Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
}
