import { fetchData } from './api.js';

const STORAGE_KEY = 'f1boyza_predictions';
const PLAYERS = ['Frenzy', 'Gorba', 'Antonio', 'Dave'];
const MONTHS_NO = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDate(str) {
  const d = new Date(str);
  return `${d.getDate()}. ${MONTHS_NO[d.getMonth()]} ${d.getFullYear()}`;
}

export function initPredictions() {
  const el = document.getElementById('predictionsSection');
  if (!el) return;

  fetchData('data/datoer.json').then(data => {
    if (!data) return;

    const now = new Date();
    let nextRound = null, nextSeason = null;

    Object.keys(data).sort().forEach(season => {
      data[season].forEach(entry => {
        if (new Date(entry.dato) > now && !nextRound) {
          nextRound = entry;
          nextSeason = season;
        }
      });
    });

    if (!nextRound) {
      el.innerHTML = '<p style="color:#555">Ingen kommende runder å predikere.</p>';
      return;
    }

    render(nextRound, nextSeason);
  });

  function render(round, season) {
    const all      = load();
    const key      = `${season}_${round.runde}`;
    const roundData = all[key] || { predictions: [], actual: null };

    const predsHtml = roundData.predictions.length > 0
      ? `<table class="standings-table pred-table">
          <thead><tr><th>Spiller</th><th>Pick</th>${roundData.actual ? '<th></th>' : ''}</tr></thead>
          <tbody>
            ${roundData.predictions.map(p => {
              const correct = roundData.actual && p.pick === roundData.actual;
              return `<tr class="${correct ? 'pred-correct' : ''}">
                <td class="name-cell">${p.player}</td>
                <td>${p.pick}</td>
                ${roundData.actual ? `<td>${correct ? '✅' : '❌'}</td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>`
      : '<p class="pred-empty">Ingen prediksjoner ennå — vær den første!</p>';

    el.innerHTML = `
      <div class="pred-header">
        <span class="pred-round">${round.runde}</span>
        <span class="pred-date">${formatDate(round.dato)}</span>
      </div>
      ${predsHtml}
      <form id="predForm" class="pred-form">
        <select id="predPlayer" class="season-select">
          <option value="">Ditt navn...</option>
          ${PLAYERS.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <select id="predPick" class="season-select">
          <option value="">Din pick...</option>
          ${PLAYERS.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <button type="submit" class="pred-submit">Legg til</button>
      </form>
      ${roundData.predictions.length > 0 ? `
        <div class="pred-actual-row">
          <span class="pred-actual-label">Fasit (etter løpet):</span>
          <select id="actualWinner" class="season-select">
            <option value="">Velg vinner...</option>
            ${PLAYERS.map(p => `<option value="${p}" ${roundData.actual === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
          <button id="setActual" class="pred-submit">Sett fasit</button>
        </div>
      ` : ''}
    `;

    document.getElementById('predForm').addEventListener('submit', e => {
      e.preventDefault();
      const player = document.getElementById('predPlayer').value;
      const pick   = document.getElementById('predPick').value;
      if (!player || !pick) return;

      const all = load();
      if (!all[key]) all[key] = { predictions: [], actual: null };
      all[key].predictions = all[key].predictions.filter(p => p.player !== player);
      all[key].predictions.push({ player, pick });
      save(all);
      render(round, season);
    });

    const actualBtn = document.getElementById('setActual');
    if (actualBtn) {
      actualBtn.addEventListener('click', () => {
        const winner = document.getElementById('actualWinner').value;
        if (!winner) return;
        const all = load();
        if (!all[key]) all[key] = { predictions: [], actual: null };
        all[key].actual = winner;
        save(all);
        render(round, season);
      });
    }
  }
}
