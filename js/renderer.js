/**
 * renderer.js - Dynamic UI Component Renderer
 * Karla & Jimmy Netflix Tribute
 *
 * Adheres to Zero Dependencies & Clean Separation (PROJECT-RULES.md)
 */

/**
 * Render the Hero Billboard
 */
export function renderHero(seriesData, onPlayEp1, onReadLetter) {
  const heroContainer = document.getElementById('hero-section');
  if (!heroContainer) return;

  heroContainer.innerHTML = `
    <div class="hero-billboard">
      <img src="${seriesData.heroImage}" 
           alt="${seriesData.title} Banner" 
           class="hero-backdrop-img" 
           fetchpriority="high"
           onerror="this.onerror=null; this.style.display='none';" />
      <div class="hero-vignette-bottom"></div>
      <div class="hero-vignette-left"></div>
      <div class="hero-vignette-top"></div>

      <div class="hero-content">
        <div class="hero-series-badge">
          <span class="hero-n-mark" aria-hidden="true">N</span>
          <span>SERIE ORIGINAL</span>
        </div>
        <h1 class="hero-title">${seriesData.title}</h1>
        <p class="hero-subtitle">${seriesData.couple} • ${seriesData.years} • 16 Episodios</p>
        
        <div class="hero-actions">
          <button id="hero-btn-play" class="btn-primary-play" type="button">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Ver Episodio 1</span>
          </button>
          <button id="hero-btn-letter" class="btn-secondary-info" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Leer Carta Final</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('hero-btn-play')?.addEventListener('click', onPlayEp1);
  document.getElementById('hero-btn-letter')?.addEventListener('click', onReadLetter);
}

/**
 * Render the Season Selector Bar with Season 2 Teaser Toast trigger
 */
export function renderSeasonSelector(seriesData, onTeaserClick) {
  const selectorContainer = document.getElementById('season-selector-section');
  if (!selectorContainer) return;

  selectorContainer.innerHTML = `
    <div class="season-selector-wrapper">
      <h2 class="season-selector-title">Episodios</h2>
      <div class="season-dropdown-container">
        <label for="season-select" class="visually-hidden" style="position:absolute; width:1px; height:1px; overflow:hidden;">Seleccionar Temporada</label>
        <select id="season-select" class="season-select-pill" aria-label="Seleccionar temporada">
          <option value="1" selected>Temporada 1 (2011–2026)</option>
          <option value="2">Temporada 2 (Próximamente...)</option>
        </select>
      </div>
    </div>
  `;

  const select = document.getElementById('season-select');
  if (select) {
    select.addEventListener('change', (e) => {
      if (e.target.value === '2') {
        e.target.value = '1'; // Keep Season 1 active
        if (typeof onTeaserClick === 'function') {
          onTeaserClick(seriesData.season2Teaser);
        }
      }
    });
  }
}

/**
 * Render the 16-Episode Responsive Grid
 */
export function renderEpisodeGrid(episodes, onEpisodeClick) {
  const gridSection = document.getElementById('episodes-grid');
  if (!gridSection) return;

  gridSection.innerHTML = episodes
    .map((ep) => {
      const mediaCount = ep.images.length;
      return `
        <article class="episode-card" data-episode-number="${ep.number}" tabindex="0" role="button" aria-label="Abrir Episodio ${ep.number}: ${ep.title} (${ep.year})">
          <div class="episode-card-media">
            <img src="${ep.cover}" 
                 alt="${ep.title} (${ep.year})" 
                 class="episode-card-img" 
                 loading="lazy" 
                 onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'fallback-card\\'><div class=\\'fallback-year\\'>${ep.year}</div><div class=\\'fallback-title\\'>${ep.title}</div></div>';" />
            <div class="episode-card-badge">EPISODIO ${ep.number} • ${ep.year}</div>
            <div class="episode-card-media-count" aria-label="${mediaCount} archivos multimedia">
              <span>📷 ${mediaCount}</span>
            </div>
          </div>
          <div class="episode-card-body">
            <div class="episode-card-meta">AÑO ${ep.year}</div>
            <h3 class="episode-card-title">${ep.title}</h3>
            <p class="episode-card-desc">${ep.description[0]}</p>
            <div class="episode-card-cta" aria-hidden="true">
              <span>Ver detalles</span>
              <span>→</span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  // Attach click & enter key triggers
  const cards = gridSection.querySelectorAll('.episode-card');
  cards.forEach((card) => {
    const epNum = parseInt(card.dataset.episodeNumber, 10);
    card.addEventListener('click', () => onEpisodeClick(epNum));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onEpisodeClick(epNum);
      }
    });
  });
}

/**
 * Render the Protagonistas (Character Showcase) View
 */
export function renderProtagonistas(protagonists) {
  const container = document.getElementById('protagonistas-content');
  if (!container) return;

  container.innerHTML = `
    <div class="view-protagonistas-container">
      <header class="section-editorial-header">
        <div class="section-editorial-badge">NUESTRA HISTORIA</div>
        <h2 class="section-editorial-title">Los Protagonistas</h2>
        <p class="section-editorial-desc">Karla & Jimmy • Dos vidas guiadas por la misma fe, escribiendo un amor para siempre.</p>
      </header>

      <div class="protagonistas-showcase">
        ${protagonists
          .map(
            (p) => `
          <article class="protagonista-card">
            <div class="protagonista-portrait-stage">
              <img src="${p.image}" 
                   alt="${p.name}" 
                   class="protagonista-img" 
                   loading="lazy"
                   onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'fallback-card\\'><div class=\\'fallback-title\\'>${p.name}</div></div>';" />
            </div>
            <span class="protagonista-role-tag">${p.role}</span>
            <h3 class="protagonista-name">${p.name}</h3>
            <p class="protagonista-subtitle">${p.subtitle}</p>
            <div class="protagonista-paragraphs">
              ${p.paragraphs.map((para) => `<p>${para}</p>`).join('')}
            </div>
          </article>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/**
 * Render the Carta Final (Cinema Reader) View
 */
export function renderCartaFinal(finalLetter) {
  const container = document.getElementById('carta-content');
  if (!container) return;

  container.innerHTML = `
    <div class="view-carta-container">
      <article class="carta-cinema-stage">
        <header class="carta-header">
          <div class="carta-badge">${finalLetter.badge}</div>
          <h2 class="carta-title">${finalLetter.title}</h2>
        </header>

        <div class="carta-body">
          <div class="carta-salutation">${finalLetter.salutation}</div>
          ${finalLetter.paragraphs.map((para) => `<p class="carta-paragraph">${para}</p>`).join('')}

          <footer class="carta-signature">
            <div class="carta-sign-name">${finalLetter.signatureName}</div>
            <div class="carta-sign-role">${finalLetter.signatureRole}</div>
          </footer>
        </div>
      </article>
    </div>
  `;
}

/**
 * Render the Narrative panel below the slider inside the Episode Detail Modal
 */
export function renderEpisodeModalNarrative(episode, onNextEpisode) {
  const panel = document.getElementById('modal-narrative');
  if (!panel) return;

  const isLast = episode.number === 16;
  const nextLabel = isLast ? '✉ Leer Carta Final' : `Siguiente: Episodio ${episode.number + 1} →`;

  panel.innerHTML = `
    <div class="modal-narrative-header">
      <div class="modal-episode-badge">EPISODIO ${episode.number} • ${episode.year}</div>
      <h2 class="modal-episode-title">${episode.title}</h2>
    </div>

    <div class="modal-episode-paragraphs">
      ${episode.description.map((p) => `<p>${p}</p>`).join('')}
    </div>

    <div class="modal-actions-bar">
      <button id="modal-btn-next" class="btn-next-episode" type="button">
        <span>${nextLabel}</span>
      </button>
    </div>
  `;

  document.getElementById('modal-btn-next')?.addEventListener('click', () => {
    onNextEpisode(episode.number);
  });
}
