/**
 * formatDate.ts
 * Định dạng ngày giờ theo chuẩn Việt Nam.
 */

const VI_LOCALE = "vi-VN";

/**
 * Format ISO string thành DD/MM/YYYY
 * @example formatDate("2025-08-15T09:00:00Z") → "15/08/2025"
 */
export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat(VI_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(isoString));
}

/**
 * Format ISO string thành DD/MM/YYYY HH:mm
 */
export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat(VI_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoString));
}

/**
 * Format relative time (e.g. "3 ngày trước")
 */
export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);

  const rtf = new Intl.RelativeTimeFormat(VI_LOCALE, { numeric: "auto" });

  if (seconds < 60) return rtf.format(-seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.floor(months / 12), "year");
}

/**
 * Tính tuổi thú cưng từ ngày sinh
 */
export function calcAge(dobIso: string | undefined | null): string {
  if (!dobIso) return "—";
  const dob = new Date(dobIso);
  const now = new Date();
  const years = now.getFullYear() - dob.getFullYear();
  const months =
    now.getMonth() - dob.getMonth() + (now.getDate() >= dob.getDate() ? 0 : -1);

  const totalMonths = years * 12 + months;
  if (totalMonths < 1) return "< 1 tháng";
  if (totalMonths < 12) return `${totalMonths} tháng`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y} năm ${m} tháng` : `${y} năm`;
}
