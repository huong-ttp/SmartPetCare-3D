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
  const id = raw?.notification_id ?? raw?.id ?? `n_${Date.now()}`;
  return {
    notification_id: id,
    id: id,
    user_id: raw?.user_id,
    pet_id: raw?.pet_id ?? null,
    pet_name: raw?.pet_name ?? null,
    pet_species: raw?.pet_species ?? null,
    pet_avatar: raw?.pet_avatar ?? null,
    type: raw?.type ?? "system",
    title: raw?.title ?? "Nhắc lịch",
    content: raw?.content ?? raw?.message ?? "",
    message: raw?.message ?? raw?.content ?? "",
    is_read: Boolean(raw?.is_read),
    scheduled_at: raw?.scheduled_at ?? null,
    sent_at: raw?.sent_at ?? null,
    created_at: raw?.created_at ?? new Date().toISOString(),
    reference_id: raw?.reference_id,
    reference_type: raw?.reference_type,
  };
}

/**
 * Tự động chuyển đổi endpoint nếu /notifications bị chặn bởi trình chặn quảng cáo (AdBlock / uBlock / Brave Shields)
 */
let activeEndpoint = "/notifications";

async function requestWithFallback<T = any>(
  path: string,
  method: "get" | "post" | "put" | "patch" | "delete" = "get",
  dataOrConfig?: any,
  config?: any
): Promise<T> {
  const isReadMethod = method === "get" || method === "delete";
  const primaryUrl = `${activeEndpoint}${path}`;

  try {
    if (isReadMethod) {
      return await (axiosClient as any)[method](primaryUrl, dataOrConfig);
    } else {
      return await (axiosClient as any)[method](primaryUrl, dataOrConfig, config);
    }
  } catch (err: any) {
    const isNetworkError =
      !err.response ||
      err.code === "ERR_NETWORK" ||
      err.message === "Network Error" ||
      err.message?.includes("Network Error");

    // Nếu /notifications bị lỗi mạng (thường do adblocker chặn hoặc CORS), fallback sang alias /user-notifications
    if (isNetworkError && activeEndpoint === "/notifications") {
      try {
        const fallbackUrl = `/user-notifications${path}`;
        const res = isReadMethod
          ? await (axiosClient as any)[method](fallbackUrl, dataOrConfig)
          : await (axiosClient as any)[method](fallbackUrl, dataOrConfig, config);
        // Ghi nhớ endpoint hoạt động tốt cho các lần gọi sau
        activeEndpoint = "/user-notifications";
        return res;
      } catch {
        throw err;
      }
    }
    throw err;
  }
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

    // Nếu chưa đăng nhập (không có token), trả về danh sách trống an toàn
    if (typeof window !== "undefined" && !localStorage.getItem("spc_access_token")) {
      return [];
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

      const res = await requestWithFallback<any>("", "get", {
        params: queryParams,
      });

      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      return rawList.map(normalizeReminder);
    } catch (err: any) {
      console.warn("[notificationService.list] Failed to fetch notifications:", err?.message || err);
      // Không crash giao diện hoặc làm xuất hiện màn hình đỏ Next.js khi offline / adblock
      return [];
    }
  },

  /**
   * Lấy tất cả thông báo của người dùng
   */
  async getMyNotifications(): Promise<Notification[]> {
    if (USE_MOCK) return mockDelay(MOCK_NOTIFICATIONS);
    if (typeof window !== "undefined" && !localStorage.getItem("spc_access_token")) {
      return [];
    }

    try {
      const res = await requestWithFallback<any>("", "get");
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      return list;
    } catch (err: any) {
      console.warn("[notificationService.getMyNotifications] Warning:", err?.message || err);
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
      await requestWithFallback(`/${id}/read`, "put");
    } catch {
      // Fallback sang patch nếu backend yêu cầu patch
      try {
        await requestWithFallback(`/${id}/read`, "patch");
      } catch (err) {
        console.warn(`[notificationService.markAsRead] Warning for id ${id}:`, err);
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
      await requestWithFallback("/read-all", "put");
    } catch {
      try {
        await requestWithFallback("/read-all", "patch");
      } catch (err) {
        console.warn("[notificationService.markAllAsRead] Warning:", err);
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
    if (typeof window !== "undefined" && !localStorage.getItem("spc_access_token")) {
      return 0;
    }

    try {
      const unreadList = await this.list({ unread: true });
      return unreadList.length;
    } catch {
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
