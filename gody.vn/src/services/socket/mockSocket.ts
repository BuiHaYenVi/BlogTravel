type SocketCallback = (data: any) => void;

class MockSocket {
  private listeners: Record<string, SocketCallback[]> = {};
  private timerInt: ReturnType<typeof setInterval> | null = null;

  connect() {
    console.log('[Socket] Connected to mock websocket server.');
    // Simulate incoming global notifications every 30 seconds
    if (this.timerInt) clearInterval(this.timerInt);
    
    this.timerInt = setInterval(() => {
      const types: any[] = [
        { type: 'like', actor: 'Minh Trần', message: '<b>Minh Trần</b> đã thích bài viết của bạn', avatar: 'https://i.pravatar.cc/150?u=minh' },
        { type: 'follow', actor: 'Linh Chi', message: '<b>Linh Chi</b> đã bắt đầu theo dõi bạn', avatar: 'https://i.pravatar.cc/150?u=chi' },
        { type: 'group_post', actor: 'Nhóm Phượt Vi Vu', message: 'Có bài viết mới trong nhóm <b>Phượt Vi Vu</b>', avatar: 'https://i.pravatar.cc/150?u=group' },
        { type: 'trip_reminder', actor: 'Hệ thống', message: '<b>Nhắc nhở:</b> Chuyến đi Đà Lạt của bạn sẽ khởi hành sau 2 ngày!', avatar: '' },
        { type: 'achievement', actor: 'Hệ thống', message: 'Chúc mừng! Bạn đạt danh hiệu <b>Chuyên gia du lịch</b>', avatar: '' },
      ];
      const random = types[Math.floor(Math.random() * types.length)];

      this.emit('notification', {
        id: Date.now(),
        type: random.type,
        actor_name: random.actor,
        actor_avatar: random.avatar,
        message: random.message,
        time: new Date().toISOString()
      });
    }, 20000); // Tăng tần suất lên một chút để dễ test
  }

  disconnect() {
    if (this.timerInt) {
      clearInterval(this.timerInt);
      this.timerInt = null;
    }
    console.log('[Socket] Disconnected.');
  }

  on(event: string, callback: SocketCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: SocketCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  // Trigger from the front-end to mock a server broadcast
  emit(event: string, data: any) {
    console.log(`[Socket] Emit ${event}:`, data);
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const socket = new MockSocket();
