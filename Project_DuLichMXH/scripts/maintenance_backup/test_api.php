<?php
require 'Project_DuLichMXH/app/config/database.php';
require 'Project_DuLichMXH/app/models/Notification.php';
try {
    $notificationModel = new Notification();
    $userId = 1;
    $notifications = $notificationModel->getByUserId($userId);
    $unreadCount = $notificationModel->getUnreadCount($userId);
    print_r(['success' => true, 'notifications' => $notifications, 'unreadCount' => $unreadCount]);
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
