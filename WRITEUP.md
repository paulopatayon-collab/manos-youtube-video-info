# Technical Trial Write-Up

## AI tooling

I used OpenAI Codex as a pair-programming tool for this exercise. I gave it the task requirements and used it to help scaffold the project, review edge cases, and speed up repetitive TypeScript/Tailwind work. I directed the architecture, checked the generated code, and iterated on validation, process execution, errors, and documentation rather than treating the first output as finished code.

## What I would change for production

I would move extraction to a separate Python service or background job instead of starting a process inside the web server. That avoids coupling the Next.js instance to Python and fits serverless hosting better. I would add request authentication, per-user/IP rate limiting, structured logs and tracing, metrics, retries with backoff, and a short-lived cache keyed by normalized YouTube video ID. I would also pin and regularly update `yt-dlp`, since YouTube extractor changes can break older versions, and add unit, API integration, and end-to-end tests. For abuse resistance, I would keep the strict host allowlist and apply infrastructure-level egress and execution limits.

## Issues and further debugging

The local PowerShell execution policy blocked the `npm.ps1` shim, so I used `npm.cmd`, which invokes the same npm installation without changing the machine's policy. This machine also had no working Python installation (an old workspace virtualenv referenced another user's removed interpreter), so I could not exercise a live `yt-dlp` call here; the TypeScript checks and production build passed, and the app/API validation path was tested over HTTP. With more time on this machine, I would install Python in an isolated environment, run the CLI against public, unavailable, and malformed URLs, and capture `yt-dlp --verbose` output for any extraction failure. In production I would keep sanitized stderr in server logs while returning safe errors to the client.
