/**
 * audio.js - Ambient Background Audio Controller
 * Karla & Jimmy Netflix Tribute
 *
 * Capabilities:
 * - Robust audio unlocking compliant with Safari & Chrome Autoplay Policies.
 * - Handles 'click', 'touchend', and 'keydown' (avoiding rejected pointerdown in WebKit).
 * - Preloads audio with 'preload=auto' for zero buffering latency.
 * - Shows an interactive banner fallback if unprompted autoplay is blocked by the browser.
 * - Audio ducking during episode video playback.
 */

let audioElement = null;
let audioToggleButton = null;
let audioPromptBanner = null;
let isAudioInitialized = false;
let userMutedExplicitly = false;
let pausedByVideo = false;
let isAudioUnlocked = false;

/**
 * Initialize audio system.
 * @param {string} audioSrc - Relative or absolute path to ambient.mp3
 * @param {string} toggleBtnSelector - CSS selector for the navbar toggle button
 * @param {string} promptBannerSelector - CSS selector for the autoplay fallback banner
 */
export function initAudio(
  audioSrc = 'assets/audio/ambient.mp3',
  toggleBtnSelector = '#audio-toggle',
  promptBannerSelector = '#audio-prompt-banner'
) {
  if (isAudioInitialized) return;

  // Locate or create the audio element
  audioElement = document.getElementById('bg-music');
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.id = 'bg-music';
    audioElement.src = audioSrc;
    audioElement.loop = true;
    audioElement.preload = 'auto';
    audioElement.setAttribute('playsinline', '');
    audioElement.setAttribute('webkit-playsinline', '');
    document.body.appendChild(audioElement);
  } else {
    audioElement.preload = 'auto';
    audioElement.setAttribute('playsinline', '');
    audioElement.setAttribute('webkit-playsinline', '');
  }

  // Preload audio buffer immediately
  audioElement.load();

  audioToggleButton = document.querySelector(toggleBtnSelector);
  if (audioToggleButton) {
    audioToggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  audioPromptBanner = document.querySelector(promptBannerSelector);
  if (audioPromptBanner) {
    audioPromptBanner.addEventListener('click', (e) => {
      e.stopPropagation();
      userMutedExplicitly = false;
      playAudio();
    });
  }

  isAudioInitialized = true;
  updateAudioUI();
}

/**
 * Pre-unlock audio element inside an active user gesture (click/touchend/keydown).
 * This primes the browser to allow unmuted playback when the animation ends.
 */
export function unlockAudio() {
  if (!audioElement || isAudioUnlocked) return;

  // Priming play/pause within user gesture callstack
  audioElement.muted = true;
  const primePromise = audioElement.play();

  if (primePromise !== undefined) {
    primePromise
      .then(() => {
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.muted = false;
        isAudioUnlocked = true;
      })
      .catch(() => {
        audioElement.muted = false;
      });
  }
}

/**
 * Play ambient music with browser promise error handling and interactive fallback.
 */
export function playAudio() {
  if (!audioElement || userMutedExplicitly) return;

  audioElement.muted = false;
  const playPromise = audioElement.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isAudioUnlocked = true;
        hideAudioPrompt();
        updateAudioUI();
      })
      .catch((err) => {
        // Browser autoplay restriction: unprompted playback was blocked
        console.warn('Autoplay blocked by browser policy:', err.message);
        showAudioPrompt();
        updateAudioUI();

        // Listen for next user gesture across the document
        const handleGesture = () => {
          if (!userMutedExplicitly && audioElement && audioElement.paused) {
            audioElement.muted = false;
            audioElement
              .play()
              .then(() => {
                isAudioUnlocked = true;
                hideAudioPrompt();
                updateAudioUI();
              })
              .catch(() => {});
          }
        };

        // Use 'click' and 'touchend' - universally accepted across WebKit/Safari and Blink/Chrome
        document.addEventListener('click', handleGesture, { once: true });
        document.addEventListener('touchend', handleGesture, { once: true });
        document.addEventListener('keydown', handleGesture, { once: true });
      });
  }
}

/**
 * Pause ambient music.
 */
export function pauseAudio() {
  if (!audioElement) return;
  audioElement.pause();
  hideAudioPrompt();
  updateAudioUI();
}

/**
 * Toggle audio between playing and paused (explicit user action).
 */
export function toggleAudio() {
  if (!audioElement) return;

  if (audioElement.paused || audioElement.muted) {
    userMutedExplicitly = false;
    playAudio();
  } else {
    userMutedExplicitly = true;
    pauseAudio();
  }
}

/**
 * Duck/pause ambient music when an in-slide video starts playing.
 */
export function pauseAudioForMedia() {
  if (!audioElement) return;
  if (!audioElement.paused && !audioElement.muted) {
    pausedByVideo = true;
    audioElement.pause();
    updateAudioUI();
  }
}

/**
 * Resume ambient music after an in-slide video pauses or finishes.
 */
export function resumeAudioAfterMedia() {
  if (!audioElement) return;
  if (pausedByVideo && !userMutedExplicitly) {
    pausedByVideo = false;
    playAudio();
  }
}

/**
 * Show floating audio prompt if autoplay is blocked by browser
 */
function showAudioPrompt() {
  if (audioPromptBanner && !userMutedExplicitly) {
    audioPromptBanner.classList.add('is-visible');
  }
  if (audioToggleButton) {
    audioToggleButton.classList.add('needs-interaction');
  }
}

/**
 * Hide floating audio prompt once audio begins
 */
function hideAudioPrompt() {
  if (audioPromptBanner) {
    audioPromptBanner.classList.remove('is-visible');
  }
  if (audioToggleButton) {
    audioToggleButton.classList.remove('needs-interaction');
  }
}

/**
 * Synchronize UI indicators (button emoji/label and equalizer animation).
 */
export function updateAudioUI() {
  if (!audioToggleButton) return;

  const isPlaying = audioElement && !audioElement.paused && !audioElement.muted;

  if (isPlaying) {
    audioToggleButton.classList.add('is-playing');
    audioToggleButton.classList.remove('needs-interaction');
    audioToggleButton.setAttribute('aria-label', 'Silenciar música ambiental');
    audioToggleButton.innerHTML = `
      <span class="audio-icon" aria-hidden="true">🔊</span>
      <span class="audio-equalizer" aria-hidden="true">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </span>
    `;
  } else {
    audioToggleButton.classList.remove('is-playing');
    audioToggleButton.setAttribute('aria-label', 'Reproducir música ambiental');
    audioToggleButton.innerHTML = `
      <span class="audio-icon" aria-hidden="true">🔇</span>
    `;
  }
}
