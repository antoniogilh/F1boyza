import { hentDatoer } from './data.js';

function startenAvDagen(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function lopshelg(el, runde) {
  document.body.classList.add('race-weekend');
  el.innerHTML = `
    <span class="countdown-label">Løpshelg · ${runde}</span>
    <span class="countdown-timer">Spin hjulet</span>
  `;
}

export function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  hentDatoer().then(data => {
    if (!data) return;

    // Datoene er dager, ikke klokkeslett. Et løp «i dag» er ikke passert.
    const now  = new Date();
    const idag = startenAvDagen(now);
    let neste  = null;

    Object.keys(data).sort().forEach(season => {
      data[season].forEach(entry => {
        if (!entry.dato) return; // dato ikke satt ennå
        const d = new Date(entry.dato);
        if (startenAvDagen(d) < idag) return;
        if (!neste || d < neste.dato) neste = { dato: d, runde: entry.runde };
      });
    });

    if (!neste) {
      el.innerHTML = `<span class="countdown-label">Ingen kommende løp satt opp</span>`;
      return;
    }

    if (startenAvDagen(neste.dato).getTime() === idag.getTime()) {
      lopshelg(el, neste.runde);
      return;
    }

    let digits = null;

    function buildDOM() {
      el.innerHTML = `
        <span class="countdown-label">Neste løp · ${neste.runde}</span>
        <span class="countdown-units">
          <span class="flip-unit">
            <span class="flip-digit" id="cd-d">0</span>
            <span class="flip-label">dag</span>
          </span>
          <span class="flip-unit">
            <span class="flip-digit" id="cd-h">00</span>
            <span class="flip-label">tim</span>
          </span>
          <span class="flip-unit">
            <span class="flip-digit" id="cd-m">00</span>
            <span class="flip-label">min</span>
          </span>
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

    // Feltet lyser opp i det verdien låses, som et timing-felt som oppdateres.
    function setDigit(digitEl, val) {
      if (digitEl.textContent === val) return;
      digitEl.textContent = val;
      digitEl.classList.add('flip');
      clearTimeout(digitEl.dataset.timer);
      digitEl.dataset.timer = setTimeout(() => digitEl.classList.remove('flip'), 140);
    }

    function tick() {
      const diff = neste.dato - new Date();

      if (diff <= 0) {
        lopshelg(el, neste.runde);
        return;
      }

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
