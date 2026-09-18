/**
 * notificationService.ts — Thông báo người dùng & Trung tâm nhắc lịch
 */
import axiosClient from "@/lib/axiosClient";
import type {
  Notification,
  ReminderNotification,
  NotificationFilterParams,
  MarkReadDTO,
} from "@/types/notification.type";
import { MOCK_NOTIFICATIONS } from "@/lib/mock";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function mockDelay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function normalizeReminder(raw: any): ReminderNotification {
  const id = raw.notification_id ?? raw.id ?? `n_${Date.now()}`;
  return {
    notification_id: id,
    id: id,
    user_id: raw.user_id,
    pet_id: raw.pet_id ?? null,
    pet_name: raw.pet_name ?? null,
    pet_species: raw.pet_species ?? null,
    pet_avatar: raw.pet_avatar ?? null,
    type: raw.type,
    title: raw.title ?? "Nhắc lịch",
    content: raw.content ?? raw.message ?? "",
    message: raw.message ?? raw.content ?? "",
    is_read: Boolean(raw.is_read),
    scheduled_at: raw.scheduled_at ?? null,
    sent_at: raw.sent_at ?? null,
    created_at: raw.created_at ?? new Date().toISOString(),
    reference_id: raw.reference_id,
    reference_type: raw.reference_type,
  };
}

export const notificationService = {
  /**
   * Lấy danh sách thông báo theo bộ lọc (user, type, unread, limit, page, search)
   * API: notification.service.list({user: me}), notification.service.list({type: [...]})
   */
  async list(params?: NotificationFilterParams): Promise<ReminderNotification[]> {
    if (USE_MOCK) {
      let filtered = MOCK_NOTIFICATIONS.map(normalizeReminder);
      if (params?.type) {
        const types = Array.isArray(params.type) ? params.type : [params.type];
        filtered = filtered.filter((n) => types.includes(n.type));
      }

      if (params?.unread !== undefined) {
        filtered = filtered.filter((n) => n.is_read === !params.unread);
      }

      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(s) ||
            n.content.toLowerCase().includes(s) ||
            (n.pet_name && n.pet_name.toLowerCase().includes(s))
        );
      }

      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (params?.limit) {
        filtered = filtered.slice(0, params.limit);
      }

      return mockDelay(filtered);
    }

    try {
      const queryParams: Record<string, any> = {};
      if (params?.type) {
        queryParams.type = Array.isArray(params.type) ? params.type.join(",") : params.type;
      }
      if (params?.unread !== undefined) {
        queryParams.unread = params.unread;
      }
      if (params?.limit) {
        queryParams.limit = params.limit;
      }
      if (params?.page) {
        queryParams.page = params.page;
      }
      if (params?.offset !== undefined) {
        queryParams.offset = params.offset;
      }

      const res = await axiosClient.get<any>("/notifications", {
        params: queryParams,
      });

      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      return rawList.map(normalizeReminder);
    } catch (err) {
      console.error("[notificationService.list] Failed to fetch notifications:", err);
      throw err;
    }
  },

  /**
   * Lấy tất cả thông báo của người dùng
   */
  async getMyNotifications(): Promise<Notification[]> {
    if (USE_MOCK) return mockDelay(MOCK_NOTIFICATIONS);
    try {
      const res = await axiosClient.get<any>("/notifications");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      return list;
    } catch (err) {
      console.error("[notificationService.getMyNotifications] Error:", err);
      return [];
    }
  },

  /**
   * Đánh dấu 1 thông báo / nhắc lịch đã đọc theo ID
   * API: notification.service.markAsRead(id)
   */
  async markAsRead(id: number | string): Promise<void> {
    if (USE_MOCK) {
      const item = MOCK_NOTIFICATIONS.find(
        (n) => String(n.id) === String(id) || String((n as any).notification_id) === String(id)
      );
      if (item) item.is_read = true;
      return mockDelay(undefined, 100);
    }

    try {
      await axiosClient.put(`/notifications/${id}/read`);
    } catch (error) {
      // Fallback sang patch nếu backend yêu cầu patch
      try {
        await axiosClient.patch(`/notifications/${id}/read`);
      } catch (err) {
        console.error(`[notificationService.markAsRead] Error for id ${id}:`, err);
        throw err;
      }
    }
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc
   * API: notification.service.markAllAsRead()
   */
  async markAllAsRead(): Promise<void> {
    if (USE_MOCK) {
      MOCK_NOTIFICATIONS.forEach((n) => {
        n.is_read = true;
      });
      return mockDelay(undefined, 150);
    }

    try {
      await axiosClient.put("/notifications/read-all");
    } catch (error) {
      try {
        await axiosClient.patch("/notifications/read-all");
      } catch (err) {
        console.error("[notificationService.markAllAsRead] Error:", err);
        throw err;
      }
    }
  },

  /**
   * Alias cho markAllAsRead (backward compatibility)
   */
  async markAllRead(): Promise<void> {
    return this.markAllAsRead();
  },

  /**
   * Đếm số lượng thông báo chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    try {
      const unreadList = await this.list({ unread: true });
      return unreadList.length;
    } catch (err) {
      console.error("[notificationService.getUnreadCount] Error:", err);
      return 0;
    }
  },

  /**
   * Backward compatibility
   */
  async markRead(dto: MarkReadDTO): Promise<void> {
    if (dto.notification_ids && dto.notification_ids.length > 0) {
      await Promise.all(
        dto.notification_ids.map((id) => this.markAsRead(id))
      );
    }
  },
};
