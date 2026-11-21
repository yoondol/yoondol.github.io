/*
  Small enhancements for the profile page. The page is complete without them.

  1. Active section. The nav link for the section in view gets
     aria-current="location", and a small decorative robot (aria-hidden,
     pointer-events: none) rides the strip under the links to that link.
     It moves only when the active section changes: a short travel burst,
     then one blink. With reduced motion it jumps without animation.

  2. ReuseMem result bars fill once, the first time they scroll into view.

  Scroll and resize work goes through one requestAnimationFrame scheduler.
*/
(() => {
  'use strict';

  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');

  // ------------------------------------------------ active section + robot

  const header = document.querySelector('.topbar');
  const track = document.querySelector('.nav-track');
  const bot = track && track.querySelector('.bot');
  const links = track
    ? Array.from(track.querySelectorAll('.nav-list a[href^="#"]'))
        .filter((a) => document.getElementById(a.hash.slice(1)))
    : [];

  if (header && bot && links.length) {
    const sections = links.map((a) => document.getElementById(a.hash.slice(1)));
    const MOVE_MS = 560;   // matches --move in styles.css
    const SETTLE_MS = 180; // scroll quiet time that ends a nav click

    let active = -1;
    let botX = null;
    let barHeight = header.offsetHeight;
    let frame = 0;
    let needsLayout = false;
    let clickLock = false;
    let settleTimer = 0;
    let burstTimer = 0;

    const xFor = (link) => Math.round(link.offsetLeft + (link.offsetWidth - bot.offsetWidth) / 2);

    // Place without travelling (first paint, resize, font swap).
    function jumpTo(link) {
      bot.classList.add('is-still');
      botX = xFor(link);
      bot.style.setProperty('--x', botX + 'px');
      void bot.offsetWidth; // commit before transitions come back
      bot.classList.remove('is-still');
    }

    function travelTo(link) {
      const x = xFor(link);
      if (!motion.matches || botX === null) { jumpTo(link); return; }
      if (x === botX) return;
      bot.dataset.dir = x > botX ? 'right' : 'left';
      botX = x;
      bot.style.setProperty('--x', x + 'px');
      bot.classList.remove('is-arriving');
      bot.classList.add('is-moving');
      clearTimeout(burstTimer);
      burstTimer = setTimeout(() => {
        bot.classList.remove('is-moving');
        bot.classList.add('is-arriving');
        burstTimer = setTimeout(() => bot.classList.remove('is-arriving'), 600);
      }, MOVE_MS);
    }

    // On narrow screens the nav scrolls sideways; keep the active link in view.
    function reveal(link, smooth) {
      const room = track.clientWidth;
      if (track.scrollWidth <= room + 1) return;
      const left = link.offsetLeft;
      const right = left + link.offsetWidth;
      const fade = 40; // the right edge fades out
      if (left >= track.scrollLeft + 8 && right <= track.scrollLeft + room - fade) return;
      track.scrollTo({
        left: left - (room - link.offsetWidth) / 2,
        behavior: smooth && motion.matches ? 'smooth' : 'auto',
      });
    }

    function setActive(i, animate) {
      if (i === active) return;
      if (active >= 0) links[active].removeAttribute('aria-current');
      active = i;
      links[i].setAttribute('aria-current', 'location');
      if (animate) travelTo(links[i]); else jumpTo(links[i]);
      reveal(links[i], animate);
    }

    // The last section whose top has passed a reading line under the header.
    // At the very bottom of the page the last section wins, since it is short.
    function sectionInView() {
      if (window.scrollY + window.innerHeight >= root.scrollHeight - 2) return sections.length - 1;
      const line = barHeight + window.innerHeight * 0.3;
      let index = 0;
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top <= line) index = i;
      });
      return index;
    }

    function measure() {
      barHeight = header.offsetHeight;
      root.style.setProperty('--bar', barHeight + 'px');
    }

    function update() {
      frame = 0;
      if (needsLayout) {
        needsLayout = false;
        measure();
        if (active >= 0) { jumpTo(links[active]); reveal(links[active], false); }
      }
      if (!clickLock) setActive(sectionInView(), true);
    }

    function schedule(layout) {
      if (layout) needsLayout = true;
      if (!frame) frame = requestAnimationFrame(update);
    }

    // A nav click picks its section right away and holds it until the
    // smooth scroll settles, so the robot makes one trip instead of
    // stopping at every section on the way.
    // When the hold ends, keep the clicked section only if the scroll really
    // landed on it; an interrupted scroll falls back to a normal check.
    let clicked = -1;

    function reachedTarget(i) {
      const px = (v) => parseFloat(v) || 0;
      const offset = px(getComputedStyle(root).scrollPaddingTop) +
                     px(getComputedStyle(sections[i]).scrollMarginTop);
      const top = sections[i].getBoundingClientRect().top;
      if (Math.abs(top - offset) <= 4) return true;
      // Clamped scrolls: the page cannot bring the target fully up to the offset.
      const atBottom = window.scrollY + window.innerHeight >= root.scrollHeight - 2;
      const atTop = window.scrollY <= 0;
      return (atBottom || atTop) && top > offset && top < window.innerHeight;
    }

    function holdFor(ms) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        clickLock = false;
        const target = clicked;
        clicked = -1;
        if (target < 0 || !reachedTarget(target)) schedule(false);
      }, ms);
    }

    track.addEventListener('click', (event) => {
      const i = links.indexOf(event.target.closest('a'));
      if (i < 0) return;
      clicked = i;
      clickLock = true;
      holdFor(600);
      setActive(i, true);
    });

    window.addEventListener('scroll', () => {
      if (clickLock) holdFor(SETTLE_MS);
      else schedule(false);
    }, { passive: true });

    window.addEventListener('resize', () => schedule(true), { passive: true });

    // First placement, then show the robot once fonts have settled widths.
    measure();
    setActive(sectionInView(), false);
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      needsLayout = true;
      update();
      requestAnimationFrame(() => bot.classList.add('is-ready'));
    });
  }

  // --------------------------------------------- ReuseMem result, one shot

  const result = document.querySelector('.result');
  if (result && motion.matches && 'IntersectionObserver' in window &&
      result.getBoundingClientRect().top > window.innerHeight) {
    // Only armed while still below the fold, so nothing visible ever resets.
    result.classList.add('is-armed');
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      result.classList.add('is-in');
      observer.disconnect();
    }, { threshold: 0.6 });
    observer.observe(result);
  }
})();
