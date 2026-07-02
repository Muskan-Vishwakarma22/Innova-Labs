/* =================================================================
   INNOVA LABS — Main site script
   - Lightweight starfield background (Three.js), no globe/sphere
   - Fixed navbar: scroll state, active-link tracking, mobile toggle
   - Scroll-reveal animations for hero/section content
   - Contact form handler
   (Global Offices logic lives in earth.js / office-section.js)
================================================================= */

// ── LIGHTWEIGHT STARFIELD BACKGROUND ────────────────────────────
const bgCanvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 10;

const starBuf = new Float32Array(900 * 3);
for (let i = 0; i < starBuf.length; i++) starBuf[i] = (Math.random() - 0.5) * 60;
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starBuf, 3));
const stars = new THREE.Points(starGeo,
  new THREE.PointsMaterial({ color: 0x00E5FF, size: 0.045, transparent: true, opacity: 0.5 })
);
scene.add(stars);

window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

const clock = new THREE.Clock();
function animateBg() {
  requestAnimationFrame(animateBg);
  const t = clock.getElapsedTime();
  stars.rotation.y = t * 0.015;
  stars.rotation.x = t * 0.006;
  renderer.render(scene, camera);
}
animateBg();

// ── NAVBAR: scroll state + active link tracking ─────────────────
const navbar    = document.getElementById('navbar');
const navLinks  = document.querySelectorAll('.nav-link[href^="#"]');
const navToggle = document.getElementById('nav-toggle');
const navMenu   = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

navToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
navLinks.forEach(link => link.addEventListener('click', () => navMenu.classList.remove('open')));

const sections = ['home', 'about', 'services', 'projects', 'contact']
  .map(id => document.getElementById(id))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  });
}, { threshold: 0.4 });

sections.forEach(sec => sectionObserver.observe(sec));

// ── SCROLL REVEAL ────────────────────────────────────────────────
const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealItems.forEach(el => revealObserver.observe(el));

// ── CONTACT FORM ──────────────────────────────────────────────────
function submitContact(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const original = btn.innerHTML;
  btn.textContent = '✓ Sent!';
  btn.style.background = '#00c853';
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}
