import { fetchData } from './api.js';

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
    .map(part => `<span class="podium-item">${part.trim()}</span>`)
    .join('');
}

export function initCalendar() {
  const seasonSelect = document.getElementById('season');
  const calendarContainer = document.getElementById('calendar');

  if (!seasonSelect || !calendarContainer) return;

  fetchData('data/kalender.json').then(data => {
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
    const statusIcon = race.kjort ? '✅' : '🔴';
    const sprintBadge = isSprint ? `<span class="sprint-badge">Sprint</span>` : '';
    const podiumHtml = race.kjort && race.podium
      ? `<div class="podium">${formatPodium(race.podium)}</div>`
      : '';

    html += `
      <div class="race ${statusClass}">
        <div class="race-num">#${i + 1}</div>
        <div class="race-flag">${flag}</div>
        <div class="race-body">
          <div class="race-title-row">
            <span class="race-name">${cleanName}</span>
            ${sprintBadge}
            <span class="race-status">${statusIcon}</span>
          </div>
          ${podiumHtml}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Stagger fade-in per race row
  container.querySelectorAll('.race').forEach((el, i) => {
    el.style.animationDelay = `${i * 40}ms`;
  });
}
