/**
 * data/resultater.json lagrer poeng PER LØP — ett tall per fører per løp.
 * Resten av appen (grafer, tabeller, modal, head-to-head) regner med løpende
 * totaler, så konverteringen skjer én gang her ved innlasting.
 *
 * Lag uten egen `poeng`-liste får poengene sine summert fra førerne i `forere`.
 * Lag som har en egen liste (2025-historikken) beholder den.
 */

function kumulativ(perLop) {
  let sum = 0;
  return perLop.map(p => (sum += p));
}

function forerneTil(sesong, lag) {
  return sesong.forere.filter(f => (lag.forere || []).includes(f.navn));
}

function lagPoengPerLop(sesong, lag) {
  if (lag.poeng) return lag.poeng;

  const medlemmer = forerneTil(sesong, lag);
  const antallLop = Math.max(0, ...medlemmer.map(f => f.poeng.length));

  return Array.from({ length: antallLop }, (_, i) =>
    medlemmer.reduce((sum, f) => sum + (f.poeng[i] || 0), 0)
  );
}

/**
 * Sesongtotal fra en kumulativ poengliste. Egen funksjon fordi en sesong som
 * ikke er startet har tom liste, og `poeng[poeng.length - 1]` da gir undefined.
 */
export function total(poeng) {
  return poeng.length ? poeng[poeng.length - 1] : 0;
}

/** Slår opp hvilket lag en fører kjører for i en gitt sesong. */
export function lagTilForer(sesong, forerNavn) {
  const forer = sesong.forere.find(f => f.navn === forerNavn);
  if (forer && forer.lag) return sesong.lag.find(l => l.navn === forer.lag) || null;
  return sesong.lag.find(l => (l.forere || []).includes(forerNavn)) || null;
}

/** Gjør om alle sesonger fra poeng-per-løp til løpende totaler. */
export function normaliserSesonger(allData) {
  const ut = {};

  Object.keys(allData).forEach(aar => {
    const sesong = allData[aar];
    if (!sesong || !sesong.forere || !sesong.lag) return;

    ut[aar] = {
      ...sesong,
      forere: sesong.forere.map(f => ({ ...f, poeng: kumulativ(f.poeng) })),
      lag: sesong.lag.map(l => ({ ...l, poeng: kumulativ(lagPoengPerLop(sesong, l)) })),
    };
  });

  return ut;
}
