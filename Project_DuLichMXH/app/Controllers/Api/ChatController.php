<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Chat;
use App\Models\Follow;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use App\Config\Database;
use Throwable;
use Exception;

class ChatController extends BaseController {
    private $chatModel;
    private $followModel;

    public function __construct() {
        $this->chatModel = new Chat();
        $this->followModel = new Follow();
    }
    
    /**
     * GET /api/chats
     * Lấy danh sách cuộc trò chuyện
     */
    public function index() {
        try {
            $user = AuthMiddleware::require();
            $userId = $user['user_id'] ?? $user['id'];
            
            $conversations = $this->chatModel->getConversations($userId);
            
            Response::success('Lấy danh sách hội thoại thành công', $conversations);
        } catch (Throwable $e) {
            $errorDetail = $e->getMessage() . ' in ' . $e->getFile() . ' line ' . $e->getLine();
            error_log("❌ [Chat API Error] " . $errorDetail);
            
            // Trả về JSON lỗi chi tiết để debug ở Network tab
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false, 
                'message' => 'Lỗi hệ thống khi lấy danh sách chat',
                'debug_chat_error' => $errorDetail
            ]);
            exit;
        }
    }

    /**
     * GET /api/chats/{id}/messages
     * Lấy tin nhắn trong một cuộc trò chuyện
     */
    public function messages($id) {
        try {
            $user = AuthMiddleware::require();
            $userId = $user['user_id'] ?? $user['id'];
            
            // Kiểm tra quyền truy cập hội thoại
            $conv = $this->chatModel->getConversationById($id, $userId);
            if (!$conv) {
                Response::error('Hội thoại không tồn tại hoặc bạn không có quyền', 404);
                return;
            }

            $messages = $this->chatModel->getMessages($id);
            Response::success('Lấy tin nhắn thành công', $messages);
        } catch (Throwable $e) {
            $errorDetail = $e->getMessage() . ' in ' . $e->getFile() . ' line ' . $e->getLine();
            error_log("❌ [Chat Messages Error] " . $errorDetail);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false, 
                'message' => 'Lỗi hệ thống khi lấy tin nhắn',
                'debug_chat_error' => $errorDetail
            ]);
            exit;
        }
    }

    /**
     * POST /api/chats/start
     * Bắt đầu cuộc trò chuyện mới
     */
    public function start() {
        try {
            $user = AuthMiddleware::require();
            $currentUserId = $user['user_id'] ?? $user['id'];
            
            $input = $this->getInput();
            $targetUserId = $input['user_id'] ?? null;

            if (!$targetUserId) {
                Response::error('Thiếu user_id người nhận', 400);
                return;
            }

            if ((int)$currentUserId === (int)$targetUserId) {
                Response::error('Không thể tự trò chuyện với chính mình', 400);
                return;
            }

            $conversation = $this->chatModel->getOrCreateConversation($currentUserId, $targetUserId);
            Response::success('Bắt đầu hội thoại', $conversation);
        } catch (Throwable $e) {
            $errorDetail = $e->getMessage() . ' in ' . $e->getFile() . ' line ' . $e->getLine();
            error_log("❌ [Chat Start Error] " . $errorDetail);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false, 
                'message' => 'Lỗi hệ thống khi bắt đầu hội thoại',
                'debug_chat_error' => $errorDetail
            ]);
            exit;
        }
    }

    public function updateStatus($id) {
        try {
            $user = AuthMiddleware::require();
            $currentUserId = $user['user_id'] ?? $user['id'];
            
            $input = $this->getInput();
            $status = $input['status'] ?? '';

            if (!in_array($status, ['accepted', 'blocked', 'pending'])) {
                Response::error('Trạng thái không hợp lệ', 400);
                return;
            }

            // Lấy thông tin hội thoại
            $conv = $this->chatModel->getConversationById($id, $currentUserId);
            if (!$conv) {
                Response::error('Hội thoại không tồn tại', 404);
                return;
            }

            // Xác định ai là người gửi yêu cầu (sender) và ai là người nhận (me)
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("SELECT sender_id FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 1");
            $stmt->execute([$id]);
            $firstSenderId = $stmt->fetchColumn();

            if ($status === 'accepted') {
                if ($firstSenderId && (int)$firstSenderId !== (int)$currentUserId) {
                    try {
                        if (!$this->followModel->isFollowing($currentUserId, $firstSenderId)) {
                            $this->followModel->follow($currentUserId, $firstSenderId);
                        }
                    } catch (Exception $e) { }
                }
                $this->chatModel->updateStatus($id, 'accepted');
                Response::success('Đã chấp nhận yêu cầu trò chuyện');
            } 
            else if ($status === 'blocked') {
                $otherUserId = ((int)$conv['user_one_id'] === (int)$currentUserId) ? $conv['user_two_id'] : $conv['user_one_id'];
                $this->followModel->unfollow($currentUserId, $otherUserId);
                $this->followModel->unfollow($otherUserId, $currentUserId);
                $this->chatModel->updateStatus($id, 'blocked');
                Response::success('Đã chặn người dùng này');
            } else {
                $this->chatModel->updateStatus($id, $status);
                Response::success('Cập nhật trạng thái thành công');
            }

        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public function sendMessage($conversationId) {
        try {
            $user = AuthMiddleware::require();
            $input = $this->getInput();

            if (empty($input['text'])) {
                Response::error('Thiếu nội dung tin nhắn', 400);
                return;
            }

            $userId = $user['user_id'] ?? $user['id'];
            $text = trim($input['text']);

            $conv = $this->chatModel->getConversationById($conversationId, $userId);
            if (!$conv) {
                Response::error('Hội thoại không tồn tại', 404);
                return;
            }

            if ($conv['status'] === 'blocked') {
                Response::error('Hội thoại đã bị chặn', 403);
                return;
            }

            $messageId = $this->chatModel->saveMessage($conversationId, $userId, $text);
            if (!$messageId) {
                Response::error('Không thể lưu tin nhắn', 500);
                return;
            }

            $message = $this->chatModel->getMessageById($messageId);
            Response::success('Tin nhắn đã gửi', $message);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
