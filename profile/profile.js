const navLinks = [...document.querySelectorAll('nav a[href^="#"]')];
const sections = navLinks.map(link => document.querySelector(link.hash));
const header = document.querySelector('.site-header');
let pendingUpdate = false;

function updateCurrentSection() {
  const marker = header.getBoundingClientRect().bottom + 40;
  const active = sections.findLastIndex(section => section.getBoundingClientRect().top <= marker);

  navLinks.forEach((link, index) => {
    if (index === active) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
  pendingUpdate = false;
}

function scheduleUpdate() {
  if (!pendingUpdate) {
    pendingUpdate = true;
    requestAnimationFrame(updateCurrentSection);
  }
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('pageshow', scheduleUpdate);
document.fonts.ready.then(scheduleUpdate);
scheduleUpdate();

const demo = document.querySelector('[data-demo]');
const demoError = document.querySelector('[data-video-error]');
demo.addEventListener('error', () => { demoError.hidden = false; }, true);
