<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Tag;
use App\Utils\Response;
use Exception;

/**
 * Tag Controller - Xử lý API Hashtag & Tags
 */
class TagController extends BaseController {
    
    /**
     * GET /api/tags/search?q=keyword
     */
    public function search() {
        $keyword = $_GET['q'] ?? '';
        
        if (strlen($keyword) < 2) {
            return $this->error('Từ khóa quá ngắn (tối thiểu 2 ký tự)', 422);
        }
        
        $tags = (new Tag())->search($keyword, 10);
        return $this->success('Tìm kiếm thành công', $tags);
    }
    
    /**
     * GET /api/tags/trending
     */
    public function trending() {
        $limit = min(20, max(5, (int)($_GET['limit'] ?? 10)));
        $type = $_GET['type'] ?? 'hashtag'; 
        
        $tags = (new Tag())->getTrending($limit, $type);
        return $this->success('Danh sách thịnh hành', $tags);
    }
    
    /**
     * GET /api/tags/{id}  ← Route dùng {id}, nhưng method nhận $slug (vẫn hoạt động)
     * Lấy thông tin chi tiết của 1 hashtag
     */
    public function show($slug) {  // ← Tên biến $slug vẫn giữ nguyên, không cần đổi
        $tag = (new Tag())->first("slug = :slug", ['slug' => $slug]);
        
        if (!$tag) {
            return $this->error('Hashtag không tồn tại', 404);
        }
        
        $tag['post_count'] = (new Tag())->countPostsByTag($slug);
        return $this->success('Chi tiết hashtag', $tag);
    }
    
    /**
     * GET /api/tags/{id}/posts  ← Route dùng {id}, method nhận $slug
     */
    public function postsByTag($slug) {
        $tag = (new Tag())->first("slug = :slug", ['slug' => $slug]);
        if (!$tag) {
            return $this->error('Hashtag không tồn tại', 404);
        }
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(5, (int)($_GET['limit'] ?? 10)));
        $postType = $_GET['type'] ?? null;
        
        $tagModel = new Tag();
        $posts = $tagModel->getPostsByTag($slug, $page, $limit, $postType);
        $total = $tagModel->countPostsByTag($slug, $postType);
        
        return $this->success('Danh sách bài viết', [
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
        $data = $this->getInput();
        
        if (empty($data['content'])) {
            return $this->error('Thiếu content', 422);
        }
        
        $hashtags = Tag::extractFromContent($data['content']);
        return $this->success('Trích xuất thành công', [
            'hashtags' => $hashtags,
            'count' => count($hashtags)
        ]);
    }

    /**
     * GET /api/tags/onboarding
     */
    public function onboarding() {
        try {
            $tagModel = new Tag();
            $data = $tagModel->getOnboardingTags();
            return $this->success('Danh sách sở thích onboarding', $data);
        } catch (Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
