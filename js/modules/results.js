import { fetchData } from './api.js';
import Chart from 'chart.js/auto';
import { showDriverModal } from './modal.js';

const COLORS = ['#990000', '#FFD700', '#00b4d8', '#ff6b35', '#7fff7f', '#ff69b4', '#b388ff', '#80deea'];

const PLAYER_COLORS = {
  Frenzy:  '#990000',
  Gorba:   '#22c55e',
  Antonio: '#8b5cf6',
  Dave:    '#eab308',
};

const CHART_OPTIONS = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: '#ccc',
        font: { family: 'Barlow Condensed, Segoe UI, Arial', size: 14, weight: 'bold' },
        padding: 16,
      }
    }
  },
  scales: {
    x: { ticks: { color: '#777' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#777' }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
  }
};

const MEDALS = ['🥇', '🥈', '🥉'];

const DOM_PHRASES = [
  (leader, last, gap) => `${leader} og ${last} er skilt med ${gap} poeng. ${last} nekter å gi opp.`,
  (leader, last, gap) => `${leader} leder med ${gap} poeng. ${last} hevder han er i form.`,
  (leader, last, gap) => `${gap} poeng mellom topp og bunn. ${last} kaller det "en arbeidshelg".`,
  (leader, last, gap) => `${leader} knuser ${last} med ${gap} poeng. Sesongen er ikke over. Men nesten.`,
  (leader, last, gap) => `${leader} er ${gap} poeng foran ${last}. Det er ikke et race lenger, det er en begravelse.`,
];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function makeGradient(ctx, hex) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, hexToRgba(hex, 0.28));
  gradient.addColorStop(1, hexToRgba(hex, 0));
  return gradient;
}

function toPerRound(cumulative) {
  return cumulative.map((val, i) => i === 0 ? val : val - cumulative[i - 1]);
}

function playerAvatar(name) {
  const color = PLAYER_COLORS[name];
  if (!color) return '';
  return `<span class="player-avatar" style="background:${color}">${name[0].toUpperCase()}</span>`;
}

function buildTable(tableEl, entries, allDrivers, kalenderData, rounds) {
  const sorted = [...entries].sort((a, b) =>
    b.poeng[b.poeng.length - 1] - a.poeng[a.poeng.length - 1]
  );
  const leaderTotal = sorted[0].poeng[sorted[0].poeng.length - 1];

  let html = '';
  sorted.forEach((entry, idx) => {
    const total    = entry.poeng[entry.poeng.length - 1];
    const gap      = idx === 0 ? '—' : `-${leaderTotal - total}p`;
    const posClass = idx < 3 ? `pos-${idx + 1}` : '';
    const posIcon  = idx < 3 ? MEDALS[idx] : `${idx + 1}`;
    const badge    = idx === 0 ? `<span class="leader-badge">Leader</span>` : '';
    const avatar   = playerAvatar(entry.navn);

    html += `
      <tr class="${posClass}" data-driver="${entry.navn}" style="cursor:pointer" title="Klikk for stats">
        <td class="pos-cell">${posIcon}</td>
        <td class="name-cell">${avatar}${entry.navn}${badge}</td>
        <td class="points-cell">${total}</td>
        <td class="gap-cell">${gap}</td>
      </tr>
    `;
  });

  tableEl.querySelector('tbody').innerHTML = html;

  tableEl.querySelectorAll('tbody tr').forEach(row => {
    row.addEventListener('click', () => {
      const name   = row.dataset.driver;
      const driver = entries.find(e => e.navn === name);
      if (driver) showDriverModal(driver, allDrivers, kalenderData, rounds);
    });
  });
}

function extractName(text, label) {
  const m = text.match(new RegExp(label + ':\\s*([\\w]+)', 'i'));
  return m ? m[1].trim() : null;
}

function computeStats(kalenderData, resultsData) {
  const wins = {}, poles = {}, sprints = {};
  let lastWinner = null, currentStreak = 0, bestStreak = { driver: null, count: 0 };

  Object.values(kalenderData).forEach(season => {
    season.forEach(race => {
      if (!race.kjort || !race.podium) return;
      const winner = extractName(race.podium, 'Racevinner');
      const pole   = extractName(race.podium, 'Pole');
      const sprint = extractName(race.podium, 'Sprintvinner');

      if (winner) {
        wins[winner] = (wins[winner] || 0) + 1;
        currentStreak = winner === lastWinner ? currentStreak + 1 : 1;
        lastWinner = winner;
        if (currentStreak > bestStreak.count) bestStreak = { driver: winner, count: currentStreak };
      }
      if (pole)   poles[pole]     = (poles[pole] || 0) + 1;
      if (sprint) sprints[sprint] = (sprints[sprint] || 0) + 1;
    });
  });

  let bigHaul = { driver: null, points: 0, round: null };
  resultsData.forere.forEach(f => {
    f.poeng.forEach((val, i) => {
      const delta = i === 0 ? val : val - f.poeng[i - 1];
      if (delta > bigHaul.points) bigHaul = { driver: f.navn, points: delta, round: resultsData.runder[i] };
    });
  });

  return {
    topWinner: Object.entries(wins).sort((a, b) => b[1] - a[1])[0],
    topPole:   Object.entries(poles).sort((a, b) => b[1] - a[1])[0],
    topSprint: Object.entries(sprints).sort((a, b) => b[1] - a[1])[0],
    bestStreak, bigHaul,
  };
}

function renderStats(stats) {
  const el = document.getElementById('statsBlock');
  if (!el) return;

  const stat = (icon, label, value) => `
    <div class="stat-item">
      <span class="stat-icon">${icon}</span>
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value || '—'}</span>
    </div>
  `;

  el.innerHTML =
    stat('🏆', 'Mest seire',       stats.topWinner ? `${stats.topWinner[0]} (${stats.topWinner[1]})` : null) +
    stat('⚡', 'Mest poles',       stats.topPole   ? `${stats.topPole[0]} (${stats.topPole[1]})`     : null) +
    stat('💨', 'Mest sprintseire', stats.topSprint ? `${stats.topSprint[0]} (${stats.topSprint[1]})` : null) +
    stat('🔥', 'Lengste streak',   stats.bestStreak.driver ? `${stats.bestStreak.driver} (${stats.bestStreak.count})` : null) +
    stat('💰', 'Beste runde',      stats.bigHaul.driver ? `${stats.bigHaul.driver} +${stats.bigHaul.points}p (${stats.bigHaul.round})` : null);
}

function renderDominance(forere) {
  const el = document.getElementById('dominanceMeter');
  if (!el) return;

  const sorted = [...forere].sort((a, b) =>
    b.poeng[b.poeng.length - 1] - a.poeng[a.poeng.length - 1]
  );
  if (sorted.length < 2) return;

  const leader = sorted[0];
  const last   = sorted[sorted.length - 1];
  const gap    = leader.poeng[leader.poeng.length - 1] - last.poeng[last.poeng.length - 1];
  const max    = leader.poeng[leader.poeng.length - 1];

  let phraseIdx;
  if (gap === 0)      phraseIdx = 0;
  else if (gap <= 15) phraseIdx = 1;
  else if (gap <= 30) phraseIdx = 2;
  else if (gap <= 60) phraseIdx = 3;
  else                phraseIdx = 4;

  const bars = sorted.map(d => {
    const pts = d.poeng[d.poeng.length - 1];
    const pct = Math.round((pts / max) * 100);
    return `
      <div class="dom-row">
        <span class="dom-name">${d.navn}</span>
        <div class="dom-bar-track">
          <div class="dom-bar" style="width:${pct}%"></div>
        </div>
        <span class="dom-pts">${pts}p</span>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <p class="dom-label">${DOM_PHRASES[phraseIdx](leader.navn, last.navn, gap)}</p>
    <div class="dom-bars">${bars}</div>
  `;
}

export function initResults() {
  const driverChartEl = document.getElementById('driverChart');
  const teamChartEl   = document.getElementById('teamChart');
  if (!driverChartEl || !teamChartEl) return;

  Promise.all([
    fetchData('data/resultater.json'),
    fetchData('data/kalender.json'),
  ]).then(([allData, kalenderData]) => {
    if (!allData) return;

    const seasonSelect = document.getElementById('seasonSelect');
    const seasons = Object.keys(allData).sort().reverse();

    seasons.forEach(yr => seasonSelect.add(new Option(yr, yr)));

    // Default to latest season that has actual data
    const defaultSeason = seasons.find(yr => allData[yr].forere.some(f => f.poeng.length > 0)) || seasons[0];
    seasonSelect.value = defaultSeason;

    let driverChart = null;
    let teamChart   = null;

    function render() {
      const data = allData[seasonSelect.value];
      if (!data) return;

      let cumulative = true;
      const toggleBtn = document.getElementById('chartToggle');
      if (toggleBtn) toggleBtn.textContent = 'Vis per runde';

      const driverCtx = driverChartEl.getContext('2d');
      const teamCtx   = teamChartEl.getContext('2d');

      if (driverChart) driverChart.destroy();
      if (teamChart)   teamChart.destroy();

      driverChart = new Chart(driverChartEl, {
        type: 'line',
        data: {
          labels: data.runder,
          datasets: data.forere.map((f, i) => {
            const color = COLORS[i % COLORS.length];
            return {
              label: f.navn, data: [...f.poeng], tension: 0,
              borderWidth: 3, pointRadius: 4, pointHoverRadius: 6,
              borderColor: color,
              backgroundColor: makeGradient(driverCtx, color),
              fill: true,
            };
          })
        },
        options: CHART_OPTIONS,
      });

      buildTable(document.getElementById('driverTable'), data.forere, data.forere, kalenderData || {}, data.runder);

      teamChart = new Chart(teamChartEl, {
        type: 'line',
        data: {
          labels: data.runder,
          datasets: data.lag.map((l, i) => {
            const color = COLORS[i % COLORS.length];
            return {
              label: l.navn, data: [...l.poeng], tension: 0,
              borderWidth: 3, pointRadius: 4, pointHoverRadius: 6,
              borderColor: color,
              backgroundColor: makeGradient(teamCtx, color),
              fill: true,
            };
          })
        },
        options: CHART_OPTIONS,
      });

      buildTable(document.getElementById('teamTable'), data.lag, data.lag, kalenderData || {}, data.runder);

      if (toggleBtn) {
        toggleBtn.onclick = () => {
          cumulative = !cumulative;
          toggleBtn.textContent = cumulative ? 'Vis per runde' : 'Vis totalt';

          driverChart.data.datasets.forEach((ds, i) => {
            ds.data = cumulative ? [...data.forere[i].poeng] : toPerRound(data.forere[i].poeng);
          });
          driverChart.update();

          teamChart.data.datasets.forEach((ds, i) => {
            ds.data = cumulative ? [...data.lag[i].poeng] : toPerRound(data.lag[i].poeng);
          });
          teamChart.update();
        };
      }

      if (kalenderData) renderStats(computeStats(kalenderData, data));
      renderDominance(data.forere);
    }

    seasonSelect.addEventListener('change', render);
    render();
  });
}
