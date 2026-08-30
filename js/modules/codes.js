/**
 * Tre-bokstavs koder, slik timing-grafikken på TV bruker dem.
 * Navnene våre er fornavn, så kodene er satt manuelt der forkortingen
 * ellers hadde blitt stygg eller kollidert.
 */
const KODER = {
  Shaya:   'SHA',
  Philip:  'PHI',
  Antonio: 'ANT',
  Oddi:    'ODD',
  Dave:    'DAV',
  William: 'WIL',
  Kevin:   'KEV',

  Ferrari:    'FER',
  McLaren:    'MCL',
  'Red Bull': 'RBR',
  Mercedes:   'MER',
};

export function kode(navn) {
  if (!navn) return '???';
  if (KODER[navn]) return KODER[navn];
  return navn.replace(/[^a-zA-ZæøåÆØÅ]/g, '').slice(0, 3).toUpperCase();
}
