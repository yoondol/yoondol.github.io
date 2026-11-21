/* Studio gripper: one pick-and-place run when the station scrolls into view.
   Without JS, or with reduced motion, the CSS final pose is shown. */
(function () {
  "use strict";
  function init() {
    var grip = document.querySelector(".studio .grip");
    if (!grip) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    grip.classList.add("is-armed");
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting && entries[i].intersectionRatio >= 0.6) {
          io.disconnect();
          grip.classList.add("is-run");
          return;
        }
      }
    }, { threshold: 0.6 });
    io.observe(grip);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
