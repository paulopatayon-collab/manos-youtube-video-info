"use client";

import { FormEvent, useState } from "react";

import {
  formatDuration,
  formatUploadDate,
  formatViews,
  isYouTubeUrl,
  type VideoMetadata,
} from "@/lib/video";

const EXAMPLE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

export default function Home() {
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = url.trim();

    setError(null);
    setVideo(null);

    if (!isYouTubeUrl(normalizedUrl)) {
      setError("Enter a valid YouTube video URL.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/video-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      const data: VideoMetadata | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "Could not fetch the video.");
      }

      setVideo(data as VideoMetadata);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-16 sm:px-8">
      <section className="mb-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-3 py-1 text-sm font-medium text-red-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          YouTube Metadata
        </div>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Inspect a video in seconds.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          Paste a public YouTube URL to retrieve its title, duration, views, and upload date.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7">
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="video-url" className="block text-sm font-semibold text-slate-800">
            YouTube video URL
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="video-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isLoading}
              aria-describedby="url-help form-error"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-w-28 items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-red-400"
            >
              {isLoading ? "Fetching…" : "Fetch"}
            </button>
          </div>
          <p id="url-help" className="mt-2 text-sm text-slate-500">
            Try the{" "}
            <button
              type="button"
              onClick={() => setUrl(EXAMPLE_URL)}
              className="font-medium text-red-700 underline decoration-red-200 underline-offset-2 hover:decoration-red-600"
            >
              example URL
            </button>
            .
          </p>
        </form>

        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div id="form-error" role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {video && (
            <article className="mt-7 border-t border-slate-200 pt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-red-600">Video found</p>
              <h2 className="mt-2 text-2xl font-bold leading-snug text-slate-950">{video.title}</h2>
              <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetadataItem label="Duration" value={formatDuration(video.duration)} />
                <MetadataItem label="Views" value={formatViews(video.view_count)} />
                <MetadataItem label="Uploaded" value={formatUploadDate(video.upload_date)} />
              </dl>
            </article>
          )}
        </div>
      </section>

      <p className="mt-5 text-center text-xs text-slate-500">
        Public metadata only. The video itself is never downloaded.
      </p>
    </main>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

