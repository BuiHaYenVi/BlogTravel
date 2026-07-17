import { create } from 'zustand';
import httpClient from '../../../services/api/httpClient';
import { socketService } from '../../../services/socket/socketService';

export interface ChatMessage {
  id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  pending?: boolean; // optimistic flag
}

export interface ChatUser {
  id: string;
  username: string;
  full_name: string;
  avatar: string;
}

export interface Conversation {
  id: string;
  user: ChatUser;
  status: 'pending' | 'accepted' | 'blocked';
  last_message?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  unreadCount?: number;
}

interface ChatState {
  conversations: Conversation[];
  activeChats: Conversation[];
  friends: ChatUser[];
  isListOpen: boolean;
  fetchConversations: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  openChat: (userId: string) => Promise<void>;
  closeChat: (convId: string) => void;
  sendMessage: (convId: string, receiverId: string, text: string) => Promise<void>;
  updateStatus: (convId: string, status: 'accepted' | 'blocked') => Promise<void>;
  toggleList: () => void;
  initSocket: (token: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeChats: [],
  friends: [],
  isListOpen: false,

  toggleList: () => set((state) => ({ isListOpen: !state.isListOpen })),

  fetchFriends: async () => {
    try {
      const res: any = await httpClient.get('follow/mutual');
      if (res.success && res.data && res.data.friends) {
        const friendsList = res.data.friends.map((f: any) => ({
          id: f.id.toString(),
          username: f.username,
          full_name: f.full_name || f.username,
          avatar: f.avatar,
        }));
        set({ friends: friendsList });
      }
    } catch (err) {
      console.error('[Chat] fetchFriends error:', err);
    }
  },

  fetchConversations: async () => {
    try {
      const res: any = await httpClient.get('chats');
      if (res.success) {
        const convs = res.data.map((c: any) => ({
          id: c.id.toString(),
          user: {
            id: c.user_id.toString(),
            username: c.username,
            full_name: c.full_name,
            avatar: c.avatar,
          },
          status: c.status,
          last_message: c.last_message,
          messages: [],
          unreadCount: 0,
        }));
        set({ conversations: convs });
      }
    } catch (err) {
      console.error('[Chat] fetchConversations error:', err);
    }
  },

  openChat: async (userId) => {
    try {
      if (!userId) {
        console.error('[Chat] Cannot open chat: userId is empty');
        return;
      }
      
      console.log('[Chat] Sending request to start chat with user_id:', userId);

      const res: any = await httpClient.post('chats/start', { user_id: userId });

      if (!res.success) {
        console.error('[Chat] Start chat failed:', res.message);
        return;
      }

      const convData = res.data;
      const { conversations, activeChats } = get();

      let conv = conversations.find((c) => c.id === convData.id.toString());

      // Nếu conversation chưa có trong local state, fetch user info
      if (!conv) {
        console.log('[Chat] Fetching user info for userId:', userId);
        const userRes: any = await httpClient.get(`users/${userId}`);
        conv = {
          id: convData.id.toString(),
          user: {
            id: userRes.data?.id?.toString() || userId,
            username: userRes.data?.username || '',
            full_name: userRes.data?.full_name || '',
            avatar: userRes.data?.avatar || '',
          },
          status: convData.status,
          messages: [],
          unreadCount: 0,
        };
        set({ conversations: [conv, ...conversations] });
      }

      // Nếu đã đang active, focus lại (đưa lên cuối = hiển thị ngoài cùng bên phải)
      const existingActive = activeChats.find((c) => c.id === conv!.id);
      if (existingActive) {
        console.log('[Chat] Already active, focusing:', conv.id);
        set({
          activeChats: [
            ...activeChats.filter((c) => c.id !== conv!.id),
            existingActive,
          ],
          isListOpen: false,
        });
        return;
      }

      // Load lịch sử tin nhắn
      try {
        const msgRes: any = await httpClient.get(`chats/${conv.id}/messages`);
        conv = { ...conv, messages: msgRes.data || [] };
      } catch (e) {
        console.warn('[Chat] Could not load messages:', e);
        conv = { ...conv, messages: [] };
      }

      // Thêm vào active (max 3 cửa sổ)
      const newActiveChats = [...activeChats, conv].slice(-3);
      set({ activeChats: newActiveChats, isListOpen: false });

      // Join socket room
      socketService.emit('join_room', conv.id);
      console.log('[Chat] Joined room:', conv.id);
    } catch (error) {
      console.error('[Chat] Error in openChat:', error);
    }
  },

  closeChat: (convId) =>
    set((state) => ({
      activeChats: state.activeChats.filter((c) => c.id !== convId),
    })),

  sendMessage: async (convId, receiverId, text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const tempId = `temp_${Date.now()}`;
    const currentUserId = (() => {
      try {
        const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        return auth?.state?.user?.id?.toString() || '';
      } catch {
        return '';
      }
    })();

    // ✅ Optimistic update: thêm tin nhắn vào UI ngay lập tức
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender_id: currentUserId,
      message_text: trimmedText,
      created_at: new Date().toISOString(),
      pending: true,
    };

    set((state) => ({
      activeChats: state.activeChats.map((c) =>
        c.id === convId
          ? { ...c, messages: [...c.messages, optimisticMessage], last_message: trimmedText }
          : c
      ),
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, last_message: trimmedText } : c
      ),
    }));

    // ✅ Gửi qua Socket nếu đang kết nối
    if (socketService.isConnected()) {
      socketService.emit('send_message', {
        conversationId: convId,
        receiverId,
        text: trimmedText,
      });
      // Xóa pending flag sau khi socket emit (socket server sẽ echo lại qua new_message)
      return;
    }

    // ⚠️ Fallback: Gửi qua HTTP nếu socket không kết nối
    console.warn('[Chat] Socket not connected, falling back to HTTP');
    try {
      const res: any = await httpClient.post(`chats/${convId}/send`, {
        text: trimmedText,
        receiver_id: receiverId,
      });

      if (res.success) {
        const realMessage = res.data;
        // Thay thế optimistic message bằng real message
        set((state) => ({
          activeChats: state.activeChats.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === tempId ? { ...realMessage, id: realMessage.id.toString() } : m
                  ),
                }
              : c
          ),
        }));
      } else {
        // Rollback nếu HTTP cũng fail
        set((state) => ({
          activeChats: state.activeChats.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.filter((m) => m.id !== tempId) }
              : c
          ),
        }));
      }
    } catch (err) {
      console.error('[Chat] HTTP fallback failed:', err);
      // Rollback optimistic message
      set((state) => ({
        activeChats: state.activeChats.map((c) =>
          c.id === convId
            ? { ...c, messages: c.messages.filter((m) => m.id !== tempId) }
            : c
        ),
      }));
    }
  },

  updateStatus: async (convId, status) => {
    try {
      const res: any = await httpClient.put(`chats/${convId}/status`, { status });
      if (res.success) {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === convId ? { ...c, status } : c
          ),
          activeChats: state.activeChats.map((c) =>
            c.id === convId ? { ...c, status } : c
          ),
        }));
        socketService.emit('status_updated', { conversationId: convId, status });
      }
    } catch (err) {
      console.error('[Chat] updateStatus error:', err);
    }
  },

  initSocket: (token) => {
    socketService.connect(token);

    // ✅ Off trước để tránh duplicate listeners khi initSocket gọi lại
    const handleNewMessage = (message: any) => {
      const msgConvId = message.conversation_id?.toString();
      set((state) => ({
        activeChats: state.activeChats.map((c) => {
          if (c.id !== msgConvId) return c;

          // Loại bỏ optimistic message trùng (nếu có) trước khi add real message
          const filteredMessages = c.messages.filter(
            (m) => !m.pending || m.message_text !== message.message_text
          );

          return {
            ...c,
            messages: [
              ...filteredMessages,
              { ...message, id: message.id.toString() },
            ],
            last_message: message.message_text,
          };
        }),
        conversations: state.conversations.map((c) =>
          c.id === msgConvId ? { ...c, last_message: message.message_text } : c
        ),
      }));
    };

    const handleMessageNotification = () => {
      get().fetchConversations();
    };

    const handleStatusUpdated = (data: any) => {
      const convId = data.conversationId?.toString();
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === convId ? { ...c, status: data.status } : c
        ),
        activeChats: state.activeChats.map((c) =>
          c.id === convId ? { ...c, status: data.status } : c
        ),
      }));
    };

    const handleUserTyping = (data: any) => {
      const convId = data.conversationId?.toString();
      set((state) => ({
        activeChats: state.activeChats.map((c) =>
          c.id === convId ? { ...c, isTyping: data.isTyping } : c
        ),
      }));
    };

    // Xóa listener cũ rồi đăng ký lại
    socketService.off('new_message', handleNewMessage);
    socketService.off('message_notification', handleMessageNotification);
    socketService.off('status_updated', handleStatusUpdated);
    socketService.off('user_typing', handleUserTyping);

    socketService.on('new_message', handleNewMessage);
    socketService.on('message_notification', handleMessageNotification);
    socketService.on('status_updated', handleStatusUpdated);
    socketService.on('user_typing', handleUserTyping);
  },
}));
