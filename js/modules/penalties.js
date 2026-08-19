import { fetchData } from './api.js';
import Chart from 'chart.js/auto';
import { kode } from './codes.js';

const CHART_FONT = { family: 'Martian Mono, ui-monospace, monospace', size: 10 };

/** «R21» → 21, så meldingene kan sorteres med siste hendelse øverst. */
function rundeNr(runde) {
  const m = String(runde || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

export function initPenalties() {
  const tbody = document.querySelector('#penaltyTable tbody');
  if (!tbody) return;

  fetchData('data/straff.json').then(data => {
    if (!data) {
      tbody.innerHTML = '<tr><td colspan="5">Kunne ikke laste straffedata.</td></tr>';
      return;
    }

    const grouped = {};
    data.penaltyPoints.forEach(p => {
      if (!grouped[p.fører]) grouped[p.fører] = { events: [], total: 0 };
      grouped[p.fører].events.push(p);
      grouped[p.fører].total += p.poeng;
    });

    const sorted = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
    const worstDriver = sorted[0]?.[0];

    renderChart(sorted, worstDriver);
    renderTable(tbody, sorted, worstDriver);
    renderRaceControl(data.penaltyPoints);
  });
}

function renderChart(sorted, worstDriver) {
  const chartEl = document.getElementById('penaltyChart');
  if (!chartEl) return;

  new Chart(chartEl, {
    type: 'bar',
    data: {
      labels: sorted.map(([name]) => kode(name)),
      datasets: [{
        label: 'Straffepoeng',
        data: sorted.map(([, g]) => g.total),
        backgroundColor: sorted.map(([name]) =>
          name === worstDriver ? 'rgba(255,45,26,0.85)' : 'rgba(255,45,26,0.28)'
        ),
        borderWidth: 0,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#47536a', stepSize: 1, font: CHART_FONT },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: { color: '#e9eff8', font: { ...CHART_FONT, size: 11, weight: '700' } },
          grid: { display: false },
        }
      }
    }
  });
}

function renderTable(tbody, sorted, worstDriver) {
  tbody.innerHTML = sorted.map(([forer, g], i) => {
    const badge = forer === worstDriver
      ? `<span class="shame-badge">Skam</span>`
      : '';
    return `
      <tr>
        <td class="pos-cell">${i + 1}</td>
        <td class="code-cell"><span class="team-bar" style="--team:var(--red-hot)"></span>${kode(forer)}</td>
        <td class="name-cell">${forer}${badge}</td>
        <td class="points-cell">${g.events.length}</td>
        <td class="penalty-total">${g.total}</td>
      </tr>
    `;
  }).join('');
}

function renderRaceControl(hendelser) {
  const el = document.getElementById('raceControl');
  if (!el) return;

  // Dokumentnummer følger kronologien; lista viser siste melding øverst.
  const kronologisk = [...hendelser].sort((a, b) => rundeNr(a.runde) - rundeNr(b.runde));
  const nummerert = kronologisk.map((h, i) => ({ ...h, doc: i + 1 }));

  el.innerHTML = [...nummerert].reverse().map(h => `
    <article class="rc-msg">
      <div class="rc-head">
        <span>Dok ${String(h.doc).padStart(2, '0')}</span>
        <span>${h.runde}</span>
        <span class="rc-car">Bil ${kode(h.fører)}</span>
        <span class="rc-pen">${h.poeng} straffepoeng</span>
      </div>
      <p class="rc-body">${h.beskrivelse}</p>
    </article>
  `).join('');
}
