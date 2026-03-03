import { fetchData } from './api.js';

export function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  fetchData('data/datoer.json').then(data => {
    if (!data) return;

    const now = new Date();
    let nextDate = null;

    Object.keys(data).sort().forEach(season => {
      data[season].forEach(entry => {
        const d = new Date(entry.dato);
        if (d > now && (!nextDate || d < nextDate)) nextDate = d;
      });
    });

    if (!nextDate) {
      el.innerHTML = `<span class="countdown-label">Ingen kommende løp registrert</span>`;
      return;
    }

    let digits = null;

    function buildDOM() {
      el.innerHTML = `
        <span class="countdown-label">Neste løp om</span>
        <span class="countdown-units">
          <span class="flip-unit">
            <span class="flip-digit" id="cd-d">0</span>
            <span class="flip-label">dager</span>
          </span>
          <span class="flip-sep">:</span>
          <span class="flip-unit">
            <span class="flip-digit" id="cd-h">00</span>
            <span class="flip-label">timer</span>
          </span>
          <span class="flip-sep">:</span>
          <span class="flip-unit">
            <span class="flip-digit" id="cd-m">00</span>
            <span class="flip-label">min</span>
          </span>
          <span class="flip-sep">:</span>
          <span class="flip-unit">
            <span class="flip-digit" id="cd-s">00</span>
            <span class="flip-label">sek</span>
          </span>
        </span>
      `;
      digits = {
        d: document.getElementById('cd-d'),
        h: document.getElementById('cd-h'),
        m: document.getElementById('cd-m'),
        s: document.getElementById('cd-s'),
      };
    }

    function setDigit(digitEl, val) {
      if (digitEl.textContent === val) return;
      digitEl.textContent = val;
      digitEl.classList.remove('flip');
      void digitEl.offsetWidth; // force reflow to restart animation
      digitEl.classList.add('flip');
    }

    function tick() {
      const diff = nextDate - new Date();

      if (diff <= 0) {
        document.body.classList.add('race-weekend');
        el.innerHTML = `<span class="countdown-label">Det er løpshelg!</span><span class="countdown-timer">🏁 SPIN THE WHEEL!</span>`;
        return;
      }

      document.body.classList.remove('race-weekend');

      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (!digits) buildDOM();

      setDigit(digits.d, String(d));
      setDigit(digits.h, String(h).padStart(2, '0'));
      setDigit(digits.m, String(m).padStart(2, '0'));
      setDigit(digits.s, String(s).padStart(2, '0'));

      setTimeout(tick, 1000);
    }

    tick();
  });
}
