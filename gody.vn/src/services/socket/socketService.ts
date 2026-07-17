import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    // Nếu socket đang connected thì bỏ qua
    if (this.socket?.connected) return;

    // Nếu socket tồn tại nhưng đã disconnect, reset nó
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Ưu tiên dùng biến môi trường, nếu không ép cứng về localhost:3001
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Đã kết nối Socket Server, id:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] Ngắt kết nối:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Lỗi kết nối:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('[Socket] Không thể gửi, chưa kết nối. Event:', event);
      return;
    }
    this.socket.emit(event, data);
  }
}

export const socketService = new SocketService();
