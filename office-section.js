/* =================================================================
   office-section.js — Builds office cards and initialises the
   Earth globe lazily when the section scrolls into view.
   The Global Offices section is now an inline page section, NOT an overlay.
================================================================= */

/* ── Build office card HTML ─────────────────────────────────── */
function buildOfficeCards() {
  const container = document.getElementById('office-cards');
  if (!container) return;

  OFFICES.forEach((office, i) => {
    const card = document.createElement('div');
    card.className  = 'office-card reveal';
    card.dataset.id = office.id;
    card.style.animationDelay = (i * 80) + 'ms';

    card.innerHTML = `
      <div class="oc-info">
        <div class="oc-city">${office.city}</div>
        <div class="oc-region">${office.region}</div>
        <div class="oc-team"><i class="fas fa-users"></i> ${office.team}</div>
      </div>
      <div class="oc-glow"></div>
    `;

    card.addEventListener('click', () => selectOffice(office.id));
    container.appendChild(card);
  });
}

/* ── Highlight a card (called from globe marker click) ── */
function highlightOfficeCard(id) {
  document.querySelectorAll('.office-card').forEach(c => {
    c.classList.toggle('active', c.dataset.id === id);
  });
  const target = document.querySelector(`.office-card[data-id="${id}"]`);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Select an office from the card list ── */
function selectOffice(id) {
  highlightOfficeCard(id);
  const office = (typeof OFFICES !== 'undefined') ? OFFICES.find(o => o.id === id) : null;
  if (office && earthInstance && earthInstance.flyToOffice) {
    earthInstance.flyToOffice(office);
  }
}

/* ── Scroll-reveal for all .reveal elements inside the section ── */
function initScrollReveal() {
  const items = document.querySelectorAll('#global-offices .reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => observer.observe(el));
}

/* ── Lazy-init globe when the section enters the viewport ── */
let earthInstance = null;

function maybeInitEarth() {
  if (earthInstance) return;
  const canvasEl = document.getElementById('earth-canvas');
  if (!canvasEl) return;
  // Give the canvas a moment to have its layout dimensions
  requestAnimationFrame(() => {
    earthInstance = initEarth(canvasEl);
  });
}

/* ── Wire everything up on DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  buildOfficeCards();
  initScrollReveal();

  /* Smooth-scroll anchor is handled natively by html { scroll-behavior: smooth }
     The nav link is already <a href="#global-offices"> so no JS needed. */

  /* Lazy init globe when section is visible */
  const section = document.getElementById('global-offices');
  if (section) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          maybeInitEarth();
          initScrollReveal();       // re-run for dynamically added cards
          sectionObserver.unobserve(section);
        }
      });
    }, { threshold: 0.05 });
    sectionObserver.observe(section);
  }
});
