/**
 * app.js - Application Orchestrator & State Controller
 * Karla & Jimmy Netflix Tribute
 *
 * Responsibilities:
 * - Netflix Intro Splash lifecycle & audio trigger.
 * - Hash routing (Views & Modals) with Back/Forward button sync.
 * - Episode Detail Modal management & EpisodeSlider instantiation.
 * - Top navbar scroll state & Toast notification delivery.
 */

import { SERIES_DATA } from './data.js';
import { initAudio, playAudio, unlockAudio } from './audio.js';
import { EpisodeSlider } from './slider.js';
import {
  renderHero,
  renderSeasonSelector,
  renderEpisodeGrid,
  renderProtagonistas,
  renderCartaFinal,
  renderEpisodeModalNarrative
} from './renderer.js';

let activeSlider = null;
let currentModalEpisode = null;
let isIntroDismissed = false;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initialize all subsystems, renders, and event bindings.
 */
function initApp() {
  // 1. Initialize Audio Controller
  initAudio(SERIES_DATA.audioSrc, '#audio-toggle');

  // 2. Initialize Netflix Intro Overlay
  setupIntroOverlay();

  // 3. Render Views Content
  renderHero(
    SERIES_DATA,
    () => navigateTo('#/episodio-1'),
    () => navigateTo('#/carta-final')
  );

  renderSeasonSelector(SERIES_DATA, (message) => {
    showToast(message);
  });

  renderEpisodeGrid(SERIES_DATA.episodes, (episodeNumber) => {
    navigateTo(`#/episodio-${episodeNumber}`);
  });

  renderProtagonistas(SERIES_DATA.protagonists);
  renderCartaFinal(SERIES_DATA.finalLetter);

  // 4. Modal Event Listeners
  setupModalListeners();

  // 5. Scroll Listener for Top Navbar
  setupNavbarScroll();

  // 6. Navigation Link Handlers
  setupNavigationHandlers();

  // 7. Initialize Hash Route
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}

/**
 * Setup Netflix Cold-Start Intro Animation
 */
function setupIntroOverlay() {
  const introOverlay = document.getElementById('intro-overlay');
  if (!introOverlay) {
    // If intro overlay is not present, start audio immediately
    playAudio();
    return;
  }

  // Pre-unlock audio on any initial touch or click during the intro
  const handleEarlyInteraction = () => {
    unlockAudio();
  };
  document.addEventListener('click', handleEarlyInteraction, { once: true });
  document.addEventListener('touchend', handleEarlyInteraction, { once: true });
  document.addEventListener('keydown', handleEarlyInteraction, { once: true });

  const dismissIntro = () => {
    if (isIntroDismissed) return;
    isIntroDismissed = true;
    introOverlay.classList.add('is-dismissed');

    // Start background audio right when the Netflix logo finishes/dismisses
    playAudio();

    setTimeout(() => {
      introOverlay.remove();
    }, 750);
  };

  // Immediate start if user prefers reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dismissIntro();
    return;
  }

  // Auto-dismiss after 2.8 seconds (when the logo animation finishes)
  const autoDismissTimer = setTimeout(dismissIntro, 2800);

  // Click or touch to skip immediately and start audio
  introOverlay.addEventListener('click', () => {
    unlockAudio();
    clearTimeout(autoDismissTimer);
    dismissIntro();
  });

  // Keyboard shortcut to skip
  window.addEventListener('keydown', (e) => {
    if (!isIntroDismissed && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) {
      unlockAudio();
      clearTimeout(autoDismissTimer);
      dismissIntro();
    }
  });
}

/**
 * Top Navbar Scroll Transparency Transition
 */
function setupNavbarScroll() {
  const navbar = document.querySelector('.top-navbar');
  if (!navbar) return;

  const updateNavbarState = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', updateNavbarState, { passive: true });
  updateNavbarState();
}

/**
 * Setup Modal Event Listeners (Backdrop click & Close button)
 */
function setupModalListeners() {
  const modal = document.getElementById('episode-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeModalAndRevertHash();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      // Close only if clicking the backdrop outside the dialog
      if (e.target === modal) {
        closeModalAndRevertHash();
      }
    });
  }
}

/**
 * Bind Navigation Links to Hash Router
 */
function setupNavigationHandlers() {
  const navLinks = document.querySelectorAll('.nav-tab-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetHash = link.getAttribute('href');
      navigateTo(targetHash);
    });
  });

  document.querySelector('.brand-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('#/episodios');
  });
}

/**
 * Safe navigation helper
 */
function navigateTo(hash) {
  if (window.location.hash === hash) {
    handleHashChange();
  } else {
    window.location.hash = hash;
  }
}

/**
 * Synchronize UI with Current URL Hash
 */
function handleHashChange() {
  const hash = window.location.hash || '#/episodios';

  // Check if hash points to an episode modal: #/episodio-{number}
  const episodeMatch = hash.match(/^#\/episodio-(\d+)$/);

  if (episodeMatch) {
    const epNum = parseInt(episodeMatch[1], 10);
    // Ensure the underlying view is set to Episodios
    switchView('episodios');
    openEpisodeModal(epNum);
  } else {
    // Normal Tab Navigation
    closeModal();
    if (hash === '#/protagonistas') {
      switchView('protagonistas');
    } else if (hash === '#/carta-final') {
      switchView('carta-final');
    } else {
      switchView('episodios');
    }
  }
}

/**
 * Switch Active View Tab
 */
function switchView(viewName) {
  // Update view containers
  const views = {
    episodios: document.getElementById('view-episodios'),
    protagonistas: document.getElementById('view-protagonistas'),
    'carta-final': document.getElementById('view-carta-final')
  };

  Object.entries(views).forEach(([name, el]) => {
    if (el) {
      el.classList.toggle('active', name === viewName);
    }
  });

  // Update navbar active link
  const navLinks = document.querySelectorAll('.nav-tab-link');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const isActive = href === `#/${viewName}`;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Scroll to top upon tab switch
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Open Episode Detail Modal
 */
function openEpisodeModal(episodeNumber) {
  const episode = SERIES_DATA.episodes.find((ep) => ep.number === episodeNumber);
  if (!episode) {
    closeModalAndRevertHash();
    return;
  }

  currentModalEpisode = episode;
  const modal = document.getElementById('episode-modal');
  const sliderStageContainer = document.getElementById('modal-slider-stage');

  if (!modal || !sliderStageContainer) return;

  // Teardown any existing slider before mounting new one
  if (activeSlider) {
    activeSlider.destroy();
    activeSlider = null;
  }

  // Instantiate Slider with Dynamic 2–7 Media Items
  activeSlider = new EpisodeSlider(
    sliderStageContainer,
    episode.images,
    {
      number: episode.number,
      year: episode.year,
      title: episode.title
    },
    () => closeModalAndRevertHash()
  );

  // Render bottom narrative panel
  renderEpisodeModalNarrative(episode, (currEpNum) => {
    if (currEpNum < 16) {
      navigateTo(`#/episodio-${currEpNum + 1}`);
    } else {
      navigateTo('#/carta-final');
    }
  });

  // Display modal & lock background scroll
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

/**
 * Close modal directly
 */
function closeModal() {
  const modal = document.getElementById('episode-modal');
  if (modal && modal.classList.contains('is-open')) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (activeSlider) {
    activeSlider.destroy();
    activeSlider = null;
  }
  currentModalEpisode = null;
}

/**
 * Close modal and synchronize hash back to #/episodios
 */
function closeModalAndRevertHash() {
  closeModal();
  if (window.location.hash.startsWith('#/episodio-')) {
    // Revert to main episodes tab
    window.location.hash = '#/episodios';
  }
}

/**
 * Toast Notification System
 */
let toastTimeout = null;

export function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Clear existing toast
  container.innerHTML = '';
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  const toastEl = document.createElement('div');
  toastEl.className = 'toast-message';
  toastEl.setAttribute('role', 'status');
  toastEl.innerHTML = `
    <span style="color: var(--color-crimson); font-size: 1.1rem;">❤️</span>
    <span>${message}</span>
  `;

  container.appendChild(toastEl);

  toastTimeout = setTimeout(() => {
    toastEl.classList.add('toast-exit');
    setTimeout(() => {
      toastEl.remove();
    }, 300);
  }, 3400);
}
