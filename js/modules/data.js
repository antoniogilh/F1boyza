/**
 * Datalaget mot Supabase.
 *
 * Funksjonene her gir nøyaktig samme objektform som JSON-filene under data/
 * hadde, slik at visningsmodulene slipper å vite at dataene nå kommer fra en
 * database. Svarer ikke databasen, faller vi tilbake på filene — de er frosne
 * øyeblikksbilder, men bedre enn en tom side.
 *
 * Skriving skjer kun fra admin-siden, se js/admin.js.
 */
import { db } from './supabase.js';
import { fetchData } from './api.js';

const cache = new Map();

function hent(navn, bygg, reservefil) {
  if (!cache.has(navn)) {
    cache.set(navn, bygg().catch(feil => {
      console.warn(`Fikk ikke ${navn} fra databasen — bruker reserven i ${reservefil}.`, feil);
      return fetchData(reservefil);
    }));
  }
  return cache.get(navn);
}

/** Kaster ved feil, slik at hent() kan slå over på reserven. */
async function velg(tabell, kolonner, ...sortering) {
  let q = db.from(tabell).select(kolonner);
  sortering.forEach(kol => { q = q.order(kol); });

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

/** Grupperer rader på år og gir et objekt med årstall som nøkler, som i JSON-filene. */
function perAar(rader, form) {
  const ut = {};
  rader.forEach(rad => {
    const aar = String(rad.aar);
    (ut[aar] = ut[aar] || []).push(form(rad));
  });
  return ut;
}

/** { "2025": [{ navn, podium, kjort }] } */
export function hentKalender() {
  return hent('kalenderen', async () => perAar(
    await velg('lop', 'aar, navn, podium, kjort', 'aar', 'rekkefolge'),
    ({ navn, podium, kjort }) => ({ navn, podium, kjort })
  ), 'data/kalender.json');
}

/** { "2025": [{ runde: "R1", dato }] } */
export function hentDatoer() {
  return hent('datoene', async () => perAar(
    await velg('runder', 'aar, runde, dato', 'aar', 'runde'),
    ({ runde, dato }) => ({ runde: `R${runde}`, dato })
  ), 'data/datoer.json');
}

/** { penaltyPoints: [{ fører, poeng, runde, beskrivelse }] } */
export function hentStraff() {
  return hent('straffene', async () => ({
    penaltyPoints: (await velg('straffer', 'id, spiller, runde, poeng, beskrivelse', 'id'))
      .map(s => ({
        'fører': s.spiller,
        poeng: s.poeng,
        runde: `R${s.runde}`,
        beskrivelse: s.beskrivelse,
      })),
  }), 'data/straff.json');
}

/**
 * { "2025": { runder, lag, forere } } med poeng PER LØP, slik season.js venter.
 *
 * Et lag med egne poengrader beholder dem; ellers får det med seg førerne sine
 * og summeres av season.js. Det speiler forskjellen mellom 2025 og 2026.
 */
export function hentResultater() {
  return hent('resultatene', async () => {
    const [sesonger, lagRader, forerRader, poengRader, lagPoengRader, spillere] = await Promise.all([
      velg('sesonger', 'aar, antall_runder', 'aar'),
      velg('lag', 'id, aar, navn, farge', 'aar', 'rekkefolge'),
      velg('sesong_forere', 'aar, spiller, lag_id', 'aar', 'rekkefolge'),
      velg('resultater', 'aar, runde, spiller, poeng', 'aar', 'runde'),
      velg('lag_poeng', 'lag_id, runde, poeng', 'runde'),
      velg('spillere', 'navn, bot', 'navn'),
    ]);

    const erBot = new Set(spillere.filter(s => s.bot).map(s => s.navn));

    const ut = {};

    sesonger.forEach(({ aar, antall_runder: antallRunder }) => {
      const lag        = lagRader.filter(l => l.aar === aar);
      const forere     = forerRader.filter(f => f.aar === aar);
      const poeng      = poengRader.filter(p => p.aar === aar);
      const antallLop  = Math.max(0, ...poeng.map(p => p.runde));
      const lagNavn    = new Map(lag.map(l => [l.id, l.navn]));

      // Runder uten registrerte poeng blir 0, slik at alle listene er like lange.
      const poengFor = filter => {
        const rader = poeng.filter(filter);
        return Array.from({ length: antallLop }, (_, i) =>
          (rader.find(r => r.runde === i + 1) || {}).poeng || 0);
      };

      ut[String(aar)] = {
        runder: Array.from({ length: antallRunder }, (_, i) => `R${i + 1}`),

        lag: lag.map(l => {
          const egne = lagPoengRader.filter(p => p.lag_id === l.id);
          const felles = { navn: l.navn, farge: l.farge };

          return egne.length
            ? { ...felles, poeng: egne.map(p => p.poeng) }
            : { ...felles, forere: forere.filter(f => f.lag_id === l.id).map(f => f.spiller) };
        }),

        // bot skiller AI-førerne fra menneskene, brukt av filteret på resultatsiden.
        forere: forere.map(f => {
          const rad = { navn: f.spiller };
          if (f.lag_id) rad.lag = lagNavn.get(f.lag_id);
          rad.poeng = poengFor(p => p.spiller === f.spiller);
          rad.bot = erBot.has(f.spiller);
          return rad;
        }),
      };
    });

    return ut;
  }, 'data/resultater.json');
}
