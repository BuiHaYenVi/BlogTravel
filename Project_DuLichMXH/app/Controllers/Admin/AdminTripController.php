<?php

namespace App\Controllers\Admin;

use App\Models\AdminTripModel;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;
use Throwable;

class AdminTripController extends BaseAdminController {
    private $model;
    
    public function __construct() {
        parent::__construct();
        $this->model = new AdminTripModel();
    }

    public function index() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? 'All';
        
        return Response::success('Danh sách lịch trình', $this->model->getTrips($page, $limit, $search, $status)); 
    }

    public function updateStatus($id) { 
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['status'])) {
            return Response::error('Missing status parameter', 400);
        }
        if ($this->model->updateStatus((int)$id, $data['status'])) {
            return Response::success('Cập nhật trạng thái thành công');
        }
        return Response::error('Cập nhật thất bại', 500); 
    }

    public function destroy($id) { 
        if ($this->model->deleteTrip((int)$id)) {
            return Response::success('Đã xóa lịch trình thành công');
        }
        return Response::error('Xóa lịch trình thất bại', 500); 
    }
}
