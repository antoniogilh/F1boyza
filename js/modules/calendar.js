import { hentKalender } from './data.js';

let kalenderData = {};

const FLAGS = {
  'bahrain': '🇧🇭',
  'saudi': '🇸🇦',
  'australia': '🇦🇺',
  'japan': '🇯🇵',
  'china': '🇨🇳',
  'miami': '🇺🇸',
  'imola': '🇮🇹',
  'monaco': '🇲🇨',
  'canada': '🇨🇦',
  'spania': '🇪🇸',
  'spain': '🇪🇸',
  'austria': '🇦🇹',
  'silverstone': '🇬🇧',
  'hungarn': '🇭🇺',
  'hungary': '🇭🇺',
  'spa': '🇧🇪',
  'zandvoort': '🇳🇱',
  'monza': '🇮🇹',
  'azerbaijan': '🇦🇿',
  'singapore': '🇸🇬',
  'texas': '🇺🇸',
  'mexico': '🇲🇽',
  'interlagos': '🇧🇷',
  'las vegas': '🇺🇸',
  'qatar': '🇶🇦',
  'abu dhabi': '🇦🇪',
};

function getFlag(name) {
  const lower = name.toLowerCase();
  for (const [key, flag] of Object.entries(FLAGS)) {
    if (lower.includes(key)) return flag;
  }
  return '🏁';
}

function formatPodium(podiumStr) {
  if (!podiumStr || !podiumStr.trim()) return '';
  return podiumStr
    .split(/,\s*/)
    .map(part => {
      const [label, ...rest] = part.split(':');
      if (!rest.length) return `<span class="podium-item">${part.trim()}</span>`;
      return `<span class="podium-item"><span class="podium-key">${label.trim()}</span>${rest.join(':').trim()}</span>`;
    })
    .join('');
}

export function initCalendar() {
  const seasonSelect = document.getElementById('season');
  const calendarContainer = document.getElementById('calendar');

  if (!seasonSelect || !calendarContainer) return;

  hentKalender().then(data => {
    if (!data) {
      calendarContainer.innerHTML = '<p>Kunne ikke laste kalenderdata.</p>';
      return;
    }
    kalenderData = data;
    loadSeason(seasonSelect.value);
  });

  seasonSelect.addEventListener('change', (e) => {
    loadSeason(e.target.value);
  });
}

function loadSeason(season) {
  const container = document.getElementById('calendar');
  container.innerHTML = '';

  if (!kalenderData[season]) {
    container.innerHTML = '<p>Ingen løp registrert for denne sesongen</p>';
    return;
  }

  const races = kalenderData[season];

  let html = '';
  races.forEach((race, i) => {
    const isSprint = race.navn.includes('[Sprint]');
    const cleanName = race.navn.replace('[Sprint]', '').trim();
    const flag = getFlag(cleanName);

    const statusClass = race.kjort ? 'done' : 'not-done';
    const statusText  = race.kjort ? 'Kjørt' : 'Ikke kjørt';
    const sprintBadge = isSprint ? `<span class="sprint-badge">Sprint</span>` : '';
    const podiumHtml = race.kjort && race.podium
      ? `<div class="podium">${formatPodium(race.podium)}</div>`
      : '';

    html += `
      <div class="race ${statusClass}">
        <div class="race-num">R${String(i + 1).padStart(2, '0')}</div>
        <div class="race-flag">${flag}</div>
        <div class="race-body">
          <div class="race-title-row">
            <span class="race-name">${cleanName}</span>
            ${sprintBadge}
          </div>
          ${podiumHtml}
        </div>
        <div class="race-status">${statusText}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Stagger fade-in per race row
  container.querySelectorAll('.race').forEach((el, i) => {
    el.style.animationDelay = `${i * 40}ms`;
  });
}
