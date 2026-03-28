import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "şimdi";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
