# ADR-001: Zero-Build Vanilla Web Architecture & Static Asset Strategy

## Status

Accepted

## Context

We are building a public, interactive Netflix-style single-page web application (_"Temporada 1: Una Historia que Dios Nunca Dejó de Escribir"_ for Karla & Jimmy) featuring 16 annual episodes (2011–2026), character profiles, a final letter, and ambient background music. The project requires zero ongoing hosting costs, zero framework build steps, and clean content separation.

## Decision

1. **Hosting & Access:** Public deployment on **Cloudflare Pages** (static asset hosting with unmetered bandwidth and automatic HTTPS). No login or password gate.
2. **Stack:** Pure semantic HTML5, modern CSS3 (Custom Properties, Grid, Flexbox), and modular Vanilla ES6+ JavaScript (`type="module"`). Zero external CSS/JS libraries.
4. **Year-Partitioned Media Architecture (WebP & MP4 Videos):**
   - All episode media is organized into year-named folders (`assets/episodes/2011/` through `assets/episodes/2026/`), containing between **2 to 7 media items** per year.
   - Images are standardized to uniform dimensions (recommended `1600x900px` 16:9 WebP). Episodes may also contain MP4 video clips (e.g., `assets/episodes/2014/02.mp4`), rendered via `<video controls playsinline>`.
   - When a video plays inside the modal slider, ambient background music automatically pauses, resuming when the video ends or pauses.
   - `assets/audio/ambient.mp3` provides background music initiated on the user's first click or tap anywhere on the screen, adhering to modern browser autoplay policies.
6. **Navigation & Modal State Management:**
   - View tabs (`#/episodios`, `#/protagonistas`, `#/carta-final`) and episode detail modals (`#/episodio-1` through `#/episodio-16`) are driven by URL hash routing.
   - Listening to `hashchange` enables deep linking and allows native browser Back/Forward buttons to navigate between views or dismiss active modals cleanly.
7. **Cold-Load Cinematic Intro Sequence:**
   - To deliver the authentic Netflix streaming atmosphere, the application boots with a zero-dependency CSS3/SVG intro loading animation.
   - Pure CSS keyframe ribbon zoom and fade-out keeps cold-load latency zero, avoids bulky video files, and transitions smoothly into the Hero Billboard after ~2.5s.
   - An interaction (click to skip or continue) organically fulfills the browser's autoplay gesture requirement for background ambient audio.

## Consequences

- **Positive:** Instant cold loads, zero dependency maintenance, authentic Netflix brand identity and emotional immersion, predictable 16:9 framing across every episode slider, seamless video and photo coexistence, and deep-linkable episodes via URL hash.
- **Trade-offs:** Browser autoplay restrictions require waiting for the user's first viewport click/touch before audio can begin; audio state must be synchronized with video playback and navbar UI indicators.
