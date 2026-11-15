import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

/**
 * Khởi tạo hoặc cập nhật kết nối Socket.IO
 */
export const initSocket = (token?: string | null): Socket => {
  const url = getSocketUrl();

  if (socket) {
    // Nếu socket đã tồn tại và token thay đổi, cập nhật auth và reconnect
    if (token) {
      socket.auth = { token };
    } else {
      socket.auth = {};
    }
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(url, {
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: token ? { token } : {},
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("[Socket.IO Client] Connected to server, socketId:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket.IO Client] Connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket.IO Client] Disconnected:", reason);
  });

  return socket;
};

/**
 * Lấy instance socket hiện tại
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Đăng ký tham gia phòng theo dõi slot ngày cụ thể
 */
export const joinSlotRoom = (date: string) => {
  if (socket && socket.connected) {
    socket.emit("join_slot_room", { date });
  }
};

/**
 * Rời phòng theo dõi slot ngày cụ thể
 */
export const leaveSlotRoom = (date: string) => {
  if (socket && socket.connected) {
    socket.emit("leave_slot_room", { date });
  }
};

