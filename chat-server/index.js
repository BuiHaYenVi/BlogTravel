const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const PORT = process.env.PORT || 3001;
const INTERNAL_SECRET = process.env.INTERNAL_SYNC_SECRET || "INTERNAL_SYNC_SECRET_2026";

/**
 * 🔒 Cấu hình Database PostgreSQL
 */
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dulichmxh',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

/**
 * 🚀 Khởi tạo HTTP Server xử lý các request nội bộ từ PHP Backend (cURL)
 */
const server = http.createServer((req, res) => {
  // Chỉ chấp nhận POST request cho các endpoint nội bộ
  if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        
        // 🔒 Kiểm tra bảo mật nội bộ
        if (data.secret !== INTERNAL_SECRET) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ status: 'error', message: 'Forbidden' }));
        }

        // --- ROUTING ---
        
        // 1. Khóa người dùng
        if (req.url === "/internal/ban-user") {
          const userId = data.user_id;
          io.to(`user_${userId}`).disconnectSockets(true);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ status: 'success', message: 'User disconnected' }));
        }

        // 2. Bình luận mới (Real-time cho post room)
        if (req.url === "/internal/new-comment") {
          const { post_id, comment } = data;
          io.to(`post_${post_id}`).emit("receive_new_comment", comment);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ status: 'success', message: 'Comment broadcasted' }));
        }

        // 3. Thông báo người dùng mới
        if (req.url === "/internal/new-notification") {
          const { user_id, notification } = data;
          io.to(`user_${user_id}`).emit("new_notification", notification);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ status: 'success', message: 'Notification pushed' }));
        }

        // 4. ✅ THÔNG BÁO ADMIN MỚI (Dành cho Chuông Admin)
        if (req.url === "/internal/new-admin-notification") {
          // data.notification chứa type, data (sender, reason...), time_ago
          io.to("admin_notifications_room").emit("new_admin_notification", data.notification);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ status: 'success', message: 'Admin notification broadcasted' }));
        }

        // Endpoint không hợp lệ
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Endpoint not found' }));

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

/**
 * 📡 Khởi tạo Socket.io với cấu hình CORS chuẩn
 */
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware xác thực JWT cho Socket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Xác thực thất bại"));
  jwt.verify(token, process.env.JWT_SECRET || "PROJECT_DULICH_MXH_SECURE_TOKEN_KEY_2026", (err, decoded) => {
    if (err) return next(new Error("Token không hợp lệ"));
    socket.user = decoded.data;
    next();
  });
});

io.on("connection", (socket) => {
  const userId = socket.user.user_id || socket.user.id;
  const roleId = socket.user.role_id;

  console.log(`[Socket] User connected: ${userId} (Role: ${roleId})`);
  socket.join(`user_${userId}`);

  // Tự động vào phòng Admin nếu có quyền (role_id === 1)
  if (roleId === 1) {
    socket.join("admin_notifications_room");
    console.log(`[Socket] Admin ${userId} joined admin_notifications_room`);
  }

  // --- CÁC SỰ KIỆN CHAT ---

  socket.on("join_room", (roomId) => {
    socket.join(`room_${roomId}`);
  });

  socket.on("join_post_room", (postId) => {
    socket.join(`post_${postId}`);
  });

  socket.on("send_message", async (data) => {
    const { conversationId, receiverId, text } = data;
    const senderId = socket.user.user_id || socket.user.id;
    
    try {
      // Kiểm tra chặn
      const convRes = await pool.query("SELECT status FROM chats WHERE id = $1", [conversationId]);
      if (convRes.rows.length > 0 && convRes.rows[0].status === 'blocked') return;

      // Lưu tin nhắn
      const res = await pool.query(
        "INSERT INTO messages (conversation_id, sender_id, message_text) VALUES ($1, $2, $3) RETURNING *",
        [conversationId, senderId, text]
      );
      const newMessage = res.rows[0];

      // Cập nhật last_message_id và updated_at trong bảng chats
      await pool.query(
        "UPDATE chats SET last_message_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newMessage.id, conversationId]
      );

      // Lấy thông tin người gửi
      const userRes = await pool.query("SELECT username, full_name, avatar FROM users WHERE id = $1", [senderId]);
      const senderInfo = userRes.rows[0] || {};

      const fullMessageData = {
        ...newMessage,
        username: senderInfo.username,
        full_name: senderInfo.full_name,
        avatar: senderInfo.avatar,
        id: newMessage.id.toString()
      };

      // Phát tin nhắn
      io.to(`room_${conversationId}`).emit("new_message", fullMessageData);
      io.to(`user_${receiverId}`).emit("message_notification", {
        conversationId,
        message: fullMessageData
      });
    } catch (err) {
      console.error("[Socket Error] Failed to handle message:", err.message);
    }
  });

  socket.on("typing", (data) => {
    socket.to(`room_${data.conversationId}`).emit("user_typing", {
      userId: userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping
    });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] User disconnected: ${userId}`);
  });
});

server.listen(PORT, () => {
  console.log(`Chat Server running on port ${PORT}`);
});
