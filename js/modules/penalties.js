import { fetchData } from './api.js';
import Chart from 'chart.js/auto';

export function initPenalties() {
  const tbody = document.querySelector('#penaltyTable tbody');
  if (!tbody) return;

  fetchData('data/straff.json').then(data => {
    if (!data) {
      tbody.innerHTML = '<tr><td colspan="2">Kunne ikke laste straffedata.</td></tr>';
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

    // Bar chart
    const chartEl = document.getElementById('penaltyChart');
    if (chartEl) {
      new Chart(chartEl, {
        type: 'bar',
        data: {
          labels: sorted.map(([name]) => name),
          datasets: [{
            label: 'Penalty Points',
            data: sorted.map(([, g]) => g.total),
            backgroundColor: sorted.map(([name]) =>
              name === worstDriver ? 'rgba(153,0,0,0.9)' : 'rgba(153,0,0,0.4)'
            ),
            borderColor: '#990000',
            borderWidth: 1,
            borderRadius: 5,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#777', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
            y: { ticks: { color: '#ccc', font: { family: 'Barlow Condensed, sans-serif', size: 15, weight: 'bold' } }, grid: { color: 'rgba(255,255,255,0.04)' } }
          }
        }
      });
    }

    // Table with shame badge on worst offender
    let rowsHtml = '';
    sorted.forEach(([fører, g]) => {
      const isWorst   = fører === worstDriver;
      const shameBadge = isWorst
        ? `<span class="shame-badge">🚨 Skam</span>`
        : '';

      let eventsHtml = '';
      g.events.forEach(e => {
        eventsHtml += `<div><strong>${e.poeng}p</strong> – ${e.runde}: ${e.beskrivelse}</div>`;
      });

      rowsHtml += `
        <tr>
          <td>${fører} (${g.total}p) ${shameBadge}</td>
          <td>${eventsHtml}</td>
        </tr>
      `;
    });
    tbody.innerHTML = rowsHtml;
  });
}
