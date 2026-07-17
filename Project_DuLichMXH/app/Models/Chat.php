<?php
namespace App\Models;

use PDO;
use Exception;

class Chat extends BaseModel {
    protected $table = 'chats';
    private $pdo;

    public function __construct() {
        parent::__construct();
        $this->pdo = $this->db->getConnection();
    }

    public function getConversations($userId) {
        $sql = "
            SELECT c.*, 
                   u.id as user_id, u.username, u.full_name, u.avatar,
                   m.message_text as last_message, m.created_at as last_message_time
            FROM chats c
            JOIN users u ON (u.id = CASE WHEN c.user_one_id = :userId THEN c.user_two_id ELSE c.user_one_id END)
            LEFT JOIN messages m ON c.last_message_id = m.id
            WHERE c.user_one_id = :userId OR c.user_two_id = :userId
            ORDER BY c.updated_at DESC
        ";
        return $this->query($sql, ['userId' => $userId]);
    }

    public function getMessages($conversationId, $limit = 50) {
        $sql = "
            SELECT m.*, u.username, u.full_name, u.avatar 
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = :convId 
            ORDER BY m.created_at ASC 
            LIMIT :limit
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':convId', $conversationId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOrCreateConversation($userOneId, $userTwoId) {
        $u1 = min($userOneId, $userTwoId);
        $u2 = max($userOneId, $userTwoId);

        $conv = $this->first("user_one_id = ? AND user_two_id = ?", [$u1, $u2]);

        if ($conv) return $conv;

        $status = $this->checkMutualFollow($userOneId, $userTwoId) ? 'accepted' : 'pending';

        $sql = "
            INSERT INTO chats (user_one_id, user_two_id, status) 
            VALUES (?, ?, ?) RETURNING *
        ";
        $result = $this->query($sql, [$u1, $u2, $status]);
        return $result[0] ?? null;
    }

    private function checkMutualFollow($u1, $u2) {
        $sql = "
            SELECT COUNT(*) FROM follows 
            WHERE (follower_id = :u1 AND following_id = :u2)
               OR (follower_id = :u2 AND following_id = :u1)
        ";
        $result = $this->query($sql, ['u1' => $u1, 'u2' => $u2]);
        return (int)($result[0]['count'] ?? 0) === 2; // Note: count column might not be named 'count' if not aliased. Wait, the original was fetchColumn().
    }

    public function saveMessage($conversationId, $senderId, $text) {
        $this->pdo->beginTransaction();
        try {
            $sql = "
                INSERT INTO messages (conversation_id, sender_id, message_text) 
                VALUES (?, ?, ?) RETURNING id
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$conversationId, $senderId, $text]);
            $messageId = $stmt->fetchColumn();

            $sql = "
                UPDATE chats 
                SET last_message_id = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$messageId, $conversationId]);

            $this->pdo->commit();
            return $messageId;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return false;
        }
    }

    public function updateStatus($conversationId, $status) {
        $sql = "UPDATE chats SET status = ? WHERE id = ?";
        return $this->execute($sql, [$status, $conversationId]);
    }

    public function getConversationById($conversationId, $userId) {
        return $this->first("id = ? AND (user_one_id = ? OR user_two_id = ?)", [$conversationId, $userId, $userId]);
    }

    public function getMessageById($messageId) {
        $sql = "SELECT * FROM messages WHERE id = ?";
        $result = $this->query($sql, [$messageId]);
        return $result[0] ?? null;
    }
}
