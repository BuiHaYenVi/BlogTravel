<?php
namespace App\Models;

class PostMedia extends BaseModel {
    protected $table = 'post_media';
    
    /**
     * Attach images to post
     */
    public function attachToPost($postId, $imageUrls) {
        foreach ($imageUrls as $index => $imageUrl) {
            $this->execute(
                "INSERT INTO {$this->table} (post_id, url, type, order_index)
                 VALUES (:post_id, :url, 'image', :order_index)",
                [
                    'post_id' => $postId,
                    'url' => $imageUrl,
                    'order_index' => $index
                ]
            );
        }
    }
    
    /**
     * Update images for post
     */
    public function updateForPost($postId, $imageUrls) {
        // Delete old
        $this->execute("DELETE FROM {$this->table} WHERE post_id = :post_id", ['post_id' => $postId]);
        
        // Attach new
        if (!empty($imageUrls)) {
            $this->attachToPost($postId, $imageUrls);
        }
    }
    
    /**
     * Get images for post
     */
    public function getForPost($postId) {
        $query = "SELECT * FROM {$this->table}
                  WHERE post_id = :post_id AND type = 'image'
                  ORDER BY order_index ASC";
        return $this->query($query, ['post_id' => $postId]);
    }
}
?>