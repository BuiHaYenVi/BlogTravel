<?php
// ✅ Đường dẫn chuẩn từ thư mục Admin/
require_once __DIR__ . '/BaseAdminController.php';           // Cùng thư mục
require_once __DIR__ . '/../../models/AdminSystemModel.php';  // Lùi 2 cấp về app/ rồi vào models/
require_once __DIR__ . '/../../utils/Response.php';           // Lùi 2 cấp về app/ rồi vào utils/

class AdminSystemController extends BaseAdminController {
    private $model;
    
    public function __construct() {
        parent::__construct(); // BaseAdminController đã lo việc check auth và kết nối DB
        $this->model = new AdminSystemModel();
    }

    public function locations() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        return Response::success('Locations', $this->model->getLocations($page, $limit)); 
    }

    public function createLocation() { 
        $data = json_decode(file_get_contents('php://input'), true); 
        if (empty($data['name']) || empty($data['slug'])) {
            return Response::error('Missing required fields: name, slug', 400);
        }
        $id = $this->model->createLocation($data);
        if ($id) {
            return Response::success('Location created', ['id' => $id], 201); 
        }
        return Response::error('Failed to create location', 500);
    }

    public function updateLocation($id) { 
        $data = json_decode(file_get_contents('php://input'), true); 
        unset($data['id']);
        if ($this->model->updateLocation((int)$id, $data)) {
            return Response::success('Updated');
        }
        return Response::error('Failed', 500); 
    }

    public function deleteLocation($id) { 
        if ($this->model->deleteLocation((int)$id)) {
            return Response::success('Deleted');
        }
        return Response::error('Failed', 500); 
    }

    public function groups() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        return Response::success('Groups', $this->model->getGroups($page, $limit)); 
    }

    public function deleteGroup($id) { 
        if ($this->model->deleteGroup((int)$id)) {
            return Response::success('Group disabled');
        }
        return Response::error('Failed', 500); 
    }

    public function reports() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $status = $_GET['status'] ?? 'pending';
        return Response::success('Reports', $this->model->getReports($page, $limit, $status)); 
    }

    public function processReport($id) { 
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? 'resolve';
        $note = $data['note'] ?? '';
        
        if ($this->model->processReport((int)$id, $action, $note)) {
            return Response::success('Processed');
        }
        return Response::error('Failed', 500);
    }

    public function broadcast() { 
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['title']) || empty($data['content'])) {
            return Response::error('Missing title/content', 400);
        }
        if ($this->model->broadcast($data['title'], $data['content'])) {
            return Response::success('Broadcast sent');
        }
        return Response::error('Failed', 500);
    }

    public function hashtags() { 
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        return Response::success('Hashtags', $this->model->getHashtags($page, $limit)); 
    }

    public function createHashtag() { 
        $data = json_decode(file_get_contents('php://input'), true); 
        if (empty($data['name'])) {
            return Response::error('Missing name', 400);
        }
        $id = $this->model->createHashtag($data['name'], $data['type'] ?? 'hashtag');
        if ($id) {
            return Response::success('Created', ['id' => $id], 201); 
        }
        return Response::error('Failed', 500);
    }

    public function updateHashtag($id) { 
        $data = json_decode(file_get_contents('php://input'), true); 
        if (empty($data['name'])) {
            return Response::error('Missing name', 400);
        }
        if ($this->model->updateHashtag((int)$id, $data['name'], $data['type'] ?? 'hashtag')) {
            return Response::success('Updated');
        }
        return Response::error('Failed', 500); 
    }

    public function deleteHashtag($id) { 
        if ($this->model->deleteHashtag((int)$id)) {
            return Response::success('Deleted');
        }
        return Response::error('Failed', 500); 
    }

    public function stats() { 
        return Response::success('Dashboard Stats', $this->model->getStats()); 
    }

    public function recommendation() { 
        return Response::success('Recommendation System', $this->model->getRecommendationStats()); 
    }

    public function backup() { 
        return Response::success('System Backup', $this->model->backupSystem()); 
    }
}