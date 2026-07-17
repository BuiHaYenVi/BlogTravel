<?php
namespace App\Controllers\Admin;

use App\Controllers\Admin\BaseAdminController;
use App\Models\AdminNotification;
use App\Utils\Response;
use Exception;
use Throwable;

class AdminNotificationController extends BaseAdminController {
    private $model;

    public function __construct() {
        parent::__construct();
        $this->model = new AdminNotification();
    }

    /**
     * GET /api/admin/notifications/latest
     */
    public function getLatest() {
        try {
            $notifications = $this->model->getLatest(10);
            return Response::success('Latest admin notifications', $notifications);
        } catch (Throwable $e) {
            error_log("AdminNotificationController@getLatest Error: " . $e->getMessage());
            return Response::error('Lỗi khi lấy thông báo', 500);
        }
    }

    /**
     * PUT /api/admin/notifications/read-all
     */
    public function markAllAsRead() {
        try {
            $this->model->markAllAsRead();
            return Response::success('All notifications marked as read');
        } catch (Throwable $e) {
            error_log("AdminNotificationController@markAllAsRead Error: " . $e->getMessage());
            return Response::error('Lỗi khi cập nhật thông báo', 500);
        }
    }
}
