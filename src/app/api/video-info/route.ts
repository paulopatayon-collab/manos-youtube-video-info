import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { NextResponse } from "next/server";

import { isYouTubeUrl, type VideoMetadata } from "@/lib/video";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isVideoMetadata(value: unknown): value is VideoMetadata {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;
  return (
    typeof data.title === "string" &&
    (typeof data.duration === "number" || data.duration === null) &&
    (typeof data.view_count === "number" || data.view_count === null) &&
    (typeof data.upload_date === "string" || data.upload_date === null)
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const url =
    body && typeof body === "object" && "url" in body
      ? (body as { url?: unknown }).url
      : undefined;

  if (typeof url !== "string" || !isYouTubeUrl(url.trim())) {
    return errorResponse("Please enter a valid YouTube video URL.", 400);
  }

  const scriptPath = path.join(process.cwd(), "scripts", "youtube_metadata.py");
  const pythonCommand =
    process.env.PYTHON_COMMAND ?? (process.platform === "win32" ? "python" : "python3");

  try {
    const { stdout } = await execFileAsync(pythonCommand, [scriptPath, url.trim()], {
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    const metadata: unknown = JSON.parse(stdout);

    if (!isVideoMetadata(metadata)) {
      throw new Error("Python returned an invalid response shape.");
    }

    return NextResponse.json(metadata);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Metadata fetch failed:", error);
    }

    const details = error as NodeJS.ErrnoException & { killed?: boolean; stderr?: string };
    if (details.code === "ENOENT") {
      return errorResponse("The server's Python runtime is not configured.", 500);
    }
    if (details.killed || details.code === "ETIMEDOUT") {
      return errorResponse("YouTube took too long to respond. Please try again.", 504);
    }

    return errorResponse(
      "Unable to fetch this video. It may be private, unavailable, or temporarily blocked.",
      502,
    );
  }
}

