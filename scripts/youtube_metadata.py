#!/usr/bin/env python3
"""Fetch basic metadata for a single YouTube video as JSON."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import yt_dlp


YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
    "youtu.be",
}
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


class MetadataError(Exception):
    """Raised when video metadata cannot be returned safely."""


def validate_youtube_url(value: str) -> str:
    """Return a normalized URL or raise an argparse-friendly error."""
    url = value.strip()
    try:
        parsed = urlparse(url)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Invalid URL.") from exc

    hostname = (parsed.hostname or "").lower()
    if parsed.scheme not in {"http", "https"} or hostname not in YOUTUBE_HOSTS:
        raise argparse.ArgumentTypeError("Please provide a valid YouTube video URL.")

    path_parts = [part for part in parsed.path.split("/") if part]
    video_id: str | None = None

    if hostname == "youtu.be" and path_parts:
        video_id = path_parts[0]
    elif parsed.path == "/watch":
        video_id = parse_qs(parsed.query).get("v", [None])[0]
    elif len(path_parts) >= 2 and path_parts[0] in {"embed", "live", "shorts"}:
        video_id = path_parts[1]

    if not video_id or not VIDEO_ID_PATTERN.fullmatch(video_id):
        raise argparse.ArgumentTypeError("Please provide a valid YouTube video URL.")

    return url


def format_upload_date(raw_date: Any) -> str | None:
    """Convert yt-dlp's YYYYMMDD date to ISO-style YYYY-MM-DD."""
    if not isinstance(raw_date, str) or len(raw_date) != 8 or not raw_date.isdigit():
        return None
    return f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:]}"


def fetch_metadata(url: str) -> dict[str, str | int | None]:
    """Extract metadata without downloading the video."""
    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "extract_flat": False,
        "socket_timeout": 15,
    }

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise MetadataError("Could not fetch metadata for this video.") from exc

    if not isinstance(info, dict):
        raise MetadataError("YouTube returned an unexpected response.")

    title = info.get("title")
    if not isinstance(title, str) or not title.strip():
        raise MetadataError("The video metadata did not include a title.")

    duration = info.get("duration")
    view_count = info.get("view_count")

    return {
        "title": title,
        "duration": int(duration) if isinstance(duration, (int, float)) else None,
        "view_count": int(view_count) if isinstance(view_count, (int, float)) else None,
        "upload_date": format_upload_date(info.get("upload_date")),
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch basic metadata for one YouTube video."
    )
    parser.add_argument("url", type=validate_youtube_url, help="YouTube video URL")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Optionally save the JSON result to this file",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()

    try:
        metadata = fetch_metadata(args.url)
    except MetadataError as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 1
    except Exception as exc:  # Keep CLI output machine-readable for unexpected failures.
        print(json.dumps({"error": "Unexpected error while fetching metadata."}), file=sys.stderr)
        print(f"Debug detail: {exc}", file=sys.stderr)
        return 1

    output = json.dumps(metadata, indent=2, ensure_ascii=False)
    print(output)

    if args.output:
        try:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(f"{output}\n", encoding="utf-8")
        except OSError as exc:
            print(json.dumps({"error": f"Could not write output file: {exc}"}), file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
