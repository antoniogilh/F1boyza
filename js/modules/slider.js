/**
 * Image slider with fade transition for index.html.
 *
 * Bildene har ulike format, så hovedbildet vises helt (contain) mens en
 * uskarp kopi bak fyller resten av feltet. Begge byttes samtidig.
 */
const images = [
  'img/funnypicai.jpg',
  'img/episkfotofinish.jpg',
  'img/frenzymonster.jpg'
];

export function initSlider() {
  const slide    = document.getElementById('slide');
  const backdrop = document.getElementById('slideBackdrop');
  if (!slide) return;

  const lag = [slide, backdrop].filter(Boolean);
  let currentIndex = 0;

  setInterval(() => {
    lag.forEach(el => { el.style.opacity = '0'; });

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % images.length;
      lag.forEach(el => {
        el.src = images[currentIndex];
        el.style.opacity = '1';
      });
    }, 500);
  }, 3500);
}
