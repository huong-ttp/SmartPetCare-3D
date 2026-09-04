/**
 * cn.ts — className merge utility
 * Combines multiple class strings, filtering falsy values.
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
