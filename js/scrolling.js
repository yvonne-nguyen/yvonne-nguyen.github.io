// Register plugin once scripts have loaded
window.addEventListener("DOMContentLoaded", () => {
  if (!window.gsap || !window.ScrollTrigger) {
    console.error("GSAP or ScrollTrigger not loaded. Check your <script> tags.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const rows = gsap.utils.toArray(".row");
  let offsets = [];
  let totalOffset = 0;

  function calculateOffsets() {
    totalOffset = 0;
    offsets = rows.map(row => {
      const h = row.querySelector("h1").offsetHeight || 0;
      const prev = totalOffset;
      totalOffset += h;
      return prev;
    });
    ScrollTrigger.refresh();
  }

  // initial + on resize
  calculateOffsets();
  window.addEventListener("resize", calculateOffsets);

  // create a pinning ScrollTrigger for each header column
  rows.forEach((row, i) => {
    const leftCol = row.querySelector(".left");
    ScrollTrigger.create({
      trigger: leftCol,
      endTrigger: ".row-wrap",
      start: () => "top " + offsets[i],
      end: () => "bottom " + totalOffset,
      pin: true,
      pinSpacing: false,
      // markers: true, // uncomment for debugging
    });
  });
});
