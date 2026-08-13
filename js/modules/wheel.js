import { fetchData } from './api.js';
import confetti from 'canvas-confetti';
import { playTick, resumeAudio } from './sound.js';

let kalenderData = {};
let segments = [];
let wheelCanvas = null;
let ctx = null;
let rotasjon = 0;   // hjulets nåværende vinkel, så neste spinn fortsetter derfra
let spinner = false;

const COLORS = [
  '#c0392b', '#1a6b3a', '#1565c0', '#7b1fa2',
  '#e65100', '#00695c', '#827717', '#ad1457',
];

export function initWheel() {
  wheelCanvas = document.getElementById('wheel');
  const spinBtn      = document.getElementById('spinBtn');
  const resultDiv    = document.getElementById('result');
  const seasonLabel  = document.getElementById('wheelSeason');

  if (!wheelCanvas || !spinBtn) return;

  ctx = wheelCanvas.getContext('2d');

  fetchData('data/kalender.json').then(data => {
    if (!data) return;
    kalenderData = data;

    // Hjulet gjelder alltid sesongen som pågår — den nyeste i kalenderen.
    const season = Object.keys(kalenderData).sort().pop();
    if (seasonLabel) seasonLabel.textContent = season;

    updateSegments(season);
    drawWheel();
  });

  spinBtn.addEventListener('click', () => {
    resumeAudio(); // unlock AudioContext on user gesture

    if (spinner) return;

    if (segments.length === 0) {
      if (resultDiv) resultDiv.textContent = 'Ingen ubegynte baner igjen!';
      return;
    }

    // Start der hjulet står, ellers hopper det tilbake til utgangspunktet.
    const fra         = rotasjon;
    const totalSpin   = Math.random() * 360 + 1440;
    const duration    = 7000;
    const segAngle    = 360 / segments.length;
    let start         = null;
    let lastTickSeg   = -1;

    spinner = true;
    spinBtn.disabled = true;
    if (resultDiv) resultDiv.textContent = '';

    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min(timestamp - start, duration);
      const ease     = 1 - Math.pow(1 - progress / duration, 3);
      const angle    = fra + totalSpin * ease;

      wheelCanvas.style.transform = `rotate(${angle}deg)`;

      // Tick sound when crossing a segment boundary
      const currentSeg = Math.floor((angle % 360) / segAngle);
      if (currentSeg !== lastTickSeg) {
        const speedFactor = 1 - Math.pow(progress / duration, 0.5);
        playTick(Math.max(0, Math.min(1, speedFactor)));
        lastTickSeg = currentSeg;
      }

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        rotasjon = angle % 360;
        wheelCanvas.style.transform = `rotate(${rotasjon}deg)`;

        const adjustedAngle = (rotasjon + 90) % 360;
        const index = Math.floor((segments.length - (adjustedAngle / segAngle)) % segments.length);
        const winner = segments[index];

        if (resultDiv) resultDiv.textContent = `🏁 ${winner}`;

        spinner = false;
        spinBtn.disabled = false;

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#990000', '#ffffff', '#FFD700', '#aaaaaa'],
        });
      }
    }

    requestAnimationFrame(animate);
  });
}

function updateSegments(season) {
  if (!kalenderData[season]) { segments = []; return; }
  segments = kalenderData[season]
    .filter(r => !r.kjort)
    .map(r => r.navn.replace('[Sprint]', '').trim());
}

function drawWheel() {
  const w = wheelCanvas.width;
  const h = wheelCanvas.height;
  const cx = w / 2, cy = h / 2;
  const r  = Math.min(cx, cy);
  const num = segments.length;

  ctx.clearRect(0, 0, w, h);

  if (num === 0) {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#666';
    ctx.font = 'bold 18px Barlow Condensed, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ingen løp igjen', cx, cy);
    return;
  }

  const anglePer = (2 * Math.PI) / num;
  const fontSize = Math.max(11, Math.min(15, Math.floor(r / (num > 12 ? 14 : 10))));

  for (let i = 0; i < num; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.arc(cx, cy, r, i * anglePer, (i + 1) * anglePer);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(i * anglePer), cy + r * Math.sin(i * anglePer));
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i + 0.5) * anglePer);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize}px Barlow Condensed, Arial`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(segments[i], r - 12, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  ctx.fillStyle = '#0b0b0b';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();
}
