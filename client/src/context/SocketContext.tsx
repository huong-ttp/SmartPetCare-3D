"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import {
  initSocket,
  getSocket,
  disconnectSocket,
  joinSlotRoom as serviceJoinSlotRoom,
  leaveSlotRoom as serviceLeaveSlotRoom,
} from "@/services/socketService";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinSlotRoom: (date: string) => void;
  leaveSlotRoom: (date: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  joinSlotRoom: () => {},
  leaveSlotRoom: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { info: showInfo, success: showSuccess } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Khởi tạo socket (truyền token nếu đã đăng nhập để xác thực hybrid)
    const s = initSocket(isAuthenticated ? token : null);
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // Lắng nghe thông báo cá nhân real-time
    const onNewNotification = (notif: { title?: string; content?: string; type?: string }) => {
      console.log("[Socket.IO] New notification received:", notif);
      const title = notif.title || "Thông báo mới";
      const message = notif.content || "Bạn có một thông báo mới từ hệ thống.";
      showInfo(message, title);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("notification:new", onNewNotification);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("notification:new", onNewNotification);
    };
  }, [token, isAuthenticated, showInfo]);

  const joinSlotRoom = useCallback((date: string) => {
    serviceJoinSlotRoom(date);
  }, []);

  const leaveSlotRoom = useCallback((date: string) => {
    serviceLeaveSlotRoom(date);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinSlotRoom,
        leaveSlotRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

