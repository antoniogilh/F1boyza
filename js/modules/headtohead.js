import { fetchData } from './api.js';
import Chart from 'chart.js/auto';

export function initHeadToHead() {
  const sel1   = document.getElementById('h2hDriver1');
  const sel2   = document.getElementById('h2hDriver2');
  const chartEl = document.getElementById('h2hChart');
  if (!sel1 || !sel2 || !chartEl) return;

  fetchData('data/resultater.json').then(data => {
    if (!data) return;

    const drivers = data.forere;

    drivers.forEach((d, i) => {
      sel1.add(new Option(d.navn, i));
      sel2.add(new Option(d.navn, i));
    });
    sel2.selectedIndex = 1;

    let chart = null;

    function update() {
      const d1 = drivers[parseInt(sel1.value)];
      const d2 = drivers[parseInt(sel2.value)];

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

    sel1.addEventListener('change', update);
    sel2.addEventListener('change', update);
    update();
  });
}
