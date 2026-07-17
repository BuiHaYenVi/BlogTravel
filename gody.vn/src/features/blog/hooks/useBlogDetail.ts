import { useState, useCallback } from 'react';
import api from '../../../shared/services/api';
import { PROVINCES } from '../../../services/mock/provinces';

export interface BlogDetail {
  id: string;
  type: string;
  title: string;
  short_intro?: string;
  location_name?: string;
  content: string;
  contentHtml: string;
  author: any;
  likes: number;
  reactions: { type: string; count: number; active: boolean }[];
  comments: any[];
  totalComments: number;
  commentsPage: number;
  hasMoreComments: boolean;
  createdAt: string;
  image?: string;
  images?: string[];
}

export function useBlogDetail() {
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);

  const loadBlog = useCallback(async (id: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setBlog(null);
    }
    try {
      const response = await api.get(`/blogs/${id}`);
      const data = response.data.data;
      
      if (!data) throw new Error('Blog not found');

      const ASSETS_URL = (import.meta.env.VITE_API_URL || '').replace('/api', '');
      const cleanBase = ASSETS_URL.endsWith('/') ? ASSETS_URL : `${ASSETS_URL}/`;
      
      const formatLocalUrl = (path: string | null | undefined) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `${cleanBase}${cleanPath}`;
      };

      const isLiked = !!data.is_liked && (data.is_liked === true || data.is_liked === 1 || data.is_liked === '1' || data.is_liked === 't' || data.is_liked === 'true');

      const rawContent = data.content || '';
      const contentHtml = rawContent.trim().startsWith('<') 
        ? rawContent 
        : rawContent.split('\n').map((p: string) => `<p>${p}</p>`).join('');

      const galleryImages = (data.images || []).map((img: any) => formatLocalUrl(img.url || img)).filter(Boolean) as string[];
      const coverImage = formatLocalUrl(data.cover_image) || (galleryImages[0] || undefined);

      const mapped: BlogDetail = {
        id: String(data.id),
        type: 'blog',
        title: data.title || 'Không tiêu đề',
        short_intro: data.short_intro,
        location_name: data.location_name,
        content: rawContent,
        contentHtml: contentHtml,
        author: {
          id: String(data.user_id),
          name: data.full_name || data.username || 'Thành viên',
          avatar: formatLocalUrl(data.avatar) || 'https://i.pravatar.cc/150?u=' + data.user_id,
          followers: parseInt(data.follower_count) || 0,
          following: parseInt(data.following_count) || 0,
          isFollowing: !!data.is_following && (data.is_following === true || data.is_following === 1 || data.is_following === '1' || data.is_following === 't' || data.is_following === 'true'),
          bio: data.user_bio || 'Yêu du lịch và thích khám phá.',
          provincesCount: parseInt(data.provinces_count) || 0,
          is_verified: data.is_verified === true || data.is_verified === 't' || data.is_verified === '1' || data.is_verified === 1,
          badge_title: data.badge_title || null
        },
        likes: parseInt(data.like_count) || 0,
        reactions: [
          { type: 'heart', count: parseInt(data.like_count) || 0, active: isLiked },
        ],
        comments: [],
        createdAt: data.created_at || new Date().toISOString(),
        image: coverImage,
        images: galleryImages,
        totalComments: 0,
        commentsPage: 1,
        hasMoreComments: false
      };

      // Recursive comment mapper
      const mapComments = (comments: any[]): any[] => {
        return (comments || []).map((c: any) => ({
          id: String(c.id),
          content: c.content,
          author: {
            name: c.full_name || c.username || 'Thành viên',
            avatar: c.avatar || 'https://i.pravatar.cc/100?u=' + c.user_id
          },
          createdAt: c.created_at,
          likes: parseInt(c.like_count) || 0,
          is_liked: !!c.is_liked && (c.is_liked === true || c.is_liked === 1 || c.is_liked === '1' || c.is_liked === 't' || c.is_liked === 'true'),
          replies: mapComments(c.replies || [])
        }));
      };

      // Fetch comments (page 1, limit 10)
      try {
        const commentsRes = await api.get(`/posts/${mapped.id}/comments?page=1&limit=10`);
        const cdata = commentsRes.data.data;
        mapped.comments = mapComments(cdata.comments || cdata || []);
        if (cdata.total !== undefined) {
           mapped.totalComments = cdata.total;
           mapped.hasMoreComments = mapped.comments.length < cdata.total;
        } else {
           mapped.totalComments = mapped.comments.length;
           mapped.hasMoreComments = false;
        }
      } catch (err) {
        console.warn('Fetch comments failed for blog', id);
      }

      setBlog(mapped);
    } catch (error) {
      console.error('Fetch blog detail failed, looking in mock/fallback:', error);
      
      // Tìm trong mock data (hỗ trợ cả ID và Slug)
      let mockFound = false;
      for (const p of PROVINCES) {
        const found = p.experiences.find(exp => exp.id === id || exp.slug === id);
        if (found) {
          const mapped: BlogDetail = {
            id: found.id,
            type: 'blog',
            title: found.title,
            content: found.excerpt + "\n\nNội dung đang được cập nhật...",
            contentHtml: `<p>${found.excerpt}</p><p>Nội dung chi tiết của bài viết đang được cập nhật.</p>`,
            author: {
              id: 'mock-author',
              name: found.author.name,
              avatar: found.author.avatar,
              followers: 1250,
              following: 450,
              isFollowing: false,
              bio: 'Người yêu du lịch và đam mê khám phá.',
              provincesCount: 15
            },
            likes: found.loves,
            reactions: [{ type: 'heart', count: found.loves, active: false }],
            comments: [],
            totalComments: 0,
            commentsPage: 1,
            hasMoreComments: false,
            createdAt: new Date().toISOString(),
            image: found.image
          };
          setBlog(mapped);
          mockFound = true;
          break;
        }
      }

      if (!mockFound) {
        setBlog({
          id: id,
          type: 'blog',
          title: 'Bài viết không tìm thấy',
          content: 'Rất tiếc, bài viết này không tồn tại hoặc đã bị xóa.',
          contentHtml: '<p>Rất tiếc, bài viết này không tồn tại hoặc đã bị xóa.</p>',
          author: { 
            id: 'system',
            name: 'Gody System', 
            avatar: 'https://i.pravatar.cc/100?img=1',
            followers: 0,
            following: 0,
            provincesCount: 0
          },
          likes: 0,
          reactions: [{ type: 'heart', count: 0, active: false }],
          comments: [],
          totalComments: 0,
          commentsPage: 1,
          hasMoreComments: false,
          createdAt: new Date().toISOString(),
          image: undefined     
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreComments = async () => {
    if (!blog || !blog.hasMoreComments || loadingMoreComments) return;
    setLoadingMoreComments(true);
    try {
      const nextPage = blog.commentsPage + 1;
      const response = await api.get(`/posts/${blog.id}/comments?page=${nextPage}&limit=10`);
      const cdata = response.data.data;
      
      const mapComments = (comments: any[]): any[] => {
        return (comments || []).map((c: any) => ({
          id: String(c.id),
          content: c.content,
          author: {
            name: c.full_name || c.username || 'Thành viên',
            avatar: c.avatar || 'https://i.pravatar.cc/100?u=' + c.user_id
          },
          createdAt: c.created_at,
          likes: parseInt(c.like_count) || 0,
          is_liked: !!c.is_liked && (c.is_liked === true || c.is_liked === 1 || c.is_liked === '1' || c.is_liked === 't' || c.is_liked === 'true'),
          replies: mapComments(c.replies || [])
        }));
      };

      const newComments = mapComments(cdata.comments || []);
      
      setBlog(prev => {
        if (!prev) return prev;
        const updatedComments = [...prev.comments, ...newComments];
        return {
          ...prev,
          comments: updatedComments,
          commentsPage: nextPage,
          hasMoreComments: updatedComments.length < cdata.total,
          totalComments: cdata.total
        };
      });
    } catch (error) {
      console.error('Failed to load more comments:', error);
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const loadMoreReplies = async (commentId: string | number) => {
    if (!blog) return;
    try {
      // Find the comment to know current replies_page
      let currentPage = 1;
      const findPage = (list: any[]) => {
        for (const c of list) {
          if (c.id === String(commentId)) {
            currentPage = c.replies_page || 1;
            return;
          }
          if (c.replies) findPage(c.replies);
        }
      };
      findPage(blog.comments);

      const nextPage = currentPage + 1;
      const response = await api.get(`/comments/${commentId}/replies?page=${nextPage}&limit=5`);
      
      if (response.data.success) {
        const cdata = response.data.data;
        const newReplies = cdata.replies || cdata || [];
        
        const mapComments = (comments: any[]): any[] => {
          return (comments || []).map((c: any) => ({
            id: String(c.id),
            content: c.content,
            author: {
              name: c.full_name || c.username || 'Thành viên',
              avatar: c.avatar ? (c.avatar.startsWith('http') ? c.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${c.avatar}`) : 'https://i.pravatar.cc/150?u=default',
              is_verified: c.is_verified === true || c.is_verified === 1 || c.is_verified === '1' || c.is_verified === 't',
              badge_title: c.badge_title || null
            },
            createdAt: c.created_at,
            likes: parseInt(c.like_count) || 0,
            is_liked: !!c.is_liked && (c.is_liked === true || c.is_liked === 1 || c.is_liked === '1' || c.is_liked === 't' || c.is_liked === 'true'),
            replies: []
          }));
        };

        const mappedNewReplies = mapComments(newReplies);

        const updateRepliesRecursive = (list: any[]): any[] => {
          return list.map(c => {
            if (c.id === String(commentId)) {
              const currentReplies = c.replies || [];
              const existingIds = new Set(currentReplies.map((r: any) => r.id));
              const uniqueNewReplies = mappedNewReplies.filter((r: any) => !existingIds.has(r.id));
              
              return { 
                ...c, 
                replies: [...currentReplies, ...uniqueNewReplies],
                replies_page: nextPage,
                replies_total: cdata.total !== undefined ? cdata.total : c.replies_total
              };
            }
            if (c.replies) return { ...c, replies: updateRepliesRecursive(c.replies) };
            return c;
          });
        };
        
        setBlog(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: updateRepliesRecursive(prev.comments)
          };
        });
      }
    } catch (error) {
      console.error('Failed to load more replies:', error);
    }
  };

  const toggleReaction = async (type: string) => {
    if (!blog) return;
    try {
      if (blog.reactions[0].active) {
        await api.delete(`/blogs/${blog.id}/like`);
      } else {
        await api.post(`/blogs/${blog.id}/like`);
      }
      loadBlog(blog.id, true);
    } catch (error: any) {
      console.error('Toggle reaction failed:', error);
      alert('Không thể thực hiện. Vui lòng đăng nhập.');
    }
  };

  const addComment = async (content: string) => {
    if (!blog) return;
    try {
      await api.post(`/posts/${blog.id}/comments`, { content });
      loadBlog(blog.id, true);
    } catch (error: any) {
      console.error('Add comment failed:', error);
      alert('Không thể gửi bình luận. Vui lòng đăng nhập.');
    }
  };

  const addReply = async (commentId: string | number, content: string) => {
    if (!blog) return;
    try {
      await api.post(`/posts/${blog.id}/comments/${commentId}/reply`, { content });
      loadBlog(blog.id, true);
    } catch (error: any) {
      console.error('Add reply failed:', error);
      alert('Không thể trả lời bình luận. Vui lòng thử lại sau.');
    }
  };

  const toggleFollow = async () => {
    if (!blog || !blog.author) return;
    try {
      if (blog.author.isFollowing) {
        await api.delete(`/follow/${blog.author.id}`);
      } else {
        await api.post(`/follow/${blog.author.id}`);
      }
      loadBlog(blog.id, true);
    } catch (error: any) {
      console.error('Toggle follow failed:', error);
      alert('Không thể thực hiện. Vui lòng đăng nhập.');
    }
  };

  const toggleCommentLike = async (commentId: string | number) => {
    if (!blog) return;
    try {
      // Tìm comment đệ quy
      const findCommentRecursive = (comments: any[], id: string): any | null => {
        for (const c of comments) {
          if (c.id === id) return c;
          if (c.replies) {
            const found = findCommentRecursive(c.replies, id);
            if (found) return found;
          }
        }
        return null;
      };

      const commentIdStr = String(commentId);
      const comment = findCommentRecursive(blog.comments, commentIdStr);
      if (!comment) return;

      if (comment.is_liked) {
        await api.delete(`/comments/${commentId}/like`);
      } else {
        await api.post(`/comments/${commentId}/like`);
      }
      loadBlog(blog.id, true);
    } catch (error: any) {
      console.error('Toggle comment like failed:', error);
      alert('Không thể thực hiện. Vui lòng đăng nhập.');
    }
  };

  return {
    blog,
    loading,
    loadingMoreComments,
    loadBlog,
    loadMoreComments,
    loadMoreReplies,
    toggleFollow,
    toggleReaction,
    addComment,
    addReply,
    toggleCommentLike,
  };
}

