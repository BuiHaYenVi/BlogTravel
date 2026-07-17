<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

require_once __DIR__ . '/../app/utils/Response.php';
require_once __DIR__ . '/../app/config/database.php';

// ✅ Autoloader hỗ trợ cả Api/ và Admin/
spl_autoload_register(function ($class) {
    // Danh sách thư mục chứa Controller (cả Api và Admin)
    $controllerDirs = [
        __DIR__ . '/../app/controllers/Api/',
        __DIR__ . '/../app/controllers/Admin/'  // ← Thêm thư mục Admin
    ];

    foreach ($controllerDirs as $dir) {
        $filePath = $dir . $class . '.php';
        if (file_exists($filePath)) {
            require_once $filePath;
            return true;
        }
    }
    return false;
});

// Ensure CORS headers are sent even for errors
try {
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'];

    $basePath = '/Project_DuLichMXH/public';
    if (stripos($requestUri, $basePath) === 0) {
        $requestUri = substr($requestUri, strlen($basePath));
    }

    $requestUri = str_replace('/index.php', '', $requestUri);

    if (empty($requestUri) || $requestUri[0] !== '/') {
        $requestUri = '/' . $requestUri;
    }

    $routes = [
        // ===== AUTH =====
        'POST /api/auth/register'          => ['AuthController', 'register'],
        'POST /api/auth/login'             => ['AuthController', 'login'],
        'POST /api/auth/logout'            => ['AuthController', 'logout'],
        
        // ===== POSTS =====
        'GET /api/posts'                   => ['PostController', 'index'],
        'POST /api/posts'                  => ['PostController', 'store'],
        'GET /api/posts/{id}'              => ['PostController', 'show'],
        'PUT /api/posts/{id}'              => ['PostController', 'update'],
        'DELETE /api/posts/{id}'           => ['PostController', 'destroy'],
        'POST /api/posts/{id}/like'        => ['PostController', 'like'],
        'DELETE /api/posts/{id}/like'      => ['PostController', 'unlike'],
        
        // ===== COMMENTS =====
        'GET /api/comments/{id}/replies'        => ['CommentController', 'getReplies'],
        'GET /api/posts/{id}/comments'          => ['CommentController', 'index'],
        'POST /api/posts/{id}/comments'         => ['CommentController', 'store'],
        'DELETE /api/comments/{id}' => ['CommentController', 'destroy'],
        'POST /api/posts/{id}/comments/{id}/reply' => ['CommentController', 'reply'],
            
        // ===== HASHTAGS / TAGS =====
        'GET /api/tags/search'        => ['TagController', 'search'],
        'GET /api/tags/trending'      => ['TagController', 'trending'],
        'GET /api/tags/{id}'          => ['TagController', 'show'],
        'GET /api/tags/{id}/posts'    => ['TagController', 'postsByTag'],
        'POST /api/tags/extract'      => ['TagController', 'extract'],

        // ===== REPORTS =====
        'POST /api/reports'                  => ['ReportController', 'store'],
        'GET /api/reports/reasons'           => ['ReportController', 'reasons'],
        'GET /api/reports/{id}'              => ['ReportController', 'show'],
        'GET /api/admin/reports'             => ['ReportController', 'index'],
        'PUT /api/admin/reports/{id}'        => ['ReportController', 'review'],
        'DELETE /api/admin/reports/{id}'     => ['ReportController', 'destroy'],

        // ===== LOCATIONS =====
        'POST /api/locations'              => ['LocationController', 'store'],
        'GET /api/locations'               => ['LocationController', 'index'],
        'GET /api/locations/{id}'          => ['LocationController', 'show'],
        'POST /api/locations/{id}/checkin' => ['LocationController', 'checkin'],
        'POST /api/locations/{id}/review'  => ['LocationController', 'review'],
        
        // ===== GROUPS =====
        'POST /api/groups'                        => ['GroupController', 'create'],
        'GET /api/groups'                         => ['GroupController', 'index'],
        'GET /api/groups/{id}'                    => ['GroupController', 'show'],
        'PUT /api/groups/{id}'                    => ['GroupController', 'update'],
        'DELETE /api/groups/{id}'                 => ['GroupController', 'destroy'],
        'POST /api/groups/{id}/join'              => ['GroupController', 'join'],
        'DELETE /api/groups/{id}/leave'           => ['GroupController', 'leave'],
        'GET /api/groups/{id}/members'            => ['GroupController', 'members'],
        'GET /api/groups/{id}/posts'              => ['GroupController', 'getPosts'],
        'POST /api/groups/{id}/posts'             => ['GroupController', 'createPost'],
        'POST /api/groups/{id}/posts/{id}/comments' => ['GroupController', 'commentOnPost'],
        'GET /api/groups/{id}/posts/{id}/comments'  => ['GroupController', 'getPostComments'],


        // ===== USERS =====
        'GET /api/users/{id}'                  => ['UserController', 'show'],
        'PUT /api/users/{id}'                  => ['UserController', 'update'],
        'PUT /api/users/{id}/avatar'           => ['UserController', 'updateAvatar'],
        'POST /api/users/{id}/avatar/upload'   => ['UserController', 'uploadAvatar'],
        'GET /api/users/{id}/followers'        => ['UserController', 'getFollowers'],
        'GET /api/users/{id}/following'        => ['UserController', 'getFollowing'],
        'PUT /api/users/{id}/password'         => ['UserController', 'changePassword'],


        // ===== BLOGS =====
        'GET /api/blogs'                        => ['BlogController', 'index'],
        'POST /api/blogs'                       => ['BlogController', 'create'],
        'GET /api/blogs/{id}'                   => ['BlogController', 'show'],
        'PUT /api/blogs/{id}'                   => ['BlogController', 'update'],
        'DELETE /api/blogs/{id}'                => ['BlogController', 'destroy'],
        'GET /api/users/{id}/blogs'             => ['BlogController', 'getUserBlogs'],
        'POST /api/blogs/{id}/like'             => ['BlogController', 'like'],
        'DELETE /api/blogs/{id}/like'           => ['BlogController', 'unlike'],

        // ===== FOLLOW =====
        'POST /api/follow/{id}'            => ['FollowController', 'follow'],
        'DELETE /api/follow/{id}'          => ['FollowController', 'unfollow'],
        'GET /api/users/{id}/followers'    => ['FollowController', 'followers'],
        'GET /api/users/{id}/following'    => ['FollowController', 'following'],
        
        // ===== SEARCH =====
        'GET /api/search'                  => ['SearchController', 'index'],
        
        // ===== TRIPS =====
        'POST /api/trips'                  => ['TripController', 'create'],
        'GET /api/trips'                   => ['TripController', 'index'],
        'POST /api/trips/{id}/join'        => ['TripController', 'joinRequest'],
        'PUT /api/trips/{id}/participants/{id}/accept' => ['TripController', 'acceptParticipant'],
        'PUT /api/trips/{id}/participants/{id}/reject' => ['TripController', 'rejectParticipant'],

        // === ADMIN MODULES ===
        'GET /api/admin/users'                    => ['AdminUserController', 'index'],
        'GET /api/admin/users/search'             => ['AdminUserController', 'search'],
        'PUT /api/admin/users/{id}/ban'           => ['AdminUserController', 'ban'],
        'PUT /api/admin/users/{id}/unban'         => ['AdminUserController', 'unban'],
        'DELETE /api/admin/users/{id}'            => ['AdminUserController', 'destroy'],
        'GET /api/admin/users/{id}'               => ['AdminUserController', 'show'],
        
        'GET /api/admin/posts'                    => ['AdminContentController', 'posts'],
        'DELETE /api/admin/posts/{id}'            => ['AdminContentController', 'deletePost'],
        'GET /api/admin/blogs'                    => ['AdminContentController', 'blogs'],
        'DELETE /api/admin/blogs/{id}'            => ['AdminContentController', 'deleteBlog'],
        'GET /api/admin/comments'                 => ['AdminContentController', 'comments'],
        'DELETE /api/admin/comments/{id}'         => ['AdminContentController', 'deleteComment'],
        
        'GET /api/admin/locations'                => ['AdminSystemController', 'locations'],
        'POST /api/admin/locations'               => ['AdminSystemController', 'createLocation'],
        'PUT /api/admin/locations/{id}'           => ['AdminSystemController', 'updateLocation'],
        'DELETE /api/admin/locations/{id}'        => ['AdminSystemController', 'deleteLocation'],
        
        'GET /api/admin/groups'                   => ['AdminSystemController', 'groups'],
        'DELETE /api/admin/groups/{id}'           => ['AdminSystemController', 'deleteGroup'],
        
        'GET /api/admin/reports'                  => ['AdminSystemController', 'reports'],
        'PUT /api/admin/reports/{id}/process'     => ['AdminSystemController', 'processReport'],
        
        'POST /api/admin/notifications/broadcast' => ['AdminSystemController', 'broadcast'],
        
        'GET /api/admin/hashtags'                 => ['AdminSystemController', 'hashtags'],
        'POST /api/admin/hashtags'                => ['AdminSystemController', 'createHashtag'],
        'PUT /api/admin/hashtags/{id}'            => ['AdminSystemController', 'updateHashtag'],
        'DELETE /api/admin/hashtags/{id}'         => ['AdminSystemController', 'deleteHashtag'],
        
        'GET /api/admin/stats'                    => ['AdminSystemController', 'stats'],
        'GET /api/admin/recommendation'           => ['AdminSystemController', 'recommendation'],
        'POST /api/admin/system/backup'           => ['AdminSystemController', 'backup'],
    ];

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

} catch (Throwable $e) {
    Response::error($e->getMessage(), 500);
}

// ===== HELPER FUNCTION =====
function dispatch($controllerName, $action, $params) {
    if (!class_exists($controllerName)) {
        Response::error("Controller $controllerName không tồn tại", 500);
        return;
    }
    
    $controller = new $controllerName();
    
    if (!method_exists($controller, $action)) {
        Response::error("Method $action không tồn tại trong $controllerName", 500);
        return;
    }
    
    call_user_func_array([$controller, $action], $params);
}
?>