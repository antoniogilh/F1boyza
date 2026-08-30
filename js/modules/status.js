import { hentDatoer } from './data.js';

function startenAvDagen(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Statuslinja øverst på hver side – sesong, hvilken runde vi står foran,
 * og flaggstatus. Leser datoer.json, samme kilde som nedtellingen.
 */
export function initStatusBar() {
  const seasonEl = document.getElementById('statusSeason');
  const roundEl  = document.getElementById('statusRound');
  const flagEl   = document.getElementById('statusFlag');
  if (!seasonEl || !roundEl || !flagEl) return;

  function setFlag(tekst, klasse) {
    flagEl.textContent = tekst;
    flagEl.className = `status-flag${klasse ? ' ' + klasse : ''}`;
  }

  hentDatoer().then(data => {
    if (!data) {
      setFlag('Ingen data', 'idle');
      return;
    }

    const season = Object.keys(data).sort().pop();
    const runder = data[season] || [];
    seasonEl.textContent = season;

    if (!runder.length) {
      roundEl.textContent = '—';
      setFlag('Ingen løp satt opp', 'idle');
      return;
    }

    // Dag-oppløsning: et løp som går i dag er ikke passert.
    const idag    = startenAvDagen(new Date());
    const nesteIx = runder.findIndex(r => r.dato && startenAvDagen(new Date(r.dato)) >= idag);

    if (nesteIx === -1) {
      roundEl.textContent = `${runder.length} av ${runder.length}`;
      setFlag('Sesongen er ferdig', 'idle');
      return;
    }

    roundEl.textContent = `${nesteIx + 1} av ${runder.length}`;

    // Løpshelg = neste løp er i dag. Da skifter linja til gult.
    const neste = startenAvDagen(new Date(runder[nesteIx].dato));

    if (neste.getTime() === idag.getTime()) {
      document.body.classList.add('race-weekend');
      setFlag('Løpshelg', 'caution');
    } else {
      setFlag('Grønt flagg', '');
    }
  });
}
