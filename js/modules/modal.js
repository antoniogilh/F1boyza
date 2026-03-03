let modalEl = null;

function createModal() {
  if (document.getElementById('driverModal')) {
    modalEl = document.getElementById('driverModal');
    return;
  }
  modalEl = document.createElement('div');
  modalEl.id = 'driverModal';
  modalEl.className = 'modal-overlay';
  modalEl.innerHTML = `
    <div class="modal-card">
      <button class="modal-close" id="modalClose">✕</button>
      <div id="modalContent"></div>
    </div>
  `;
  document.body.appendChild(modalEl);
  modalEl.addEventListener('click', e => { if (e.target === modalEl) closeModal(); });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function closeModal() {
  if (modalEl) modalEl.classList.remove('open');
}

export function showDriverModal(driver, allDrivers, kalenderData, rounds) {
  createModal();

  const wins = {}, poles = {};
  Object.values(kalenderData).forEach(season => {
    season.forEach(race => {
      if (!race.kjort || !race.podium) return;
      const w = race.podium.match(/Racevinner:\s*([\w]+)/i);
      const p = race.podium.match(/Pole:\s*([\w]+)/i);
      if (w) wins[w[1]] = (wins[w[1]] || 0) + 1;
      if (p) poles[p[1]] = (poles[p[1]] || 0) + 1;
    });
  });

  const sorted = [...allDrivers].sort((a, b) =>
    b.poeng[b.poeng.length - 1] - a.poeng[a.poeng.length - 1]
  );
  const pos   = sorted.findIndex(d => d.navn === driver.navn) + 1;
  const total = driver.poeng[driver.poeng.length - 1];

  let bestRound  = { points: -Infinity, round: '—' };
  let worstRound = { points: Infinity,  round: '—' };
  driver.poeng.forEach((val, i) => {
    const delta = i === 0 ? val : val - driver.poeng[i - 1];
    if (delta > bestRound.points)  bestRound  = { points: delta, round: rounds[i] || `R${i + 1}` };
    if (delta < worstRound.points) worstRound = { points: delta, round: rounds[i] || `R${i + 1}` };
  });

  const medals     = ['🥇', '🥈', '🥉'];
  const posDisplay = pos <= 3 ? medals[pos - 1] : `P${pos}`;
  const driverWins  = wins[driver.navn]  || 0;
  const driverPoles = poles[driver.navn] || 0;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-driver-header">
      <span class="modal-pos">${posDisplay}</span>
      <h2 class="modal-driver-name">${driver.navn}</h2>
    </div>
    <div class="modal-stats-grid">
      <div class="modal-stat">
        <span class="modal-stat-val">${total}</span>
        <span class="modal-stat-label">Totalt</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-val">${driverWins}</span>
        <span class="modal-stat-label">Seire</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-val">${driverPoles}</span>
        <span class="modal-stat-label">Poles</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-val">+${bestRound.points}p</span>
        <span class="modal-stat-label">Beste runde (${bestRound.round})</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-val">+${worstRound.points}p</span>
        <span class="modal-stat-label">Svakeste runde (${worstRound.round})</span>
      </div>
    </div>
  `;

  modalEl.classList.add('open');
}
