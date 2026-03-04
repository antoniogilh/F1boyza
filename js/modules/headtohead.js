import { fetchData } from './api.js';
import Chart from 'chart.js/auto';

export function initHeadToHead() {
  const sel1    = document.getElementById('h2hDriver1');
  const sel2    = document.getElementById('h2hDriver2');
  const chartEl = document.getElementById('h2hChart');
  if (!sel1 || !sel2 || !chartEl) return;

  fetchData('data/resultater.json').then(allData => {
    if (!allData) return;

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

      const gap = d1.poeng[d1.poeng.length - 1] - d2.poeng[d2.poeng.length - 1];
      const gapEl = document.getElementById('h2hGap');
      if (gapEl) {
        const leader = gap >= 0 ? d1.navn : d2.navn;
        gapEl.textContent = `${leader} leder med ${Math.abs(gap)} poeng`;
      }

      chart = new Chart(chartEl, {
        type: 'line',
        data: {
          labels: data.runder,
          datasets: [
            {
              label: d1.navn,
              data: d1.poeng,
              borderColor: '#990000',
              backgroundColor: 'transparent',
              borderWidth: 3,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: d2.navn,
              data: d2.poeng,
              borderColor: '#FFD700',
              backgroundColor: 'transparent',
              borderWidth: 3,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: '#ccc',
                font: { family: 'Barlow Condensed, sans-serif', size: 14, weight: 'bold' },
              }
            }
          },
          scales: {
            x: { ticks: { color: '#777' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#777' }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
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
