<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ NẠP AUTOLOADER CỦA COMPOSER (PSR-4)
require_once __DIR__ . '/../vendor/autoload.php';

// Nạp các hàm helper không thuộc class
if (file_exists(__DIR__ . '/../app/helpers.php')) {
    require_once __DIR__ . '/../app/helpers.php';
}

use App\Utils\Response;

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// ✅ TỰ ĐỘNG CẮT ĐOẠN THỪA: Tìm vị trí của /api/ và lấy từ đó trở đi
$apiPos = stripos($requestUri, '/api/');
if ($apiPos !== false) {
    $requestUri = substr($requestUri, $apiPos);
}

$requestUri = str_replace('/index.php', '', $requestUri);

// ✅ Xử lý dấu gạch chéo ở cuối (VD: /api/users/1/ -> /api/users/1)
if ($requestUri !== '/' && substr($requestUri, -1) === '/') {
    $requestUri = rtrim($requestUri, '/');
}

if (empty($requestUri) || $requestUri[0] !== '/') {
    $requestUri = '/' . $requestUri;
}

// ✅ BẢO MẬT: Chặn truy cập trực tiếp vào các thư mục nhạy cảm hoặc tệp tin hệ thống
$forbiddenPatterns = ['/scripts/', '/app/', '/vendor/', '/composer.json', '/.env', '/Config/'];
foreach ($forbiddenPatterns as $pattern) {
    if (stripos($requestUri, $pattern) !== false) {
        Response::error('Access Denied', 403);
        exit;
    }
}

$routes = [
    // ===== AUTH =====
    'POST /api/auth/register'          => ['AuthController', 'register'],
    'POST /api/auth/send-register-otp' => ['AuthController', 'sendRegisterOTP'],
    'POST /api/auth/verify-otp'        => ['AuthController', 'verifyOTP'],
    'POST /api/auth/login'             => ['AuthController', 'login'],
    'POST /api/auth/logout'            => ['AuthController', 'logout'],
    'POST /api/auth/refresh-token'     => ['AuthController', 'refreshToken'],
    'POST /api/auth/google-login'      => ['AuthController', 'googleLogin'],
    'POST /api/auth/forgot-password'   => ['AuthController', 'forgotPassword'],
    'POST /api/auth/reset-password'    => ['AuthController', 'resetPassword'],
    
    // ===== POSTS =====
    'GET /api/posts'                   => ['PostController', 'index'],
    'POST /api/posts'                  => ['PostController', 'store'],
    'GET /api/posts/{id}'              => ['PostController', 'show'],
    'PUT /api/posts/{id}'              => ['PostController', 'update'],
    'DELETE /api/posts/{id}'           => ['PostController', 'destroy'],
    'POST /api/posts/{id}/like'        => ['PostController', 'like'],
    'DELETE /api/posts/{id}/like'      => ['PostController', 'unlike'],
    'POST /api/posts/{id}/share'       => ['PostController', 'share'],
    
    // ===== COMMENTS =====
    'GET /api/comments/latest'          => ['CommentController', 'latest'],
    'GET /api/comments/{id}/replies'        => ['CommentController', 'getReplies'],
    'GET /api/posts/{id}/comments'          => ['CommentController', 'index'],
    'POST /api/posts/{id}/comments'         => ['CommentController', 'store'],
    'DELETE /api/comments/{id}'             => ['CommentController', 'destroy'],
    'POST /api/posts/{id}/comments/{id}/reply' => ['CommentController', 'reply'],
    'POST /api/comments/{id}/like'          => ['CommentController', 'like'],
    'DELETE /api/comments/{id}/like'        => ['CommentController', 'unlike'],
    'PATCH /api/comments/{id}/hide'         => ['CommentController', 'hide'],         // Mod/Admin: Ẩn toàn hệ thống
    'POST /api/comments/{id}/hide-for-me'   => ['CommentController', 'hideForMe'],    // User: Ẩn với mình
    'DELETE /api/comments/{id}/hide-for-me' => ['CommentController', 'unhideForMe'],  // User: Bỏ ẩn
    
    // ===== HASHTAGS / TAGS =====
    'GET /api/tags/onboarding'    => ['TagController', 'onboarding'],
    'GET /api/tags/search'        => ['TagController', 'search'],
    'GET /api/tags/trending'      => ['TagController', 'trending'],
    'GET /api/tags/{id}'          => ['TagController', 'show'],
    'GET /api/tags/{id}/posts'    => ['TagController', 'postsByTag'],
    'POST /api/tags/extract'      => ['TagController', 'extract'],

    // ===== REPORTS =====
    'POST /api/reports'                  => ['ReportController', 'store'],
    'GET /api/reports/reasons'           => ['ReportController', 'reasons'],
    'GET /api/reports'                   => ['ReportController', 'index'],
    'GET /api/reports/{id}'              => ['ReportController', 'show'],
    
    // ===== NOTIFICATIONS =====
    'GET /api/notifications/all'       => ['NotificationController', 'getAll'],
    'GET /api/notifications'           => ['NotificationController', 'index'],
    'PUT /api/notifications/{id}/read' => ['NotificationController', 'markAsRead'],
    'PUT /api/notifications/read-all'  => ['NotificationController', 'markAllRead'],
    'DELETE /api/notifications/{id}'   => ['NotificationController', 'destroy'],

    // ===== COMPANIONS =====
    'GET /api/companions/suggestions'  => ['CompanionController', 'suggestions'],

    // ===== STORIES =====
    'POST /api/stories'                => ['StoryController', 'create'],
    'GET /api/stories/feed'            => ['StoryController', 'feed'],
    'GET /api/users/{id}/stories'      => ['StoryController', 'getUserStories'],
    'POST /api/stories/{id}/like'      => ['StoryController', 'toggleLike'],
    'GET /api/stories/archive'         => ['StoryController', 'archive'],
    'DELETE /api/stories/{id}'         => ['StoryController', 'delete'],

    // ===== TRIPS =====
    'POST /api/trips'                  => ['TripController', 'create'],
    'GET /api/trips'                   => ['TripController', 'index'],
    'GET /api/trips/me'                => ['TripController', 'getMyTrips'],
    'GET /api/trips/tags'              => ['TripController', 'getTags'],
    'GET /api/trips/{id}'              => ['TripController', 'show'],
    'PUT /api/trips/{id}'              => ['TripController', 'update'],
    'GET /api/trip-days/{id}'          => ['TripController', 'getTripDayById'],
    'DELETE /api/trips/{id}'           => ['TripController', 'destroy'],
    'POST /api/trips/{id}/join'        => ['TripController', 'joinRequest'],
    'POST /api/trips/{id}/invite/{id}' => ['TripController', 'inviteParticipant'],
    'POST /api/trips/{id}/invitations/accept' => ['TripController', 'acceptInvitation'],
    'POST /api/trips/{id}/invitations/reject' => ['TripController', 'rejectInvitation'],
    'DELETE /api/trips/{id}/leave'     => ['TripController', 'leave'],
    'GET /api/trips/{id}/requests'                 => ['TripController', 'getJoinRequests'],
    'PUT /api/trips/{id}/participants/{id}/accept' => ['TripController', 'acceptParticipant'],
    'PUT /api/trips/{id}/participants/{id}/reject' => ['TripController', 'rejectParticipant'],
    'DELETE /api/trips/{id}/participants/{id}'     => ['TripController', 'removeMember'],
    'PUT /api/trips/{id}/itinerary/activities/{id}/toggle' => ['TripController', 'toggleActivity'],

    // ===== LOCATIONS =====
    'POST /api/locations'              => ['LocationController', 'store'],
    'GET /api/locations'               => ['LocationController', 'index'],
    'GET /api/locations/{id}'          => ['LocationController', 'show'],
    'POST /api/locations/{id}/checkin' => ['LocationController', 'checkin'],
    'POST /api/locations/{id}/review'  => ['LocationController', 'review'],

    // ===== CHECK-INS =====
    'POST /api/checkins/toggle'        => ['CheckinController', 'toggle'],
    'GET /api/checkins/status/{id}'    => ['CheckinController', 'getStatus'],
    'GET /api/checkins/count'          => ['CheckinController', 'getCount'],
    
    // ===== GROUPS =====
    'POST /api/groups'                        => ['GroupController', 'create'],
    'GET /api/groups'                         => ['GroupController', 'index'],
    'GET /api/groups/invitations'             => ['GroupController', 'getMyInvitations'],
    'GET /api/groups/{id}'                    => ['GroupController', 'show'],
    'PUT /api/groups/{id}'                    => ['GroupController', 'update'],
    'DELETE /api/groups/{id}'                 => ['GroupController', 'destroy'],
    'POST /api/groups/{id}/join'              => ['GroupController', 'join'],
    'DELETE /api/groups/{id}/leave'           => ['GroupController', 'leave'],
    'PUT /api/groups/{id}/invites/accept'     => ['GroupController', 'acceptInvite'],
    'PUT /api/groups/{id}/invites/reject'     => ['GroupController', 'rejectInvite'],
    'GET /api/groups/{id}/members'            => ['GroupController', 'members'],
    'POST /api/groups/{id}/members/{id}/role' => ['GroupController', 'updateMemberRole'],
    'DELETE /api/groups/{id}/members/{id}'    => ['GroupController', 'kickMember'],
    'GET /api/groups/{id}/requests'           => ['GroupController', 'getJoinRequests'],
    'POST /api/groups/{id}/invite'            => ['GroupController', 'inviteMember'],
    'PUT /api/groups/{id}/requests/{id}/approve' => ['GroupController', 'approveRequest'],
    'PUT /api/groups/{id}/requests/{id}/reject'  => ['GroupController', 'rejectRequest'],
    'GET /api/groups/{id}/posts'              => ['GroupController', 'getPosts'],
    'GET /api/groups/{id}/posts/pending'      => ['GroupController', 'getPendingPosts'],
    'POST /api/groups/{id}/posts'             => ['GroupController', 'createPost'],
    'POST /api/groups/{id}/posts/{id}/process' => ['GroupController', 'processPost'],
    'POST /api/groups/{id}/posts/{id}/comments' => ['GroupController', 'commentOnPost'],
    'GET /api/groups/{id}/posts/{id}/comments'  => ['GroupController', 'getPostComments'],

    // ===== USERS =====
    'GET /api/users/search'                => ['UserController', 'search'],
    'GET /api/users/{id}'                  => ['UserController', 'show'],
    'GET /api/users/{id}/posts'            => ['UserController', 'getUserPosts'],
    'GET /api/users/{id}/photos'           => ['UserController', 'getUserPhotos'],
    'GET /api/users/{id}/groups'           => ['UserController', 'getUserGroups'],
    'GET /api/users/{id}/locations'        => ['UserController', 'getUserLocations'],
    'GET /api/users/{id}/reviews'          => ['UserController', 'getUserReviews'],
    'PUT /api/users/{id}'                  => ['UserController', 'update'],
    'POST /api/users/{id}/avatar/upload'   => ['UserController', 'uploadAvatar'],
    'GET /api/users/{id}/followers'        => ['UserController', 'getFollowers'],
    'GET /api/users/{id}/following'        => ['UserController', 'getFollowing'],
    'PUT /api/users/{id}/password'         => ['UserController', 'changePassword'],
    'DELETE /api/users/{id}'               => ['UserController', 'destroy'],

    // ===== BLOGS =====
    'GET /api/blogs/trending'               => ['BlogController', 'trending'],
    'GET /api/blogs'                        => ['BlogController', 'index'],
    'POST /api/blogs'                       => ['BlogController', 'create'],
    'GET /api/blogs/{id}/comments'          => ['CommentController', 'getCommentsByBlog'],
    'GET /api/blogs/{id}'                   => ['BlogController', 'show'],
    'PUT /api/blogs/{id}'                   => ['BlogController', 'update'],
    'DELETE /api/blogs/{id}'                => ['BlogController', 'destroy'],
    'GET /api/users/{id}/blogs'             => ['BlogController', 'getUserBlogs'],
    'POST /api/blogs/{id}/share'            => ['BlogController', 'share'],
    'POST /api/blogs/{id}/like'             => ['BlogController', 'like'],
    'DELETE /api/blogs/{id}/like'           => ['BlogController', 'unlike'],

    // ===== FOLLOW =====
    'POST /api/follow/{id}'            => ['FollowController', 'follow'],
    'DELETE /api/follow/{id}'          => ['FollowController', 'unfollow'],
    'GET /api/follow/mutual'           => ['FollowController', 'mutual'],
    
    // ===== SEARCH =====
    'GET /api/search'                  => ['SearchController', 'index'],
    
    // ===== CHAT =====
    'GET /api/chats'                   => ['ChatController', 'index'],
    'GET /api/chats/{id}/messages'     => ['ChatController', 'messages'],
    'POST /api/chats/start'            => ['ChatController', 'start'],
    'PUT /api/chats/{id}/status'       => ['ChatController', 'updateStatus'],
    'POST /api/chats/{id}/send'        => ['ChatController', 'sendMessage'],

    // === ADMIN RBAC MODULE ===
    'GET /api/admin/roles'                    => ['AdminSystemController', 'getRoles'],
    'POST /api/admin/roles'                   => ['AdminSystemController', 'createRole'],
    'GET /api/admin/roles/{id}'               => ['AdminSystemController', 'getRole'],
    'PUT /api/admin/roles/{id}'               => ['AdminSystemController', 'updateRole'],
    'DELETE /api/admin/roles/{id}'            => ['AdminSystemController', 'deleteRole'],
    'GET /api/admin/permissions'              => ['AdminSystemController', 'getPermissions'],
    'PUT /api/admin/roles/{id}/permissions'   => ['AdminSystemController', 'updateRolePermissions'],

    // === ADMIN USER MODULE ===
    'GET /api/admin/users'                    => ['AdminUserController', 'index'],
    'GET /api/admin/users/search'             => ['AdminUserController', 'search'],
    'PUT /api/admin/users/{id}'               => ['AdminUserController', 'updateUser'],
    'PUT /api/admin/users/{id}/ban'           => ['AdminUserController', 'ban'],
    'PUT /api/admin/users/{id}/unban'         => ['AdminUserController', 'unban'],
    'DELETE /api/admin/users/{id}'            => ['AdminUserController', 'destroy'],
    'GET /api/admin/users/{id}'               => ['AdminUserController', 'show'],
    'GET /api/admin/users/{id}/content'       => ['AdminUserController', 'getContent'],
    'GET /api/admin/users/{id}/reports'       => ['AdminUserController', 'getReports'],
    'PUT /api/admin/users/{id}/verify'        => ['AdminUserController', 'verify'],
    
    'GET /api/admin/posts'                    => ['AdminContentController', 'posts'],
    'GET /api/admin/posts/{id}'               => ['AdminContentController', 'getPost'],
    'DELETE /api/admin/posts/{id}'            => ['AdminContentController', 'deletePost'],

    'GET /api/admin/blogs'                    => ['AdminContentController', 'blogs'],
    'GET /api/admin/blogs/{id}'               => ['AdminContentController', 'getBlog'],
    'DELETE /api/admin/blogs/{id}'            => ['AdminContentController', 'deleteBlog'],

    'GET /api/admin/trips'                    => ['AdminTripController', 'index'],
    'PUT /api/admin/trips/{id}/status'        => ['AdminTripController', 'updateStatus'],
    'DELETE /api/admin/trips/{id}'            => ['AdminTripController', 'destroy'],

    'GET /api/admin/comments'                 => ['AdminContentController', 'comments'],
    'DELETE /api/admin/comments/{id}'         => ['AdminContentController', 'deleteComment'],
    
    'GET /api/admin/stories'                  => ['AdminContentController', 'stories'],
    'PUT /api/admin/stories/{id}/hide'        => ['AdminContentController', 'hideStory'],
    'DELETE /api/admin/stories/{id}'           => ['AdminContentController', 'deleteStory'],
    
    'GET /api/admin/locations'                => ['AdminSystemController', 'locations'],
    'POST /api/admin/locations'               => ['AdminSystemController', 'createLocation'],
    'PUT /api/admin/locations/{id}'           => ['AdminSystemController', 'updateLocation'],
    'DELETE /api/admin/locations/{id}'        => ['AdminSystemController', 'deleteLocation'],

    'GET /api/admin/groups'                   => ['AdminSystemController', 'groups'],
    'GET /api/admin/groups/stats'             => ['AdminSystemController', 'getGroupStats'],
    'GET /api/admin/groups/{id}'              => ['AdminSystemController', 'getGroupDetail'],
    'GET /api/admin/groups/{id}/posts'        => ['AdminSystemController', 'getGroupPosts'],
    'GET /api/admin/groups/{id}/members'      => ['AdminSystemController', 'getGroupMembers'],
    'GET /api/admin/groups/{id}/analytics'    => ['AdminSystemController', 'getGroupAnalytics'],
    'GET /api/admin/groups/{id}/reports'      => ['AdminSystemController', 'getGroupReports'],
    'PUT /api/admin/groups/{groupId}/reports/{reportId}' => ['AdminSystemController', 'processGroupReport'],
    'PUT /api/admin/groups/{id}/status'       => ['AdminSystemController', 'updateGroupStatus'],
    'DELETE /api/admin/groups/{id}'           => ['AdminSystemController', 'deleteGroup'],
    
    'GET /api/admin/reports'                  => ['AdminSystemController', 'reports'],
    'PUT /api/admin/reports/{id}/process'     => ['AdminSystemController', 'processReport'],
    
    'GET /api/admin/hashtags'                 => ['AdminSystemController', 'hashtags'],
    'POST /api/admin/hashtags'                => ['AdminSystemController', 'createHashtag'],
    'PUT /api/admin/hashtags/{id}'            => ['AdminSystemController', 'updateHashtag'],
    'DELETE /api/admin/hashtags/{id}'         => ['AdminSystemController', 'deleteHashtag'],
    
    'GET /api/admin/tag-categories'           => ['AdminSystemController', 'tagCategories'],
    'POST /api/admin/tag-categories'          => ['AdminSystemController', 'createTagCategory'],
    'PUT /api/admin/tag-categories/{id}'      => ['AdminSystemController', 'updateTagCategory'],
    'DELETE /api/admin/tag-categories/{id}'   => ['AdminSystemController', 'deleteTagCategory'],
    
    'GET /api/admin/stats'                    => ['AdminSystemController', 'stats'],
    'GET /api/admin/audit-logs'               => ['AdminSystemController', 'getAuditLogs'],
    'GET /api/admin/audit-logs/stats'         => ['AdminSystemController', 'getAuditLogStats'],

    // Admin Notifications (🆕 MỚI TRIỂN KHAI)
    'GET /api/admin/notifications/latest'    => ['AdminNotificationController', 'getLatest'],
    'PUT /api/admin/notifications/read-all'  => ['AdminNotificationController', 'markAllAsRead'],
];

// ===== ROUTER LOGIC WITH PARAMS =====
$found = false;
$requestPath = $method . ' ' . $requestUri;

foreach ($routes as $pattern => $handler) {
    $regex = '#^' . preg_replace('#\{[\w]+\}#', '([^/]+)', $pattern) . '$#';
    
    if (preg_match($regex, $requestPath, $matches)) {
        array_shift($matches);
        [$controllerName, $action] = $handler;
        dispatch($controllerName, $action, $matches);
        $found = true;
        break;
    }
}

if (!$found) {
    Response::error('Endpoint không tồn tại', 404, [
        'uri' => $requestUri,
        'method' => $method
    ]);
}

// ===== HELPER FUNCTION =====
function dispatch($controllerName, $action, $params) {
    try {
        // ✅ TỰ ĐỘNG NHẬN DIỆN NAMESPACE DỰA TRÊN TÊN CONTROLLER
        $namespaces = [
            'App\\Controllers\\Api\\',
            'App\\Controllers\\Admin\\'
        ];
        
        $fullClassName = null;
        foreach ($namespaces as $ns) {
            $checkClass = $ns . $controllerName;
            if (class_exists($checkClass)) {
                $fullClassName = $checkClass;
                break;
            }
        }
        
        if (!$fullClassName) {
            Response::error("Controller $controllerName không tồn tại", 500);
            return;
        }
        
        $controller = new $fullClassName();
        
        if (!method_exists($controller, $action)) {
            Response::error("Method $action không tồn tại trong $fullClassName", 500);
            return;
        }
        
        call_user_func_array([$controller, $action], $params);
    } catch (Exception $e) {
        error_log("Dispatch Error: " . $e->getMessage());
        Response::error("Lỗi hệ thống: " . $e->getMessage(), 500);
    } catch (Error $e) {
        error_log("Dispatch Critical Error: " . $e->getMessage());
        Response::error("Lỗi hệ thống nghiêm trọng: " . $e->getMessage(), 500);
    }
}
?>