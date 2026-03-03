/**
 * Image slider with fade transition for index.html
 */
const images = [
  'img/funnypicai.jpg',
  'img/episkfotofinish.jpg',
  'img/frenzymonster.jpg'
];

export function initSlider() {
  const slideElement = document.getElementById('slide');
  if (!slideElement) return;

  let currentIndex = 0;

  setInterval(() => {
    slideElement.style.opacity = '0';
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % images.length;
      slideElement.src = images[currentIndex];
      slideElement.style.opacity = '1';
    }, 500);
  }, 3500);
}
