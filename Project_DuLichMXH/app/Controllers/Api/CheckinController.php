<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Checkin;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use Exception;
use Error;

class CheckinController extends BaseController {
    private $checkinModel;

    public function __construct() {
        $this->checkinModel = new Checkin();
    }

    /**
     * POST /api/checkins/toggle
     */
    public function toggle() {
        try {
            $user = AuthMiddleware::require();
            $input = $this->getInput();

            if (empty($input['destination_id']) || empty($input['status'])) {
                return Response::error('Thiếu thông tin destination_id hoặc status', 400);
            }

            $destId = (int)$input['destination_id'];
            $status = $input['status']; // 'visited' hoặc 'planning'

            if (!in_array($status, ['visited', 'planning'])) {
                return Response::error('Status không hợp lệ', 400);
            }

            $userId = (int)($user['user_id'] ?? $user['id'] ?? 0);
            $newStatus = $this->checkinModel->toggleCheckin($userId, $destId, $status);
            $visitedCount = $this->checkinModel->getVisitedCount($userId);

            return Response::success('Cập nhật trạng thái thành công', [
                'current_status' => $newStatus,
                'visited_count' => $visitedCount
            ]);

        } catch (Exception $e) {
            return Response::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /api/checkins/status/{destId}/{userId?}
     */
    public function getStatus($destId, $userIdFromUrl = null) {
        try {
            $user = AuthMiddleware::verifyToken(false);
            $userId = 0;
            
            if ($userIdFromUrl) {
                $userId = (int)$userIdFromUrl;
            } elseif ($user) {
                $userId = (int)($user['user_id'] ?? $user['id'] ?? 0);
            }

            if ($userId <= 0) {
                return Response::success('Thành công', ['status' => null]);
            }

            $status = $this->checkinModel->getStatus($userId, $destId);
            return Response::success('Thành công', ['status' => $status]);

        } catch (Exception $e) {
            error_log("Checkin Error: " . $e->getMessage());
            return Response::error('Lỗi kiểm tra trạng thái check-in', 500, [
                'debug_checkin_error' => $e->getMessage(),
                'destination_id' => $destId,
                'user_id' => $userId ?? 'not_found'
            ]);
        } catch (Error $e) {
            error_log("Checkin Critical Error: " . $e->getMessage());
            return Response::error('Lỗi hệ thống nghiêm trọng', 500, [
                'debug_checkin_error' => $e->getMessage(),
                'destination_id' => $destId
            ]);
        }
    }

    /**
     * GET /api/checkins/count
     */
    public function getCount() {
        try {
            $user = AuthMiddleware::require();
            $userId = (int)($user['user_id'] ?? $user['id'] ?? 0);
            $count = $this->checkinModel->getVisitedCount($userId);
            return Response::success('Thành công', ['count' => $count]);
        } catch (Exception $e) {
            return Response::error($e->getMessage(), 500);
        }
    }
}
?>