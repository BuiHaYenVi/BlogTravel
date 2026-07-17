import { create } from 'zustand';
import api from '../../../shared/services/api';

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'moderator' | 'member' | 'owner';
  joinedAt: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  category: string;
  description: string;
  cover: string;
  memberCount: number;
  isJoined: boolean;
  isInvited: boolean;
  inviter_name?: string;
  is_private: boolean;
  owner_id?: string;
  creator_id?: string;
  owner_name?: string;
  owner_avatar?: string;
  members?: GroupMember[];
  rules?: string[];
  posts?: any[];
  pendingPosts?: any[];
  isPending?: boolean;
}

export interface CommunityGroupSummary {
  id: string;
  name: string;
  category: string;
  description: string;
  cover: string;
  memberCount: number;
  isJoined: boolean;
  is_private: boolean;
  owner_id: string;
  owner_name?: string;
  owner_avatar?: string;
  isPending?: boolean;
}

interface GroupState {
  groups: CommunityGroupSummary[];
  currentGroup: CommunityGroup | null;
  loading: boolean;
  loadGroups: (search?: string, category?: string) => Promise<void>;
  loadGroupDetail: (id: string, silent?: boolean) => Promise<void>;
  toggleJoin: (groupId: string) => Promise<void>;
  createPost: (groupId: string, content: string, locationId?: string, images?: File[], title?: string) => Promise<boolean>;
  createGroup: (groupData: any) => Promise<string | null>;
  disbandGroup: (groupId: string) => Promise<boolean>;
  updateCover: (groupId: string, coverFile: File) => Promise<any>;
  sharePost: (postId: string, targetGroupId: string, content: string) => Promise<{success: boolean, message?: string}>;
  searchUsers: (query: string) => Promise<any[]>;
  inviteToGroup: (groupId: string, userId: string) => Promise<boolean>;
  loadJoinRequests: (groupId: string) => Promise<any[]>;
  approveJoinRequest: (groupId: string, userId: string) => Promise<boolean>;
  rejectJoinRequest: (groupId: string, userId: string) => Promise<boolean>;
  loadMyInvitations: () => Promise<any[]>;
  acceptGroupInvite: (groupId: string) => Promise<{success: boolean, message: string}>;
  rejectGroupInvite: (groupId: string) => Promise<{success: boolean, message: string}>;
  updateGroup: (groupId: string, data: any) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  reportPost: (postId: string, reason: string, description: string, type?: string) => Promise<boolean>;
  likePost: (groupId: string, postId: string) => Promise<void>;
  addComment: (groupId: string, postId: string, content: string, parentId?: string) => Promise<boolean>;
  loadPendingPosts: (groupId: string) => Promise<void>;
  processPendingPost: (groupId: string, postId: string, action: 'approved' | 'rejected') => Promise<boolean>;
  assignModerator: (groupId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (groupId: string, userId: string, role: 'admin' | 'moderator' | 'member') => Promise<boolean>;
  kickMember: (groupId: string, userId: string) => Promise<boolean>;
}

const BASE_URL = import.meta.env.VITE_API_URL || '';
const ASSETS_URL = BASE_URL.replace('/api', '');

const formatImageUrl = (path: string | null | undefined) => {
  if (!path) return 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${ASSETS_URL}${path}`;
};

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  loading: false,

  loadGroups: async (search?: string, category?: string) => {
    set({ loading: true });
    try {
      const response = await api.get('groups', { 
        params: { search, category } 
      });
      const mapped = (response.data.data || []).map((item: any) => ({
        id: String(item.id),
        name: item.name,
        category: item.category || 'General',
        description: item.description,
        cover: formatImageUrl(item.cover_image),
        memberCount: parseInt(item.actual_member_count || item.member_count) || 0,
        isJoined: item.is_joined === true || item.is_joined === 't' || item.is_joined === 1 || item.is_joined === '1',
        isInvited: item.is_invited === true || item.is_invited === 't' || item.is_invited === 1 || item.is_invited === '1',
        inviter_name: item.inviter_name,
        is_private: item.is_private === true || item.is_private === 't' || item.is_private === 1 || item.is_private === '1',
        owner_id: String(item.owner_id || item.creator_id),
        owner_name: item.owner_name,
        owner_avatar: item.owner_avatar,
        isPending: item.is_pending === true || item.is_pending === 't' || item.is_pending === 1 || item.is_pending === '1'
      }));
      set({ groups: mapped, loading: false });
    } catch (error) {
      set({ groups: [], loading: false });
    }
  },

  loadGroupDetail: async (id, silent = false) => {
    if (!silent) set({ loading: true });
    try {
      const response = await api.get(`groups/${id}`);
      const item = response.data.data;
      
      if (!item) {
        if (!silent) set({ loading: false });
        return;
      }

      const [membersRes, postsRes] = await Promise.all([
        api.get(`groups/${id}/members`),
        api.get(`groups/${id}/posts`)
      ]);

      const mapped: CommunityGroup = {
        id: String(item.id),
        name: item.name,
        category: item.category || 'General',
        description: item.description,
        cover: formatImageUrl(item.cover_image),
        memberCount: parseInt(item.actual_member_count || item.member_count) || 0,
        isJoined: item.is_joined === true || item.is_joined === 't' || item.is_joined === 1 || item.is_joined === '1',
        isInvited: item.is_invited === true || item.is_invited === 't' || item.is_invited === 1 || item.is_invited === '1',
        inviter_name: item.inviter_name,
        is_private: item.is_private === true || item.is_private === 't' || item.is_private === 1 || item.is_private === '1',
        owner_id: String(item.owner_id || item.creator_id),
        owner_name: item.owner_name,
        owner_avatar: item.owner_avatar,
        isPending: item.is_pending === true || item.is_pending === 't' || item.is_pending === 1 || item.is_pending === '1',
        members: (membersRes.data.data || []).map((m: any) => ({
          id: String(m.id),
          name: m.full_name || m.username || 'Thành viên',
          avatar: m.avatar ? (m.avatar.startsWith('http') ? m.avatar : ASSETS_URL + m.avatar) : 'https://i.pravatar.cc/150?u=' + m.id,
          role: m.role || 'member',
          joinedAt: m.joined_at
        })),
        posts: (postsRes.data.data || []).map((p: any) => {
          let postImages = [];
          let originalImages = [];
          
          try {
            if (Array.isArray(p.images)) postImages = p.images;
            else if (typeof p.images === 'string') postImages = JSON.parse(p.images);
            
            if (p.original_post_id) {
              if (Array.isArray(p.original_images)) originalImages = p.original_images;
              else if (typeof p.original_images === 'string') originalImages = JSON.parse(p.original_images);
            }
          } catch (e) {
            console.error('Lỗi parse images cho post:', p.id, e);
          }

          return {
            ...p,
            id: String(p.id),
            author_name: p.full_name || p.username || 'Thành viên',
            like_count: parseInt(p.like_count) || 0,
            is_liked: p.is_liked === true || p.is_liked === 't' || p.is_liked === 1 || p.is_liked === '1',
            avatar: p.avatar ? (p.avatar.startsWith('http') ? p.avatar : ASSETS_URL + p.avatar) : 'https://i.pravatar.cc/150?u=' + p.user_id,
            images: (postImages || []).map((img: string) => (img && img.startsWith('http')) ? img : ASSETS_URL + img),
            is_share: !!p.original_post_id,
            original_post: p.original_post_id ? {
              content: p.original_content || 'Nội dung bài viết không khả dụng',
              username: p.original_full_name || p.original_username || 'Thành viên',
              avatar: p.original_avatar ? (p.original_avatar.startsWith('http') ? p.original_avatar : ASSETS_URL + p.original_avatar) : 'https://i.pravatar.cc/150?u=orig',
              images: (originalImages || []).map((img: string) => (img && img.startsWith('http')) ? img : ASSETS_URL + img)
            } : null
          };
        }),
        rules: [
          'Tôn trọng các thành viên khác',
          'Không spam hoặc quảng cáo trái phép',
          'Chia sẻ nội dung liên quan đến chủ đề nhóm',
          'Không sử dụng ngôn từ gây kích động'
        ]
      };
      set(state => ({ 
        currentGroup: {
          ...mapped,
          pendingPosts: (state.currentGroup?.id === String(item.id)) ? state.currentGroup.pendingPosts : []
        }, 
        loading: false 
      }));
    } catch (error: any) {
      console.error('LỖI TRONG loadGroupDetail:', error);
      set({ loading: false });
    }
  },

  toggleJoin: async (groupId) => {
    const currentGroup = get().currentGroup;
    const isJoined = currentGroup?.isJoined;
    const isPrivate = currentGroup?.is_private;
    try {
      if (isJoined) {
        await api.delete(`groups/${groupId}/leave`);
        // Optimistically clear pending/joined state
        set(state => ({
          currentGroup: state.currentGroup ? { ...state.currentGroup, isJoined: false, isPending: false } : null
        }));
        get().loadGroupDetail(groupId, true);
      } else {
        await api.post(`groups/${groupId}/join`);
        if (isPrivate) {
          // For private groups: optimistically show "Đang chờ xem xét"
          set(state => ({
            currentGroup: state.currentGroup ? { ...state.currentGroup, isPending: true } : null
          }));
        } else {
          get().loadGroupDetail(groupId, true);
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Vui lòng đăng nhập để thực hiện';
      alert(message);
    }
  },

  createPost: async (groupId, content, locationId?: string, images?: File[], title?: string) => {
    const formData = new FormData();
    formData.append('content', content);
    if (locationId) formData.append('location_id', locationId);
    if (title) formData.append('title', title);
    if (images) {
      images.forEach((img) => formData.append('images[]', img));
    }

    try {
      await api.post(`groups/${groupId}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      get().loadGroupDetail(groupId, true);
      // Nếu là người quản lý thì load lại cả pending posts để cập nhật số lượng
      const role = get().currentGroup?.members?.find(m => String(m.id) === String(api.defaults.headers.common['X-User-Id']))?.role;
      if (role === 'admin' || role === 'owner' || role === 'moderator') {
        get().loadPendingPosts(groupId);
      }
      return true;
    } catch (error: any) {
      alert('Lỗi đăng bài: ' + (error.response?.data?.message || error.message));
      return false;
    }
  },

  createGroup: async (groupData) => {
    set({ loading: true });
    try {
      const response = await api.post('groups', groupData);
      set({ loading: false });
      return String(response.data.data.id);
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
      set({ loading: false });
      return null;
    }
  },

  disbandGroup: async (groupId) => {
    try {
      await api.delete(`groups/${groupId}`);
      set(state => ({
        groups: state.groups.filter(g => g.id !== groupId),
        currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup
      }));
      return true;
    } catch (error) {
      return false;
    }
  },

  updateCover: async (groupId, coverFile) => {
    const formData = new FormData();
    formData.append('cover_image', coverFile);
    const currentName = get().currentGroup?.name;
    if (currentName) {
        formData.append('name', currentName);
    }
    
    const response = await api.post(`groups/${groupId}/update`, formData);
    
    if (response.data.success) {
      const newCoverPath = response.data.data.cover_image;
      if (get().currentGroup?.id === groupId) {
        set(state => ({
          currentGroup: state.currentGroup ? { 
            ...state.currentGroup, 
            cover: formatImageUrl(newCoverPath) 
          } : null
        }));
      }
    }
    return response.data;
  },

  updateGroup: async (groupId, data) => {
    try {
      const response = await api.post(`groups/${groupId}/update`, data);
      if (response.data.success) {
        get().loadGroupDetail(groupId, true);
        return true;
      }
      return false;
    } catch (error: any) {
      alert('Lỗi cập nhật: ' + (error.response?.data?.message || error.message));
      return false;
    }
  },

  deletePost: async (postId) => {
    try {
      const response = await api.delete(`posts/${postId}`);
      if (response.data.success) {
        const currentGroup = get().currentGroup;
        if (currentGroup) {
          set({
            currentGroup: {
              ...currentGroup,
              posts: currentGroup.posts?.filter(p => String(p.id) !== String(postId))
            }
          });
        }
        return true;
      }
      return false;
    } catch (error: any) {
      alert('Lỗi khi xóa bài viết: ' + (error.response?.data?.message || error.message));
      return false;
    }
  },

  reportPost: async (postId, reason, description, type = 'post') => {
    try {
      const response = await api.post('reports', {
        reportable_type: type,
        reportable_id: postId,
        reason,
        description
      });
      return response.data.success;
    } catch (error: any) {
      alert('Lỗi khi báo cáo: ' + (error.response?.data?.message || error.message));
      return false;
    }
  },

  likePost: async (groupId, postId) => {
    try {
      const currentGroup = get().currentGroup;
      if (!currentGroup) return;

      const post = currentGroup.posts?.find(p => String(p.id) === String(postId));
      if (!post) return;

      const isLiked = post.is_liked;
      const response = isLiked 
        ? await api.delete(`posts/${postId}/like`)
        : await api.post(`posts/${postId}/like`);

      if (response.data.success) {
        const newCount = parseInt(response.data.data);
        set(state => ({
          currentGroup: state.currentGroup ? {
            ...state.currentGroup,
            posts: state.currentGroup.posts?.map(p => 
              String(p.id) === String(postId) ? { ...p, is_liked: !isLiked, like_count: newCount } : p
            )
          } : null
        }));
      }
    } catch (error: any) {
      if (error.response?.status === 401) alert('Vui lòng đăng nhập để thả tim!');
      else alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  },

  addComment: async (groupId, postId, content, parentId) => {
    try {
      const response = await api.post(`groups/${groupId}/posts/${postId}/comments`, { 
        content, 
        parent_id: parentId 
      });
      if (response.data.success) {
        get().loadGroupDetail(groupId, true);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  sharePost: async (postId, targetGroupId, content) => {
    try {
      const response = await api.post(`posts/${postId}/share`, {
        target_group_id: targetGroupId,
        content: content
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  searchUsers: async (query) => {
    try {
      const response = await api.get('users/search', { params: { q: query } });
      return response.data.data;
    } catch (error) {
      return [];
    }
  },

  inviteToGroup: async (groupId, userId) => {
    try {
      const response = await api.post(`groups/${groupId}/invite`, { user_id: userId });
      return response.data.success;
    } catch (error) {
      return false;
    }
  },

  loadJoinRequests: async (groupId) => {
    try {
      const response = await api.get(`groups/${groupId}/requests`);
      return response.data.data;
    } catch (error) {
      return [];
    }
  },

  approveJoinRequest: async (groupId, userId) => {
    try {
      const response = await api.put(`groups/${groupId}/requests/${userId}/approve`);
      return response.data.success;
    } catch (error) {
      return false;
    }
  },

  rejectJoinRequest: async (groupId, userId) => {
    try {
      const response = await api.put(`groups/${groupId}/requests/${userId}/reject`);
      return response.data.success;
    } catch (error) {
      return false;
    }
  },

  loadMyInvitations: async () => {
    try {
      const response = await api.get('groups/invitations');
      const data = response.data.data || [];
      return data.map((inv: any) => ({
        ...inv,
        cover: formatImageUrl(inv.cover_image),
        inviter_avatar: inv.inviter_avatar ? (inv.inviter_avatar.startsWith('http') ? inv.inviter_avatar : ASSETS_URL + inv.inviter_avatar) : 'https://i.pravatar.cc/150?u=' + (inv.invited_by_id || inv.owner_id)
      }));
    } catch (error) {
      return [];
    }
  },

  acceptGroupInvite: async (groupId) => {
    try {
      const response = await api.put(`groups/${groupId}/invites/accept`);
      if (response.data.success) {
        if (get().currentGroup?.id === groupId) get().loadGroupDetail(groupId, true);
        return { success: true, message: response.data.message || 'Đã chấp nhận lời mời' };
      }
      return { success: false, message: response.data?.message || 'Thất bại khi chấp nhận lời mời' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Lỗi hệ thống' };
    }
  },

  rejectGroupInvite: async (groupId) => {
    try {
      const response = await api.put(`groups/${groupId}/invites/reject`);
      if (response.data.success) return { success: true, message: response.data.message || 'Đã từ chối lời mời' };
      return { success: false, message: response.data?.message || 'Thất bại khi từ chối lời mời' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Lỗi hệ thống' };
    }
  },

  loadPendingPosts: async (groupId) => {
    try {
      const response = await api.get(`groups/${groupId}/posts/pending`);
      const data = response.data.data || [];
      
      const pending = data.map((p: any) => {
        // Xử lý an toàn cho images
        let imgs: string[] = [];
        try {
          if (Array.isArray(p.images)) {
            imgs = p.images;
          } else if (typeof p.images === 'string') {
            imgs = JSON.parse(p.images);
          }
        } catch (e) {
          console.error('Lỗi parse images cho post:', p.id, e);
        }

        return {
          ...p,
          id: String(p.id),
          author_name: p.full_name || p.username || 'Thành viên ẩn danh',
          avatar: p.avatar ? (p.avatar.startsWith('http') ? p.avatar : ASSETS_URL + p.avatar) : 'https://i.pravatar.cc/150?u=' + p.user_id,
          images: imgs.map((img: string) => (img && img.startsWith('http')) ? img : ASSETS_URL + img)
        };
      });
      
      set(state => ({
        currentGroup: state.currentGroup ? { ...state.currentGroup, pendingPosts: pending } : null
      }));
    } catch (error) {
      console.error('Lỗi load bài viết chờ duyệt:', error);
    }
  },

  processPendingPost: async (groupId, postId, action) => {
    try {
      const response = await api.post(`groups/${groupId}/posts/${postId}/process`, { action });
      if (response.data.success) {
        set(state => ({
          currentGroup: state.currentGroup ? {
            ...state.currentGroup,
            pendingPosts: state.currentGroup.pendingPosts?.filter(p => String(p.id) !== String(postId))
          } : null
        }));
        if (action === 'approved') get().loadGroupDetail(groupId, true);
        return true;
      }
      return false;
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi xử lý bài viết');
      return false;
    }
  },

  assignModerator: async (groupId, userId) => {
    try {
      const response = await api.post(`groups/${groupId}/members/${userId}/role`, { role: 'moderator' });
      if (response.data.success) {
        set(state => ({
          currentGroup: state.currentGroup ? {
            ...state.currentGroup,
            members: state.currentGroup.members?.map(m => 
              String(m.id) === String(userId) ? { ...m, role: 'moderator' } : m
            )
          } : null
        }));
        return true;
      }
      return false;
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi bổ nhiệm');
      return false;
    }
  },

  updateMemberRole: async (groupId, userId, role) => {
    try {
      const response = await api.post(`groups/${groupId}/members/${userId}/role`, { role });
      if (response.data.success) {
        set(state => ({
          currentGroup: state.currentGroup ? {
            ...state.currentGroup,
            members: state.currentGroup.members?.map(m => 
              String(m.id) === String(userId) ? { ...m, role } : m
            )
          } : null
        }));
        return true;
      }
      return false;
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi cập nhật vai trò');
      return false;
    }
  },

  kickMember: async (groupId, userId) => {
    try {
      const response = await api.delete(`groups/${groupId}/members/${userId}`);
      if (response.data.success) {
        set(state => ({
          currentGroup: state.currentGroup ? {
            ...state.currentGroup,
            members: state.currentGroup.members?.filter(m => String(m.id) !== String(userId)),
            memberCount: Math.max(0, (state.currentGroup.memberCount || 0) - 1)
          } : null
        }));
        return true;
      }
      return false;
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi trục xuất thành viên');
      return false;
    }
  }
}));
