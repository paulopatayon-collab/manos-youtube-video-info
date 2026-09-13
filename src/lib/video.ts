export type VideoMetadata = {
  title: string;
  duration: number | null;
  view_count: number | null;
  upload_date: string | null;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol) || !YOUTUBE_HOSTS.has(hostname)) {
      return false;
    }

    if (hostname === "youtu.be") {
      return VIDEO_ID_PATTERN.test(url.pathname.split("/").filter(Boolean)[0] ?? "");
    }

    if (url.pathname === "/watch") {
      return VIDEO_ID_PATTERN.test(url.searchParams.get("v") ?? "");
    }

    const pathMatch = url.pathname.match(/^\/(?:embed|live|shorts)\/([^/]+)/);
    return VIDEO_ID_PATTERN.test(pathMatch?.[1] ?? "");
  } catch {
    return false;
  }
}

export function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null) return "Unavailable";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];

  return parts
    .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, "0")))
    .join(":");
}

export function formatViews(viewCount: number | null): string {
  return viewCount === null ? "Unavailable" : new Intl.NumberFormat("en-US").format(viewCount);
}

export function formatUploadDate(uploadDate: string | null): string {
  if (!uploadDate) return "Unavailable";

  const date = new Date(`${uploadDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return uploadDate;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
