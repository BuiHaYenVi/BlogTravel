import { useBlogStore } from '../../features/blog/store/useBlogStore';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export interface PostData {
  title: string;
  content: string;
  type: 'blog' | 'review';
  [key: string]: any;
}

export function usePost() {
  const { user } = useAuthStore();
  const { addBlog } = useBlogStore();
  const navigate = useNavigate();

  const handleCreatePost = async (postData: PostData) => {
    if (!user) {
      alert('Vui lòng đăng nhập để tiếp tục');
      return null;
    }
    
    try {
      if (postData.type === 'blog') {
        const result = await addBlog(postData);
        if (result && result.id) {
          // Trả về ID để Component xử lý navigate (tránh conflict state)
          return result.id;
        }
      } else {
        // Xử lý các loại post khác nếu cần
        navigate(`/destination`);
        return true;
      }
      return null;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  };

  return { handleCreatePost };
}

