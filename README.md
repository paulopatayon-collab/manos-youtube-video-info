# YouTube Video Inspector

A small end-to-end technical trial that fetches public YouTube metadata with Python and displays it in a Next.js UI.

## What it includes

- A Python CLI using `yt-dlp` to return title, duration, view count, and upload date as JSON
- Optional JSON file output (`--output`)
- A Next.js App Router API endpoint that safely invokes the Python script
- A TypeScript + Tailwind UI with validation, loading, success, and error states

## Requirements

- Node.js 20+
- Python 3.10+
- A network connection (metadata is requested from YouTube)

## Setup

```bash
npm install
python -m venv .venv
```

Activate the virtual environment:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Install the Python dependency and run the app:

```bash
python -m pip install -r requirements.txt
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If the Python executable is not named `python` on your system, set `PYTHON_COMMAND` before starting Next.js:

```bash
PYTHON_COMMAND=python3 npm run dev
```

PowerShell equivalent:

```powershell
$env:PYTHON_COMMAND = "py"
npm run dev
```

## Run the Python CLI directly

Print metadata to stdout:

```bash
python scripts/youtube_metadata.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

Print it and save the same JSON to a file:

```bash
python scripts/youtube_metadata.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --output video-info.json
```

Example response shape:

```json
{
  "title": "Video title",
  "duration": 213,
  "view_count": 123456,
  "upload_date": "2024-01-31"
}
```

`duration` is expressed in seconds. Fields unavailable from YouTube are returned as `null`.

## API

`POST /api/video-info`

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

The route uses Node's `execFile` (without a shell), passes the URL as a separate argument, enforces a 30-second timeout and 1 MB output limit, and validates the Python response before returning it.

Accepted URL formats include standard watch links, `youtu.be` links, Shorts, live, and embed links. Playlist and channel URLs are intentionally rejected.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
python -m py_compile scripts/youtube_metadata.py
```

See [WRITEUP.md](./WRITEUP.md) for the requested short write-up and production notes.
