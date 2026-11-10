/**
 * Onboard-karusellen på index.html: bilder og videoklipp med fade imellom.
 *
 * Formatene spriker, så hovedbildet vises helt (contain) mens en uskarp kopi
 * bak fyller resten av feltet. For video er bakgrunnen et stillbilde fra
 * klippet, så nettleseren slipper å dekode samme video to ganger.
 *
 * Et bilde står i BILDETID. En video spiller ferdig før neste slide, uten lyd
 * — nettlesere starter ikke video med lyd av seg selv.
 */
const SLIDES = [
  'img/funnypicai.jpg',
  'img/straitkrasj.mp4',
  'img/episkfotofinish.jpg',
  'img/davesc.png',
];

const BILDETID = 3500;
const FADE     = 500;
// Sikkerhetsnett: et klipp som henger eller er veldig langt skal ikke låse karusellen.
const MAKS_VIDEOTID = 30000;

const erVideo = src => /\.(mp4|webm|mov)$/i.test(src);

/** Tegner bildet videoen står på over i bakgrunnslaget. */
function stillbilde(video, backdrop) {
  try {
    const lerret = document.createElement('canvas');
    lerret.width  = video.videoWidth;
    lerret.height = video.videoHeight;
    lerret.getContext('2d').drawImage(video, 0, 0);
    backdrop.src = lerret.toDataURL('image/jpeg', 0.6);
    backdrop.style.opacity = '1';
  } catch (e) {
    // Uten stillbilde blir det bare mørkt bak klippet.
  }
}

export function initSlider() {
  const slide    = document.getElementById('slide');
  const backdrop = document.getElementById('slideBackdrop');
  const video    = document.getElementById('slideVideo');
  if (!slide) return;

  // Uten video-elementet på siden hopper vi bare over klippene.
  const slides = video ? SLIDES : SLIDES.filter(src => !erVideo(src));
  const lag = [slide, backdrop, video].filter(Boolean);

  let index = 0;
  let timer = null;

  function om(ms) {
    clearTimeout(timer);
    timer = setTimeout(neste, ms);
  }

  function neste() {
    clearTimeout(timer);
    lag.forEach(el => { el.style.opacity = '0'; });

    setTimeout(() => {
      index = (index + 1) % slides.length;
      vis(slides[index]);
    }, FADE);
  }

  function vis(src) {
    if (video) video.pause();

    if (!erVideo(src)) {
      [slide, backdrop].filter(Boolean).forEach(el => {
        el.src = src;
        el.style.opacity = '1';
      });
      om(BILDETID);
      return;
    }

    video.src = src;
    video.style.opacity = '1';
    // Nekter nettleseren å spille av (autoplay sperret, ukjent format), går vi videre.
    video.play().catch(neste);
    om(MAKS_VIDEOTID);
  }

  if (video) {
    video.addEventListener('ended', neste);
    video.addEventListener('error', () => { if (erVideo(slides[index])) neste(); });
    if (backdrop) video.addEventListener('loadeddata', () => stillbilde(video, backdrop));
  }

  om(BILDETID);
}
