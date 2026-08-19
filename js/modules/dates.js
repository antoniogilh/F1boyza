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
    if (!rounds) {
      container.innerHTML = '<p>Ingen datoer registrert for denne sesongen.</p>';
      return;
    }

    // Dag-oppløsning: løpet i dag er ikke ferdig.
    const idag = startenAvDagen(new Date());
    const nextIdx = rounds.findIndex(r => r.dato && startenAvDagen(new Date(r.dato)) >= idag);

    let html = '<div class="table-wrap"><table class="standings-table dates-table"><thead><tr>'
      + '<th>Runde</th><th>Dato</th><th style="text-align:right">Status</th>'
      + '</tr></thead><tbody>';

    rounds.forEach((r, i) => {
      const isTbd  = !r.dato;
      const isNext = i === nextIdx;
      const isPast = !isTbd && !isNext && startenAvDagen(new Date(r.dato)) < idag;

      const statusText  = isTbd ? 'Ikke satt' : isPast ? 'Ferdig' : isNext ? 'Neste' : 'Kommende';
      const statusClass = isTbd ? 'tbd' : isPast ? 'past' : isNext ? 'next' : 'upcoming';
      const rowClass    = isNext ? 'next-date-row' : '';

      html += `
        <tr class="${rowClass}">
          <td class="round-cell">${r.runde}</td>
          <td${isTbd ? ' class="tbd-date"' : ''}>${isTbd ? 'Kommer snart' : formatDate(r.dato)}</td>
          <td class="status-cell ${statusClass}" style="text-align:right">${statusText}</td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }
}
