# Product Requirements Document (PRD): Karla & Jimmy Netflix Tribute

## 1. Visual Identity & Design System

- **Theme:** Cinematic dark mode (`#141414` main canvas, `#181818` elevated cards/modals, `#222222` hover states, `#E50914` Netflix crimson accent, `#FFFFFF` primary text, `#A3A3A3` secondary metadata).
- **Typography:** `'Inter'`, `'Helvetica Neue'`, sans-serif for UI and episode narratives; `'Playfair Display'`, Georgia, serif for the Final Letter typography.

## 2. Navigation & View Architecture (Option B: Dedicated Top Tabs & Hash Routing)

1. **Sticky Top Navbar:**
   - Transitions from transparent gradient to solid `#141414` on scroll.
   - **Left:** Series brand mark (`NUESTRA HISTORIA`) + primary navigation tabs:
     - `Episodios` (Default active view `#/episodios`: Hero Billboard + Season selector + 16-episode grid)
     - `Protagonistas` (Spotlight view `#/protagonistas` for Karla Fiorella & Jimmy Stalin Rojas)
     - `Carta Final` (Cinematic reading view `#/carta-final` for _"Una Carta para mi Esposa"_)
   - **Right:** Floating circular **Audio Mute/Unmute Toggle** (`🔇` / `🔊`) with subtle equalizer animation when playing.
2. **URL Hash Routing:**
   - Tabs update the hash to `#/episodios`, `#/protagonistas`, and `#/carta-final`.
   - Opening an episode modal updates the hash to `#/episodio-{id}` (e.g., `#/episodio-1`).
   - Browser Back and Forward buttons listen to `hashchange` to navigate views and dismiss modals seamlessly without full page reload.

## 3. View Specifications

0. **Netflix Cold-Start Intro Screen (Loading Animation):**
   - Fullscreen cinematic intro overlay (`#141414` canvas) triggered on initial page load.
   - **Visual Animation Sequence:**
     - Center-stage Netflix-style crimson (`#E50914`) "N" ribbon / "NUESTRA HISTORIA" typography reveal.
     - Keyframe scale-up, glowing light streak beam, and smooth dissolution (~2.5–3.0s duration).
     - Smooth opacity fade-out unveils the Sticky Top Navbar and Hero Billboard.
   - **Interaction & Audio Trigger:**
     - Auto-dismisses seamlessly when the animation completes.
     - Click anywhere or press `Escape`/`Enter` to skip immediately.
     - Clicking anywhere on this splash fulfills the browser gesture requirement, starting ambient background audio.
   - **Accessibility:** Honors `prefers-reduced-motion` by bypassing the animation sequence and revealing the application immediately.
1. **Episodios View (Home):**
   - **Hero Billboard:** Full-bleed widescreen backdrop (`assets/hero/cover.webp`), bottom/left dark vignette gradients, `N SERIE ORIGINAL` badge, title _"Una Historia que Dios Nunca Dejó de Escribir"_, subtitle _"Karla & Jimmy • 2011 – 2026 • 16 Episodios"_, primary CTA `▶ Ver Episodio 1`, and secondary CTA `✉ Leer Carta Final` (switches to `Carta Final` tab).
   - **Season Selector Bar:** Interactive dropdown/pill selector defaulting to `Temporada 1 (2011–2026)` with a disabled/teaser second option: `Temporada 2 (Próximamente — Escribiendo nuevos capítulos...)` that displays a subtle toast message if clicked.
   - **16-Episode Grid:** Responsive grid (`4 columns` desktop, `2 columns` tablet, `1 column` mobile) displaying uniform 16:9 cover thumbnails, episode badge (`EPISODIO X • YYYY`), title, and 2-line clamped narrative preview.
3. **Episode Detail Modal + 2–7 Media Slider (Photos & Video):**
   - Opens on clicking any episode card (and deep-linked via `#/episodio-{id}`).
   - **Top Media Stage:** Uniform 16:9 carousel rendering 2 to 7 media items per episode from `assets/episodes/YYYY/`:
     - **Image slides:** Render `<img>` (standard 16:9 WebP) with `onerror` fallback cards.
     - **Video slides:** Render `<video controls playsinline preload="metadata">` (e.g., `assets/episodes/2014/02.mp4`). Playing a video automatically pauses the ambient background music; pausing/ending the video or advancing the slide resumes ambient audio.
     - **Navigation & Controls:** Left/Right navigation arrows, dynamic slide counter (`X / N` where `N` is 2–7), dynamic pagination dots, full keyboard support (`ArrowLeft`, `ArrowRight`, `Escape`), and touch-swipe gestures with vertical scroll disambiguation.
   - **Bottom Narrative Panel:** Episode number, year, full title, complete multi-paragraph story, and `Siguiente Episodio →` button (advances directly to Ep `N+1` or switches to `Carta Final` after Ep 16).
5. **Protagonistas Tab:**
   - Editorial two-column character showcase featuring **Ella: Karla Fiorella** and **Él: Jimmy Stalin Rojas** with dedicated portraits (`assets/cast/karla.webp`, `assets/cast/jimmy.webp`), role tags, and full biographical tributes.
7. **Carta Final Tab:**
   - Focused, distraction-free dark cinema reader presenting _"Escena Final: Una Carta para mi Esposa"_ with generous line-height, subtle warm ambient glow, and Jimmy's signature block.

## 4. Audio Specifications

- `<audio id="bg-music" src="assets/audio/ambient.mp3" loop preload="metadata"></audio>`
- **First-Interaction Autoplay:** To comply with browser autoplay policies while maintaining cinematic immersion, background audio begins playing on the user's first click or touch interaction anywhere on the screen.
- **Controls & Video Ducking:** Clicking the navbar audio button toggles playback. If an episode video is played, background audio is automatically paused, and automatically resumed once the video stops or slide changes.
