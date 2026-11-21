// Progressive enhancement only: the page, links, film controls and the
// manuscripts disclosure all work without this script.

// 1. Mark the section currently in view in the main navigation.
const header = document.querySelector('.site-header');
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sections = navLinks.map(link => document.getElementById(link.hash.slice(1)));
let pendingUpdate = false;

function updateCurrentSection() {
  pendingUpdate = false;
  const marker = (header ? header.getBoundingClientRect().bottom : 0) + 48;
  const root = document.documentElement;
  const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
  let active = -1;

  sections.forEach((section, index) => {
    if (section && section.getBoundingClientRect().top <= marker) active = index;
  });
  // The last section is short, so it may never reach the marker.
  if (atBottom && active !== -1) active = sections.length - 1;

  navLinks.forEach((link, index) => {
    if (index === active) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function scheduleUpdate() {
  if (!pendingUpdate) {
    pendingUpdate = true;
    requestAnimationFrame(updateCurrentSection);
  }
}

if (navLinks.length) {
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  if (document.fonts) document.fonts.ready.then(scheduleUpdate);
  scheduleUpdate();
}

// 2. If the overview film cannot load, show the project-page link prominently.
//    Source errors do not bubble, so listen in the capture phase.
const film = document.querySelector('[data-film]');
const filmError = document.querySelector('[data-film-error]');

if (film && filmError) {
  const showFilmError = () => { filmError.hidden = false; };
  film.addEventListener('error', showFilmError, true);
  if (film.error) showFilmError();
}
