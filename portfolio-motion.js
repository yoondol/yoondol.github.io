/* Decorative mini robot under the ReuseMem photo: crosses its track once
   when the spotlight scrolls into view, then rests. Skipped entirely with
   reduced motion; without this script the robot simply rests at the end. */
(() => {
  'use strict';
  const mini = document.querySelector('.spot-track');
  if (!mini || !('IntersectionObserver' in window)) return;
  if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

  mini.classList.add('is-armed');
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.6)) return;
    io.disconnect();
    mini.classList.add('is-run');
  }, { threshold: 0.6 });
  io.observe(mini);
})();
