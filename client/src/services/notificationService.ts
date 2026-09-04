/**
 * notificationService.ts — Thông báo người dùng
 */
import axiosClient from "@/lib/axiosClient";
import type { Notification, MarkReadDTO } from "@/types/notification.type";
import { MOCK_NOTIFICATIONS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const notificationService = {
  async getMyNotifications(): Promise<Notification[]> {
    if (USE_MOCK) return mockDelay(MOCK_NOTIFICATIONS);
    const res = await axiosClient.get<Notification[]>("/notifications");
    return res.data;
  },

  async markRead(dto: MarkReadDTO): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await axiosClient.patch("/notifications/read", dto);
  },

  async markAllRead(): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await axiosClient.patch("/notifications/read-all");
  },
};
