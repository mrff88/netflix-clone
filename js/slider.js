/**
 * slider.js - Vanilla ES6+ 16:9 Media Carousel (Photos & Video)
 * Karla & Jimmy Netflix Tribute
 *
 * Capabilities:
 * - Dynamic 2 to 7 media items per episode (WebP images and MP4 video clips).
 * - High-performance touch swipe with vertical scroll disambiguation.
 * - Dynamic slide counter (X / N) and interactive pagination dots.
 * - Keyboard navigation (ArrowLeft, ArrowRight, Escape).
 * - Automatic background audio ducking when in-slide video plays.
 * - Image fallback resilience with inline SVG fallback cards.
 */

import { pauseAudioForMedia, resumeAudioAfterMedia } from './audio.js';

export class EpisodeSlider {
  /**
   * @param {HTMLElement} containerElement - Container holding the slider stage
   * @param {Array<string>} mediaItems - Array of 2 to 7 media file paths
   * @param {Object} episodeInfo - Episode metadata { number, year, title }
   * @param {Function} onCloseCallback - Optional callback when Escape is pressed
   */
  constructor(containerElement, mediaItems = [], episodeInfo = {}, onCloseCallback = null) {
    this.container = containerElement;
    this.mediaItems = mediaItems;
    this.episodeInfo = episodeInfo;
    this.onClose = onCloseCallback;
    this.currentIndex = 0;
    this.totalSlides = mediaItems.length;

    // Touch gesture tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCurrentX = 0;
    this.touchCurrentY = 0;
    this.isSwiping = false;
    this.swipeThreshold = 45; // Minimum px to trigger a slide transition

    // Bound listeners for clean destruction
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    this.render();
    this.attachEvents();
  }

  /**
   * Build the carousel DOM structure inside the container.
   */
  render() {
    this.container.innerHTML = `
      <div class="slider-stage" role="region" aria-label="Galería del Episodio ${this.episodeInfo.number}">
        <div class="slider-track" style="transform: translateX(0%);">
          ${this.mediaItems.map((item, index) => this.renderSlide(item, index)).join('')}
        </div>

        ${
          this.totalSlides > 1
            ? `
          <button class="slider-arrow slider-arrow-prev" aria-label="Fotografía anterior" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button class="slider-arrow slider-arrow-next" aria-label="Siguiente fotografía" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        `
            : ''
        }

        <div class="slider-counter" aria-live="polite">1 / ${this.totalSlides}</div>

        <div class="slider-dots" role="tablist" aria-label="Seleccionar diapositiva">
          ${this.mediaItems
            .map(
              (_, index) => `
            <button class="slider-dot ${index === 0 ? 'active' : ''}" 
                    role="tab" 
                    aria-selected="${index === 0}" 
                    aria-label="Ir a diapositiva ${index + 1} de ${this.totalSlides}" 
                    data-index="${index}" 
                    type="button"></button>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    this.stage = this.container.querySelector('.slider-stage');
    this.track = this.container.querySelector('.slider-track');
    this.counter = this.container.querySelector('.slider-counter');
    this.dots = Array.from(this.container.querySelectorAll('.slider-dot'));
    this.prevBtn = this.container.querySelector('.slider-arrow-prev');
    this.nextBtn = this.container.querySelector('.slider-arrow-next');

    // Attach video ducking listeners for any video slides
    const videos = this.container.querySelectorAll('video');
    videos.forEach((video) => {
      video.addEventListener('play', () => pauseAudioForMedia());
      video.addEventListener('pause', () => resumeAudioAfterMedia());
      video.addEventListener('ended', () => resumeAudioAfterMedia());
    });
  }

  /**
   * Render individual slide item (Image or Video) with fallback handling.
   */
  renderSlide(item, index) {
    const isVideo = item.endsWith('.mp4') || item.endsWith('.webm');
    const { year, title } = this.episodeInfo;

    if (isVideo) {
      return `
        <div class="slider-slide" data-slide-index="${index}">
          <div class="media-aspect-ratio">
            <video src="${item}" 
                   controls 
                   playsinline 
                   preload="metadata" 
                   aria-label="Video del episodio ${year} - ${title}">
              Tu navegador no soporta reproducción de video HTML5.
            </video>
          </div>
        </div>
      `;
    }

    return `
      <div class="slider-slide" data-slide-index="${index}">
        <div class="media-aspect-ratio">
          <img src="${item}" 
               alt="${title} (${year}) - Foto ${index + 1}" 
               loading="${index === 0 ? 'eager' : 'lazy'}"
               onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'fallback-card\\'><div class=\\'fallback-year\\'>${year}</div><div class=\\'fallback-title\\'>${title}</div><div class=\\'fallback-hint\\'>Recuerdo ${index + 1}</div></div>';" />
        </div>
      </div>
    `;
  }

  /**
   * Bind event listeners for arrows, dots, keyboard, and touch swipe.
   */
  attachEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    this.dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        const targetIndex = parseInt(e.currentTarget.dataset.index, 10);
        this.goTo(targetIndex);
      });
    });

    // Keyboard support
    window.addEventListener('keydown', this.handleKeydown);

    // Touch gesture events on stage
    if (this.stage) {
      this.stage.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      this.stage.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      this.stage.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
  }

  /**
   * Navigate to target slide index.
   */
  goTo(index) {
    if (index < 0) {
      index = this.totalSlides - 1; // Circular loop
    } else if (index >= this.totalSlides) {
      index = 0; // Circular loop
    }

    if (index === this.currentIndex) return;

    // Pause any playing video on the active slide before leaving
    this.pauseActiveVideos();

    this.currentIndex = index;
    const offsetPercent = -this.currentIndex * 100;
    this.track.style.transform = `translateX(${offsetPercent}%)`;

    // Update counter
    if (this.counter) {
      this.counter.textContent = `${this.currentIndex + 1} / ${this.totalSlides}`;
    }

    // Update dots
    this.dots.forEach((dot, idx) => {
      const isActive = idx === this.currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  next() {
    this.goTo(this.currentIndex + 1);
  }

  prev() {
    this.goTo(this.currentIndex - 1);
  }

  /**
   * Keyboard shortcuts handler.
   */
  handleKeydown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.next();
    } else if (e.key === 'Escape') {
      if (typeof this.onClose === 'function') {
        this.onClose();
      }
    }
  }

  /**
   * Touch Gesture Implementation with Vertical Scroll Disambiguation:
   * Prevents layout jitters and preserves native page scroll when dragging vertically.
   */
  handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentX = this.touchStartX;
    this.touchCurrentY = this.touchStartY;
    this.isSwiping = true;
  }

  handleTouchMove(e) {
    if (!this.isSwiping || e.touches.length !== 1) return;

    this.touchCurrentX = e.touches[0].clientX;
    this.touchCurrentY = e.touches[0].clientY;

    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;

    // Disambiguate intention:
    // If vertical movement exceeds horizontal movement, allow native vertical scroll
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    // If clearly swiping horizontally, prevent browser bounce/history back gestures
    if (Math.abs(deltaX) > 10 && e.cancelable) {
      e.preventDefault();
    }
  }

  handleTouchEnd() {
    if (!this.isSwiping) return;
    this.isSwiping = false;

    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;

    // Only trigger slide transition if horizontal travel dominates and clears threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= this.swipeThreshold) {
      if (deltaX < 0) {
        this.next(); // Swiped left -> next slide
      } else {
        this.prev(); // Swiped right -> prev slide
      }
    }
  }

  /**
   * Pause all video elements inside the slider.
   */
  pauseActiveVideos() {
    const videos = this.container.querySelectorAll('video');
    videos.forEach((video) => {
      if (!video.paused) {
        video.pause();
      }
    });
  }

  /**
   * Teardown listeners and clean up media when modal closes.
   */
  destroy() {
    this.pauseActiveVideos();
    resumeAudioAfterMedia();

    window.removeEventListener('keydown', this.handleKeydown);

    if (this.stage) {
      this.stage.removeEventListener('touchstart', this.handleTouchStart);
      this.stage.removeEventListener('touchmove', this.handleTouchMove);
      this.stage.removeEventListener('touchend', this.handleTouchEnd);
    }
    this.container.innerHTML = '';
  }
}
