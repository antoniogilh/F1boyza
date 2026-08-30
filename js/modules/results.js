import { hentResultater, hentKalender } from './data.js';
import Chart from 'chart.js/auto';
import { showDriverModal } from './modal.js';
import { normaliserSesonger, lagTilForer, total } from './season.js';
import { kode } from './codes.js';
import { parsePodium } from './podium.js';

const COLORS = ['#b026ff', '#00d47f', '#ffd320', '#ff6b35', '#06b6d4', '#ff69b4', '#8b5cf6', '#80deea'];

const PLAYER_COLORS = {
  Antonio: '#8b5cf6',
  Dave:    '#eab308',
  Shaya:   '#e8002d',
  Oddi:    '#22c55e',
  Philip:  '#f97316',
  William: '#06b6d4',
};

const CHART_FONT = { family: 'Martian Mono, ui-monospace, monospace', size: 10 };

const CHART_OPTIONS = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: '#e9eff8',
        font: { ...CHART_FONT, size: 11, weight: '600' },
        boxWidth: 10,
        boxHeight: 10,
        padding: 16,
      }
    }
  },
  scales: {
    x: { ticks: { color: '#47536a', font: CHART_FONT }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#47536a', font: CHART_FONT }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
  }
};

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

/** Lagfarge først, ellers spillerens egen farge, ellers paletten. */
function fargeFor(data, navn, idx) {
  const lag = lagTilForer(data, navn);
  if (lag && lag.farge) return lag.farge;
  return PLAYER_COLORS[navn] || COLORS[idx % COLORS.length];
}

function buildTable(tableEl, entries, allDrivers, kalenderData, rounds, farge) {
  const sorted = [...entries].sort((a, b) => total(b.poeng) - total(a.poeng));
  const leaderTotal = total(sorted[0].poeng);
  // Før første løp står alle likt — da sier posisjon og gap ingenting.
  const sesongStartet = leaderTotal > 0;

  let html = '';
  sorted.forEach((entry, idx) => {
    const sum      = total(entry.poeng);
    const bak      = leaderTotal - sum;
    const posClass = sesongStartet && idx === 0 ? 'pos-1' : '';
    const badge    = sesongStartet && idx === 0 ? `<span class="leader-badge">Leder</span>` : '';
    const gap      = idx === 0 || !sesongStartet
      ? '<td class="gap-cell">—</td>'
      : `<td class="gap-cell" title="${bak} poeng bak lederen">+${bak}</td>`;

    html += `
      <tr class="clickable-row ${posClass}" data-driver="${entry.navn}" title="Åpne førerkort">
        <td class="pos-cell">${idx + 1}</td>
        <td class="code-cell"><span class="team-bar" style="--team:${farge(entry, idx)}"></span>${kode(entry.navn)}</td>
        <td class="name-cell">${entry.navn}${badge}</td>
        <td class="points-cell">${sum}</td>
        ${gap}
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

function computeStats(kalenderData) {
  const wins = {}, poles = {}, sprints = {}, slamDunks = {};
  let lastWinner = null, currentStreak = 0, bestStreak = { driver: null, count: 0 };

  Object.values(kalenderData).forEach(season => {
    season.forEach(race => {
      if (!race.kjort || !race.podium) return;
      const { pole, sprintpole, vinner: winner, sprint, slamDunk } = parsePodium(race.podium);

      if (winner) {
        wins[winner] = (wins[winner] || 0) + 1;
        currentStreak = winner === lastWinner ? currentStreak + 1 : 1;
        lastWinner = winner;
        if (currentStreak > bestStreak.count) bestStreak = { driver: winner, count: currentStreak };
      }
      // Sprint-pole teller som pole, på linje med løps-polen.
      if (pole)       poles[pole]           = (poles[pole] || 0) + 1;
      if (sprintpole) poles[sprintpole]     = (poles[sprintpole] || 0) + 1;
      if (sprint)     sprints[sprint]       = (sprints[sprint] || 0) + 1;
      if (slamDunk) slamDunks[winner] = (slamDunks[winner] || 0) + 1;
    });
  });

  return {
    topWinner: Object.entries(wins).sort((a, b) => b[1] - a[1])[0],
    topPole:   Object.entries(poles).sort((a, b) => b[1] - a[1])[0],
    topSprint: Object.entries(sprints).sort((a, b) => b[1] - a[1])[0],
    topSlam:   Object.entries(slamDunks).sort((a, b) => b[1] - a[1])[0],
    bestStreak,
  };
}

function renderStats(stats) {
  const el = document.getElementById('statsBlock');
  if (!el) return;

  const stat = (label, value) => `
    <div class="stat-item">
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value || '—'}</span>
    </div>
  `;

  el.innerHTML =
    stat('Flest seire',       stats.topWinner ? `${stats.topWinner[0]} · ${stats.topWinner[1]}` : null) +
    stat('Flest poles',       stats.topPole   ? `${stats.topPole[0]} · ${stats.topPole[1]}`     : null) +
    stat('Flest sprintseire', stats.topSprint ? `${stats.topSprint[0]} · ${stats.topSprint[1]}` : null) +
    stat('Lengste seiersrekke', stats.bestStreak.driver ? `${stats.bestStreak.driver} · ${stats.bestStreak.count}` : null) +
    stat('Flest slam dunks',  stats.topSlam   ? `${stats.topSlam[0]} · ${stats.topSlam[1]}`     : null);
}

function renderDominance(forere) {
  const el = document.getElementById('dominanceMeter');
  if (!el) return;

  const sorted = [...forere].sort((a, b) => total(b.poeng) - total(a.poeng));
  if (sorted.length < 2) return;

  const leader = sorted[0];
  const last   = sorted[sorted.length - 1];
  const max    = total(leader.poeng);
  const gap    = max - total(last.poeng);

  // Ingen løp kjørt ennå – tomme søylediagram og «X leder med 0» sier ingenting.
  if (max === 0) {
    el.innerHTML = '<p class="dom-label">Sesongen har ikke startet. Alt er fortsatt mulig, selv for Dave.</p>';
    return;
  }

  let phraseIdx;
  if (gap === 0)      phraseIdx = 0;
  else if (gap <= 15) phraseIdx = 1;
  else if (gap <= 30) phraseIdx = 2;
  else if (gap <= 60) phraseIdx = 3;
  else                phraseIdx = 4;

  const bars = sorted.map(d => {
    const pts = total(d.poeng);
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
    hentResultater(),
    hentKalender(),
  ]).then(([rawData, kalenderData]) => {
    if (!rawData) return;

    // Datafila er per løp; her og videre jobber vi med løpende totaler.
    const allData = normaliserSesonger(rawData);

    const seasonSelect = document.getElementById('seasonSelect');
    const seasons = Object.keys(allData).sort().reverse();

    seasons.forEach(yr => seasonSelect.add(new Option(yr, yr)));

    // Default to latest season that has actual data
    const defaultSeason = seasons.find(yr => allData[yr].forere.some(f => f.poeng.length > 0)) || seasons[0];
    seasonSelect.value = defaultSeason;

    let driverChart = null;
    let teamChart   = null;
    // Botsa er med som standard; knappen tar dem bort når grida blir uleselig.
    let visBots = true;

    const botBtn = document.getElementById('botToggle');
    if (botBtn) {
      botBtn.addEventListener('click', () => {
        visBots = !visBots;
        render();
      });
    }

    function render() {
      const data = allData[seasonSelect.value];
      if (!data) return;

      // Et lag regnes som menneskelig så lenge minst én av førerne er det.
      const harBots = data.forere.some(f => f.bot);
      const menneskelag = new Set(
        data.forere.filter(f => !f.bot)
          .map(f => (lagTilForer(data, f.navn) || {}).navn)
      );

      const synligeForere = visBots ? data.forere : data.forere.filter(f => !f.bot);
      const synligeLag    = visBots ? data.lag    : data.lag.filter(l => menneskelag.has(l.navn));

      if (botBtn) {
        botBtn.hidden = !harBots;
        botBtn.textContent = visBots ? 'Bare mennesker' : 'Vis alle førere';
      }

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
          datasets: synligeForere.map((f, i) => {
            // Førere arver lagfargen; makkeren får stiplet linje så de kan skilles.
            const lag   = lagTilForer(data, f.navn);
            const color = fargeFor(data, f.navn, i);
            const erMakker = lag ? (lag.forere || []).indexOf(f.navn) > 0 : false;
            return {
              label: f.navn, data: [...f.poeng], tension: 0,
              borderWidth: 3, pointRadius: 4, pointHoverRadius: 6,
              borderColor: color,
              borderDash: erMakker ? [7, 5] : [],
              backgroundColor: makeGradient(driverCtx, color),
              fill: true,
            };
          })
        },
        options: CHART_OPTIONS,
      });

      buildTable(
        document.getElementById('driverTable'), synligeForere, synligeForere,
        kalenderData || {}, data.runder,
        (entry, i) => fargeFor(data, entry.navn, i),
      );

      teamChart = new Chart(teamChartEl, {
        type: 'line',
        data: {
          labels: data.runder,
          datasets: synligeLag.map((l, i) => {
            const color = l.farge || COLORS[i % COLORS.length];
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

      buildTable(
        document.getElementById('teamTable'), synligeLag, synligeLag,
        kalenderData || {}, data.runder,
        (entry, i) => entry.farge || COLORS[i % COLORS.length],
      );

      if (toggleBtn) {
        toggleBtn.onclick = () => {
          cumulative = !cumulative;
          toggleBtn.textContent = cumulative ? 'Vis per runde' : 'Vis totalt';

          driverChart.data.datasets.forEach((ds, i) => {
            ds.data = cumulative ? [...synligeForere[i].poeng] : toPerRound(synligeForere[i].poeng);
          });
          driverChart.update();

          teamChart.data.datasets.forEach((ds, i) => {
            ds.data = cumulative ? [...synligeLag[i].poeng] : toPerRound(synligeLag[i].poeng);
          });
          teamChart.update();
        };
      }

      if (kalenderData) renderStats(computeStats(kalenderData));
      renderDominance(synligeForere);
    }

    seasonSelect.addEventListener('change', render);
    render();
  });
}
