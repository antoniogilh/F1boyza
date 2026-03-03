import { fetchData } from './api.js';

const DAYS_NO = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
const MONTHS_NO = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

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

    const now = new Date();
    const nextIdx = rounds.findIndex(r => new Date(r.dato) > now);

    let html = '<table class="standings-table dates-table"><thead><tr><th>Runde</th><th>Dato</th><th>Status</th></tr></thead><tbody>';

    rounds.forEach((r, i) => {
      const raceDate = new Date(r.dato);
      const isPast = raceDate <= now;
      const isNext = i === nextIdx;

      const statusText = isPast ? 'Ferdig' : isNext ? 'Neste 🏁' : 'Kommende';
      const rowClass = isNext ? 'next-date-row' : '';

      html += `
        <tr class="${rowClass}">
          <td class="name-cell">${r.runde}</td>
          <td>${formatDate(r.dato)}</td>
          <td class="status-cell ${isPast ? 'past' : isNext ? 'next' : 'upcoming'}">${statusText}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }
}
