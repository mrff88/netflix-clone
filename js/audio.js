/**
 * audio.js - Ambient Background Audio Controller
 * Karla & Jimmy Netflix Tribute
 *
 * Responsibilities:
 * - Autoplay ambient music on first user click/touch anywhere on the document.
 * - Manage mute/unmute and play/pause toggle in the top navbar.
 * - Audio ducking: pause ambient music when an episode video plays, resume when stopped.
 * - Synchronize UI button icon (🔇 / 🔊) and equalizer visual states.
 */

let audioElement = null;
let audioToggleButton = null;
let isAudioInitialized = false;
let userMutedExplicitly = false;
let pausedByVideo = false;

/**
 * Initialize audio system and register interaction listeners.
 * @param {string} audioSrc - Relative or absolute path to ambient.mp3
 * @param {string} toggleBtnSelector - CSS selector for the navbar toggle button
 */
export function initAudio(audioSrc = 'assets/audio/ambient.mp3', toggleBtnSelector = '#audio-toggle') {
  if (isAudioInitialized) return;

  // Locate or create the audio element
  audioElement = document.getElementById('bg-music');
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.id = 'bg-music';
    audioElement.src = audioSrc;
    audioElement.loop = true;
    audioElement.preload = 'metadata';
    document.body.appendChild(audioElement);
  }

  audioToggleButton = document.querySelector(toggleBtnSelector);
  if (audioToggleButton) {
    audioToggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  // First-interaction autoplay: Trigger audio upon first click/tap anywhere on viewport
  const handleFirstInteraction = () => {
    if (!userMutedExplicitly && audioElement && audioElement.paused) {
      playAudio();
    }
  };

  // 'pointerdown' captures touches and clicks with lowest latency
  document.addEventListener('pointerdown', handleFirstInteraction, { once: true });
  document.addEventListener('keydown', handleFirstInteraction, { once: true });

  isAudioInitialized = true;
  updateAudioUI();
}

/**
 * Play ambient music with browser promise error handling.
 */
export function playAudio() {
  if (!audioElement) return;

  audioElement.muted = false;
  const playPromise = audioElement.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        updateAudioUI();
      })
      .catch((err) => {
        // Autoplay policy or media not loaded yet
        console.warn('Audio playback waiting for eligible user gesture:', err.message);
        updateAudioUI();
      });
  }
}

/**
 * Pause ambient music.
 */
export function pauseAudio() {
  if (!audioElement) return;
  audioElement.pause();
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
 * Synchronize UI indicators (button emoji/label and equalizer animation).
 */
export function updateAudioUI() {
  if (!audioToggleButton) return;

  const isPlaying = audioElement && !audioElement.paused && !audioElement.muted;

  if (isPlaying) {
    audioToggleButton.classList.add('is-playing');
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
