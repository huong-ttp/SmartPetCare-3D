import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

interface AuthUser {
  userId: number;
  role: string;
}

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Hybrid Authentication Middleware:
  // Cho phép cả kết nối có token (người dùng đã đăng nhập) và không có token (khách xem slot)
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
          : null);

      if (token) {
        try {
          const secret = process.env.JWT_SECRET || "default_jwt_secret";
          const decoded = jwt.verify(token, secret) as {
            user_id?: number;
            userId?: number;
            role?: string;
          };

          const userId = decoded.user_id || decoded.userId;
          if (userId) {
            socket.data.user = {
              userId,
              role: decoded.role || "owner",
            } as AuthUser;
          }
        } catch (tokenErr) {
          console.warn("[Socket.IO] Invalid token on handshake, continuing as guest:", (tokenErr as Error).message);
          socket.data.user = null;
        }
      } else {
        socket.data.user = null;
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as AuthUser | null;

    if (user) {
      // Tham gia phòng cá nhân theo user_id để nhận thông báo
      const userRoom = `user_${user.userId}`;
      socket.join(userRoom);

      // Tham gia phòng theo vai trò
      const roleRoom = `role_${user.role}`;
      socket.join(roleRoom);

      console.log(`[Socket.IO] User connected: ID=${user.userId}, Role=${user.role}, SocketID=${socket.id}`);
    } else {
      console.log(`[Socket.IO] Guest connected: SocketID=${socket.id}`);
    }

    // Đăng ký nhận cập nhật slot theo ngày
    socket.on("join_slot_room", (payload: { date: string }) => {
      if (payload?.date) {
        const roomName = `slot_${payload.date}`;
        socket.join(roomName);
      }
    });

    // Hủy đăng ký nhận cập nhật slot
    socket.on("leave_slot_room", (payload: { date: string }) => {
      if (payload?.date) {
        const roomName = `slot_${payload.date}`;
        socket.leave(roomName);
      }
    });

    socket.on("disconnect", (reason) => {
      // disconnected
    });
  });

  console.log("[Socket.IO] Server initialized successfully");
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("[Socket.IO] Server has not been initialized yet!");
  }
  return io;
}

/**
 * Phát sự kiện thay đổi slot đặt lịch tới những ai đang xem ngày đó
 */
export function emitSlotUpdate(date: string, extra?: Record<string, any>) {
  if (!io) return;
  const roomName = `slot_${date}`;
  io.to(roomName).emit("slot:updated", {
    date,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

/**
 * Phát thông báo tức thời tới một người dùng cụ thể
 */
export function emitNotificationToUser(userId: number, notification: Record<string, any>) {
  if (!io) return;
  const userRoom = `user_${userId}`;
  io.to(userRoom).emit("notification:new", {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Phát thông báo tới toàn bộ người dùng có một vai trò cụ thể (ví dụ: role 'admin' hoặc 'doctor')
 */
export function emitNotificationToRole(role: "admin" | "doctor" | "owner", notification: Record<string, any>) {
  if (!io) return;
  const roleRoom = `role_${role}`;
  io.to(roleRoom).emit("notification:new", {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Phát sự kiện cập nhật dashboard (Admin hoặc Doctor)
 */
export function emitDashboardUpdate(target?: "admin" | "doctor" | number, data?: Record<string, any>) {
  if (!io) return;
  if (typeof target === "number") {
    io.to(`user_${target}`).emit("dashboard:updated", data || {});
  } else if (target) {
    io.to(`role_${target}`).emit("dashboard:updated", data || {});
  } else {
    io.emit("dashboard:updated", data || {});
  }
}

