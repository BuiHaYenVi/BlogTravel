<?php
/**
 * Tag Controller - Xử lý API Hashtag & Tags
 */

// ✅ Quan trọng: Load đúng dependency
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../models/Tag.php';

class TagController {
    
    private function getJsonInput() {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
    
    /**
     * GET /api/tags/search?q=keyword
     */
    public function search() {
        $keyword = $_GET['q'] ?? '';
        
        if (strlen($keyword) < 2) {
            return Response::error('Từ khóa quá ngắn (tối thiểu 2 ký tự)', 422);
        }
        
        $tags = (new Tag())->search($keyword, 10);
        return Response::success('Tìm kiếm thành công', $tags);
    }
    
    /**
     * GET /api/tags/trending
     */
    public function trending() {
        $limit = min(20, max(5, (int)($_GET['limit'] ?? 10)));
        $type = $_GET['type'] ?? 'hashtag'; 
        
        $tags = (new Tag())->getTrending($limit, $type);
        return Response::success('Danh sách thịnh hành', $tags);
    }
    
    /**
     * GET /api/tags/{id}  ← Route dùng {id}, nhưng method nhận $slug (vẫn hoạt động)
     * Lấy thông tin chi tiết của 1 hashtag
     */
    public function show($slug) {  // ← Tên biến $slug vẫn giữ nguyên, không cần đổi
        $tag = (new Tag())->first("slug = :slug", ['slug' => $slug]);
        
        if (!$tag) {
            return Response::error('Hashtag không tồn tại', 404);
        }
        
        $tag['post_count'] = (new Tag())->countPostsByTag($slug);
        return Response::success('Chi tiết hashtag', $tag);
    }
    
    /**
     * GET /api/tags/{id}/posts  ← Route dùng {id}, method nhận $slug
     */
    public function postsByTag($slug) {
        $tag = (new Tag())->first("slug = :slug", ['slug' => $slug]);
        if (!$tag) {
            return Response::error('Hashtag không tồn tại', 404);
        }
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(5, (int)($_GET['limit'] ?? 10)));
        $postType = $_GET['type'] ?? null;
        
        $tagModel = new Tag();
        $posts = $tagModel->getPostsByTag($slug, $page, $limit, $postType);
        $total = $tagModel->countPostsByTag($slug, $postType);
        
        return Response::success('Danh sách bài viết', [
            'tag' => $tag,
            'total' => $total,
            'posts' => $posts,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total_pages' => ceil($total / $limit),
                'has_next' => $page * $limit < $total,
                'has_prev' => $page > 1
            ]
        ]);
    }
    
    /**
     * POST /api/tags/extract
     */
    public function extract() {
        $data = $this->getJsonInput();
        
        if (empty($data['content'])) {
            return Response::error('Thiếu content', 422);
        }
        
        $hashtags = Tag::extractFromContent($data['content']);
        return Response::success('Trích xuất thành công', [
            'hashtags' => $hashtags,
            'count' => count($hashtags)
        ]);
    }
}