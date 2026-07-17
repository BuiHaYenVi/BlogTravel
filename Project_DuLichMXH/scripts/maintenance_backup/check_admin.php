<?php
require 'Project_DuLichMXH/app/config/database.php';
$db = Database::getInstance();
$users = $db->fetchAll("SELECT id, username, email, role_id FROM users");
print_r($users);
