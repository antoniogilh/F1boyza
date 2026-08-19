import { fetchData } from './api.js';

const DAYS_NO = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
const MONTHS_NO = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

function startenAvDagen(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS_NO[d.getDay()]} ${d.getDate()}. ${MONTHS_NO[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Merkelapp for samleraden med udaterte runder. «R2–R24» bare når de
 * faktisk henger sammen — ellers ville spennet påstå at daterte runder
 * mangler dato.
 */
function samleMerke(utenDato, rounds) {
  if (utenDato.length === 1) return utenDato[0].runde;

  const plasser = utenDato.map(r => rounds.indexOf(r));
  const sammenhengende = plasser.every((n, i) => i === 0 || n === plasser[i - 1] + 1);

  return sammenhengende
    ? `${utenDato[0].runde}–${utenDato[utenDato.length - 1].runde}`
    : `${utenDato.length} runder`;
}

export function initDates() {
  const container = document.getElementById('datesTable');
  const seasonSelect = document.getElementById('season');
  if (!container || !seasonSelect) return;

  let datesData = {};

  fetchData('data/datoer.json').then(data => {
    if (!data) {
      container.innerHTML = '<p>Kunne ikke laste datoer.</p>';
      return;
    }
    datesData = data;
    renderDates(seasonSelect.value);
  });

  seasonSelect.addEventListener('change', e => renderDates(e.target.value));

  function renderDates(season) {
    const rounds = datesData[season];
    if (!rounds || !rounds.length) {
      container.innerHTML = '<p class="empty-note">Ingen runder registrert for denne sesongen.</p>';
      return;
    }

    // Runder uten dato får én samlerad til slutt. Med 23 udaterte runder
    // ville én rad per runde bare vært den samme setningen 23 ganger.
    const medDato  = rounds.filter(r => r.dato);
    const utenDato = rounds.filter(r => !r.dato);

    // Dag-oppløsning: løpet i dag er ikke ferdig.
    const idag = startenAvDagen(new Date());
    const nextIdx = medDato.findIndex(r => startenAvDagen(new Date(r.dato)) >= idag);

    let html = '<div class="table-wrap"><table class="standings-table dates-table"><thead><tr>'
      + '<th>Runde</th><th>Dato</th><th style="text-align:right">Status</th>'
      + '</tr></thead><tbody>';

    medDato.forEach((r, i) => {
      const isNext = i === nextIdx;
      const isPast = !isNext && startenAvDagen(new Date(r.dato)) < idag;

      const statusText  = isPast ? 'Ferdig' : isNext ? 'Neste' : 'Kommende';
      const statusClass = isPast ? 'past' : isNext ? 'next' : 'upcoming';

      html += `
        <tr class="${isNext ? 'next-date-row' : ''}">
          <td class="round-cell">${r.runde}</td>
          <td>${formatDate(r.dato)}</td>
          <td class="status-cell ${statusClass}" style="text-align:right">${statusText}</td>
        </tr>
      `;
    });

    if (utenDato.length) {
      html += `
        <tr class="undated-row">
          <td class="round-cell">${samleMerke(utenDato, rounds)}</td>
          <td>Dato ikke satt</td>
          <td style="text-align:right">—</td>
        </tr>
      `;
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }
}
