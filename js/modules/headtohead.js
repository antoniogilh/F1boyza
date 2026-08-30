import { hentResultater } from './data.js';
import Chart from 'chart.js/auto';
import { normaliserSesonger, total } from './season.js';

const CHART_FONT = { family: 'Martian Mono, ui-monospace, monospace', size: 10 };

export function initHeadToHead() {
  const sel1    = document.getElementById('h2hDriver1');
  const sel2    = document.getElementById('h2hDriver2');
  const chartEl = document.getElementById('h2hChart');
  if (!sel1 || !sel2 || !chartEl) return;

  hentResultater().then(rawData => {
    if (!rawData) return;

    // Datafila er per løp; grafen viser løpende totaler.
    const allData = normaliserSesonger(rawData);

    const seasonSelect = document.getElementById('seasonSelect');
    let chart = null;

    function getSeasonData() {
      const season = seasonSelect ? seasonSelect.value : Object.keys(allData).sort().reverse()[0];
      return allData[season];
    }

    function populateDrivers(data) {
      sel1.innerHTML = '';
      sel2.innerHTML = '';
      data.forere.forEach((d, i) => {
        sel1.add(new Option(d.navn, i));
        sel2.add(new Option(d.navn, i));
      });
      sel2.selectedIndex = Math.min(1, data.forere.length - 1);
    }

    function update() {
      const data = getSeasonData();
      if (!data) return;

      const d1 = data.forere[parseInt(sel1.value)];
      const d2 = data.forere[parseInt(sel2.value)];
      if (!d1 || !d2) return;

      if (chart) chart.destroy();

      const gap = total(d1.poeng) - total(d2.poeng);
      const gapEl = document.getElementById('h2hGap');
      if (gapEl) {
        const leader = gap >= 0 ? d1.navn : d2.navn;
        gapEl.textContent = gap === 0
          ? 'Helt likt – ingen av dem har noe å skryte av ennå'
          : `${leader} leder med ${Math.abs(gap)} poeng`;
      }

      chart = new Chart(chartEl, {
        type: 'line',
        data: {
          labels: data.runder,
          datasets: [
            {
              label: d1.navn,
              data: d1.poeng,
              borderColor: '#b026ff',
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0,
              pointRadius: 3,
              pointHoverRadius: 6,
            },
            {
              label: d2.navn,
              data: d2.poeng,
              borderColor: '#00d47f',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [6, 4],
              tension: 0,
              pointRadius: 3,
              pointHoverRadius: 6,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: '#e9eff8',
                font: { ...CHART_FONT, size: 11, weight: '600' },
                boxWidth: 10,
                boxHeight: 10,
              }
            }
          },
          scales: {
            x: { ticks: { color: '#47536a', font: CHART_FONT }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#47536a', font: CHART_FONT }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
          }
        }
      });
    }

    function onSeasonChange() {
      const data = getSeasonData();
      if (data) populateDrivers(data);
      update();
    }

    if (seasonSelect) seasonSelect.addEventListener('change', onSeasonChange);
    sel1.addEventListener('change', update);
    sel2.addEventListener('change', update);

    const initial = getSeasonData();
    if (initial) populateDrivers(initial);
    update();
  });
}
