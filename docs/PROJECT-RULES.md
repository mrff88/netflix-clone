# Antigravity Workspace Rules & Folder Structure

## Directory Structure

/
├── index.html
├── css/
│ ├── reset.css
│ ├── variables.css
│ ├── layout.css
│ ├── intro.css # Fullscreen Netflix intro / loading animation (N ribbon, crimson zoom, fade-out)
│ ├── views.css # Tab switching for Episodios, Protagonistas, Carta Final
│ └── modal-slider.css # Episode modal and 16:9 photo carousel
├── js/
│ ├── data.js # Complete Spanish copy, episode arrays, cast, and final letter
│ ├── renderer.js # Renders episode grid, protagonists tab, and letter tab
│ ├── slider.js # 2-7 item media carousel (WebP/MP4, arrows, dots, touch swipe, keyboard)
│ ├── audio.js # Ambient background music controller (first-click auto-start, mute/unmute, video ducking)
│ └── app.js # Tab navigation, hash routing, season teaser toast, modal lifecycle
├── assets/
│ ├── audio/
│ │ └── ambient.mp3 # Optional background instrumental/song
│ ├── hero/
│ │ └── cover.webp # Main Hero banner image (16:9)
│ ├── cast/
│ │ ├── karla.webp # Karla Fiorella portrait
│ │ └── jimmy.webp # Jimmy Stalin Rojas portrait
│ └── episodes/
│ ├── 2011/ # 01.webp, 02.webp, 03.webp (3 items)
│ ├── 2014/ # 01.webp, 02.mp4 (video supported)
│ ├── 2025/ # 01.webp through 07.webp (up to 7 items)
│ └── ... # 16 annual folders (2 to 7 media items per year)
└── docs/
├── ADR-001-architecture.md
├── PRD-specifications.md
└── PROJECT-RULES.md

## Coding Standards

- **Zero Dependencies:** Use only native HTML5, CSS3, and Vanilla ES6+ JS. Do not include Tailwind, Bootstrap, Swiper, or jQuery.
- **Netflix Cold-Start Intro Animation:**
  - On initial page load, display a cinematic full-screen Netflix intro / loading animation.
  - Implement using pure CSS3 keyframe animations and semantic SVG/HTML (zero video files or heavy external animation libraries).
  - Features the iconic Netflix crimson (`#E50914`) "N" ribbon / "NUESTRA HISTORIA" typography zoom, light beam flare, and smooth dissolution (~2.5–3 seconds).
  - Automatically fades out to unveil the Top Navbar and Hero Billboard, with support for user dismissal on click or `Escape` key.
  - Respects `prefers-reduced-motion` media queries by bypassing animations and displaying the UI immediately.
- **Dynamic Media Support (2–7 Items):** Carousels dynamically adapt to between 2 and 7 media items per episode. The slide counter (`X / N`) and pagination dots must generate dynamically according to the episode's media array length.
- **Mixed Media Support (WebP & MP4):**
  - Slides can render either `<img>` (standardized 16:9 WebP) or native `<video>` (`.mp4`) tags with `controls` and `playsinline`.
  - When an episode video is played, the ambient background audio must automatically pause/duck. When the video pauses, ends, or the slide advances, ambient audio resumes.
- **Image & Media Fallback Resilience:** Attach an `onerror` handler on `<img>` elements that swaps missing or broken images for a styled SVG/CSS fallback card showing the episode year and title. For broken video sources, render a fallback card.
- **Audio Autoplay & Interaction Lifecycle:** Background ambient music starts playback on the user's first click or touch gesture anywhere on the viewport, adhering to browser autoplay policies while maintaining state sync with the navbar mute button.
- **Hash-Based Navigation & Modals:** URL hash tracks active tabs (`#/episodios`, `#/protagonistas`, `#/carta-final`) and episode modal state (`#/episodio-1` to `#/episodio-16`). Native browser Back button navigation triggers `hashchange` to synchronize open/close states.
- **Clean Separation:** Keep all text, media types, and file paths inside `js/data.js`. Never hardcode episode copy or media paths in `index.html`.
