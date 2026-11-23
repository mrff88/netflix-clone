/**
 * audio.js - Ambient Background Audio Controller
 * Karla & Jimmy Netflix Tribute
 *
 * Capabilities:
 * - 4-Track Sequential Playlist: plays tracks one after the other on 'ended', cycling indefinitely.
 * - Robust audio unlocking compliant with Safari & Chrome Autoplay Policies.
 * - Handles 'click', 'touchend', 'keydown', and 'wheel' for gesture recovery.
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
let playlist = ['assets/audio/ambient.mp3'];
let currentTrackIndex = 0;

/**
 * Initialize audio system with a single source or an array playlist.
 * @param {string|string[]} audioInput - Relative or absolute paths to audio tracks
 * @param {string} toggleBtnSelector - CSS selector for the navbar toggle button
 * @param {string} promptBannerSelector - CSS selector for the autoplay fallback banner
 */
export function initAudio(
  audioInput = 'assets/audio/ambient.mp3',
  toggleBtnSelector = '#audio-toggle',
  promptBannerSelector = '#audio-prompt-banner'
) {
  if (isAudioInitialized) return;

  // Configure playlist array
  if (Array.isArray(audioInput) && audioInput.length > 0) {
    playlist = audioInput.filter((track) => typeof track === 'string' && track.trim().length > 0);
  } else if (typeof audioInput === 'string' && audioInput.trim().length > 0) {
    playlist = [audioInput.trim()];
  }
  if (!playlist.length) {
    playlist = ['assets/audio/ambient.mp3'];
  }
  currentTrackIndex = 0;

  // Locate or create the audio element
  audioElement = document.getElementById('bg-music');
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.id = 'bg-music';
    audioElement.src = playlist[0];
    audioElement.preload = 'auto';
    audioElement.setAttribute('playsinline', '');
    audioElement.setAttribute('webkit-playsinline', '');
    document.body.appendChild(audioElement);
  } else {
    // Remove native loop attribute so the 'ended' event fires properly for playlist advance
    audioElement.removeAttribute('loop');
    audioElement.src = playlist[0];
    audioElement.preload = 'auto';
    audioElement.setAttribute('playsinline', '');
    audioElement.setAttribute('webkit-playsinline', '');
  }

  // Preload first audio buffer immediately
  audioElement.load();

  // Attach playlist sequential advancement listener
  audioElement.addEventListener('ended', onTrackEnded);
  audioElement.addEventListener('error', onTrackError);

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
 * Handle individual track completion: advances to next track in the playlist.
 */
function onTrackEnded() {
  if (userMutedExplicitly || pausedByVideo) return;
  playNextTrack();
}

/**
 * Handle audio load/decode errors gracefully.
 */
function onTrackError(e) {
  const failedSrc = playlist[currentTrackIndex];
  console.warn(`Error loading playlist track [${currentTrackIndex}] (${failedSrc}):`, e);
  // If track failed while active playback is expected, attempt advancing after a brief pause
  if (!userMutedExplicitly && !pausedByVideo && playlist.length > 1) {
    setTimeout(() => {
      if (!userMutedExplicitly && !pausedByVideo) {
        playNextTrack();
      }
    }, 1200);
  }
}

/**
 * Advance to and play the next track in the playlist.
 */
export function playNextTrack() {
  if (!audioElement || !playlist.length) return;
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadAndPlayTrack(currentTrackIndex);
}

/**
 * Load a specific track index and play if unmuted.
 * @param {number} index
 */
function loadAndPlayTrack(index) {
  if (!audioElement || !playlist.length) return;
  currentTrackIndex = ((index % playlist.length) + playlist.length) % playlist.length;
  audioElement.src = playlist[currentTrackIndex];
  audioElement.load();

  if (!userMutedExplicitly && !pausedByVideo) {
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
          console.warn(`Autoplay restriction on track [${currentTrackIndex}] ${playlist[currentTrackIndex]}:`, err.message);
          updateAudioUI();
        });
    }
  } else {
    updateAudioUI();
  }
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
        // Only clean up the prime if playAudio() hasn't already taken over.
        // If playAudio() ran concurrently it set muted=false — in that case the audio
        // is legitimately playing and we must NOT pause it.
        if (audioElement.muted) {
          audioElement.pause();
          audioElement.currentTime = 0;
          audioElement.muted = false;
        }
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
        // Gesture events accepted by browser autoplay policy:
        // - 'click', 'keydown', 'touchend' — universally accepted (Chrome + Safari)
        // - 'wheel'      — accepted by Chrome as user gesture for media; covers desktop scroll
        // - 'touchstart' — accepted by Safari/iOS for mobile scroll
        // All listeners are cleaned up together via AbortController once audio starts.
        const ac = new AbortController();
        const { signal } = ac;

        const onGesture = () => {
          if (!userMutedExplicitly && audioElement && audioElement.paused) {
            audioElement.muted = false;
            audioElement
              .play()
              .then(() => {
                isAudioUnlocked = true;
                ac.abort(); // remove all remaining fallback listeners
                hideAudioPrompt();
                updateAudioUI();
              })
              .catch(() => {});
          }
        };

        document.addEventListener('click',      onGesture, { signal });
        document.addEventListener('keydown',    onGesture, { signal });
        document.addEventListener('touchend',   onGesture, { signal });
        document.addEventListener('touchstart', onGesture, { signal, passive: true });
        // wheel fires synchronously in the user-gesture callstack on desktop Chrome/Firefox
        document.addEventListener('wheel',      onGesture, { signal, passive: true });
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

/**
 * Retrieve a copy of the current playlist tracks.
 * @returns {string[]}
 */
export function getPlaylist() {
  return [...playlist];
}

/**
 * Retrieve the current active track index.
 * @returns {number}
 */
export function getCurrentTrackIndex() {
  return currentTrackIndex;
}

/**
 * Retrieve the current active track URL.
 * @returns {string|null}
 */
export function getCurrentTrack() {
  return playlist[currentTrackIndex] || null;
}

