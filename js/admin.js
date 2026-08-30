/**
 * F1 BOYZA – admin (race control)
 *
 * Egen bundle, ikke koblet til js/app.js. Skriver rett til Supabase; databasen
 * håndhever selv at bare innloggede admin-brukere får lov (RLS + admin_brukere),
 * så det ligger ingenting hemmelig i denne fila.
 */
import { db } from './modules/supabase.js';
import { parsePodium } from './modules/podium.js';
import '../css/style.css';

const $ = id => document.getElementById(id);

/** Alle tabellene, lastet på nytt etter hver lagring. */
let data = {};
let aar  = null;

/* ---------- små hjelpere ---------- */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const felt = (navn, verdi, type = 'text', ekstra = '') =>
  `<input class="admin-input" data-felt="${navn}" type="${type}" value="${esc(verdi)}" ${ekstra}>`;

/** Leser en rad tilbake til et objekt med feltene som ble tegnet. */
function lesRad(tr) {
  const ut = { ...tr.dataset };
  tr.querySelectorAll('[data-felt]').forEach(i => {
    ut[i.dataset.felt] = i.type === 'checkbox' ? i.checked : i.value;
  });
  return ut;
}

const tall = v => (v === '' || v === null || v === undefined ? null : Number(v));

function melding(tekst, feil = false) {
  const el = $('adminMelding');
  if (!el) return;
  el.textContent = tekst;
  el.className = `admin-melding ${feil ? 'feil' : 'ok'}`;
  if (!feil) setTimeout(() => { if (el.textContent === tekst) el.textContent = ''; }, 4000);
}

/** Kjører skriveoperasjonene i rekkefølge, laster inn på nytt og melder fra. */
async function lagre(tekst, ...operasjoner) {
  try {
    for (const op of operasjoner) {
      const { error } = await op;
      if (error) throw error;
    }
    await lastAlt();
    tegn();
    melding(`${tekst} lagret.`);
  } catch (e) {
    melding(`Fikk ikke lagret: ${e.message || e}`, true);
  }
}

/* ---------- innlasting ---------- */

async function lastAlt() {
  const hent = (tabell, ...sortering) => {
    let q = db.from(tabell).select('*');
    sortering.forEach(k => { q = q.order(k); });
    return q;
  };

  const svar = await Promise.all([
    hent('sesonger', 'aar'),
    hent('spillere', 'rekkefolge'),
    hent('lag', 'aar', 'rekkefolge'),
    hent('sesong_forere', 'aar', 'rekkefolge'),
    hent('lop', 'aar', 'rekkefolge'),
    hent('runder', 'aar', 'runde'),
    hent('resultater', 'aar', 'runde'),
    hent('straffer', 'id'),
  ]);

  const feil = svar.find(s => s.error);
  if (feil) throw feil.error;

  const [sesonger, spillere, lag, forere, lop, runder, resultater, straffer] = svar.map(s => s.data);
  data = { sesonger, spillere, lag, forere, lop, runder, resultater, straffer };

  if (!aar || !sesonger.some(s => s.aar === aar)) {
    aar = sesonger.length ? sesonger[sesonger.length - 1].aar : null;
  }
}

/* ---------- seksjoner ---------- */

function panel(tittel, meta, innhold) {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>${tittel}</h2>
        <span class="panel-meta">${meta}</span>
      </div>
      ${innhold}
    </section>`;
}

function velgSpiller(navn, valgt) {
  return `<select class="admin-input" data-felt="${navn}">
    <option value=""></option>
    ${data.spillere.map(s =>
      `<option value="${esc(s.navn)}" ${s.navn === valgt ? 'selected' : ''}>${esc(s.navn)}</option>`).join('')}
  </select>`;
}

function seksjonResultater() {
  const sesong = data.sesonger.find(s => s.aar === aar);
  if (!sesong) return '';

  const forere = data.forere.filter(f => f.aar === aar);
  const poeng = (runde, spiller) => {
    const rad = data.resultater.find(r => r.aar === aar && r.runde === runde && r.spiller === spiller);
    return rad ? rad.poeng : '';
  };

  const rader = Array.from({ length: sesong.antall_runder }, (_, i) => {
    const runde = i + 1;
    return `
      <tr data-runde="${runde}">
        <td class="code-cell">R${runde}</td>
        ${forere.map(f => `<td>${felt(f.spiller, poeng(runde, f.spiller), 'number')}</td>`).join('')}
      </tr>`;
  }).join('');

  return panel('Resultater', `${aar} · poeng per løp`, `
    <div class="table-wrap">
      <table class="standings-table admin-table" id="tabellResultater">
        <thead><tr><th>Runde</th>${forere.map(f => `<th>${esc(f.spiller)}</th>`).join('')}</tr></thead>
        <tbody>${rader}</tbody>
      </table>
    </div>
    <div class="admin-verktoy">
      <button class="admin-btn primary" data-handling="lagreResultater">Lagre resultater</button>
      <span class="admin-hjelp">En runde uten tall i det hele tatt regnes som ikke kjørt.</span>
    </div>`);
}

const SPRINT = /\s*\[Sprint\]\s*/i;

/**
 * Navn som kan velges på podiet: spillerne, pluss alle som allerede står i en
 * podium-tekst. Uten det siste ville et valg som «Racevinner: Verstappen»
 * forsvunnet i det man lagret raden på nytt.
 */
function podiumNavn() {
  const navn = new Set(data.spillere.map(s => s.navn));

  data.lop.forEach(l => {
    const p = parsePodium(l.podium);
    [p.pole, p.sprintpole, p.vinner, p.sprint].forEach(n => { if (n) navn.add(n); });
  });

  return [...navn].sort((a, b) => a.localeCompare(b, 'no'));
}

function seksjonLop() {
  const lop = data.lop.filter(l => l.aar === aar);
  const neste = lop.length ? Math.max(...lop.map(l => l.rekkefolge)) + 1 : 1;
  const navn = podiumNavn();

  const velg = (feltnavn, valgt, merke, klasse = '') => `
    <label class="podium-felt ${klasse}">
      <span>${merke}</span>
      <select class="admin-input" data-felt="${feltnavn}">
        <option value="">—</option>
        ${navn.map(n => `<option value="${esc(n)}" ${n === valgt ? 'selected' : ''}>${esc(n)}</option>`).join('')}
      </select>
    </label>`;

  const rad = l => {
    const p = parsePodium(l.podium);
    const erSprint = SPRINT.test(l.navn || '');

    return `
      <tr data-rekkefolge="${l.rekkefolge}" class="${erSprint ? 'er-sprint' : ''}">
        <td class="code-cell">${l.rekkefolge}</td>
        <td>${felt('navn', (l.navn || '').replace(SPRINT, ''))}</td>
        <td style="text-align:center">
          <input type="checkbox" data-felt="sprinthelg" ${erSprint ? 'checked' : ''}>
        </td>
        <td style="text-align:center">
          <input type="checkbox" data-felt="kjort" ${l.kjort ? 'checked' : ''}>
        </td>
        <td>
          <div class="podium-rutenett">
            ${velg('pole', p.pole, 'Pole')}
            ${velg('racevinner', p.vinner, 'Vinner')}
            ${velg('sprintpole', p.sprintpole, 'Sprintpole', 'kun-sprint')}
            ${velg('sprintvinner', p.sprint, 'Sprintvinner', 'kun-sprint')}
            <label class="podium-felt">
              <span>Slam dunk</span>
              <input type="checkbox" data-felt="slamdunk" ${p.slamDunk ? 'checked' : ''}>
            </label>
          </div>
        </td>
        <td>${l.navn ? `<button class="admin-btn fare" data-handling="slettLop" data-rekkefolge="${l.rekkefolge}">Slett</button>` : ''}</td>
      </tr>`;
  };

  return panel('Løp og podium', `${aar} · banene i rekkefølge`, `
    <div class="table-wrap">
      <table class="standings-table admin-table" id="tabellLop">
        <thead><tr><th>#</th><th>Bane</th><th>Sprint</th><th>Kjørt</th><th>Podium</th><th></th></tr></thead>
        <tbody>${lop.map(rad).join('')}${rad({ rekkefolge: neste, navn: '', kjort: false, podium: '' })}</tbody>
      </table>
    </div>
    <div class="admin-verktoy">
      <button class="admin-btn primary" data-handling="lagreLop">Lagre løp</button>
      <span class="admin-hjelp">«Sprint» setter [Sprint] i banenavnet og åpner sprintfeltene. «Slam dunk» overstyrer resten og skriver «X Slam Dunk» — bruk den bare når vinneren tok polen også.</span>
    </div>`);
}

function seksjonStraffer() {
  const rad = s => `
    <tr data-id="${s.id ?? ''}">
      <td>${velgSpiller('spiller', s.spiller)}</td>
      <td>${felt('runde', s.runde ?? '', 'number', 'min="1"')}</td>
      <td>${felt('poeng', s.poeng ?? '', 'number')}</td>
      <td>${felt('beskrivelse', s.beskrivelse ?? '')}</td>
      <td>${s.id ? `<button class="admin-btn fare" data-handling="slettStraff" data-id="${s.id}">Slett</button>` : ''}</td>
    </tr>`;

  return panel('Straffepoeng', 'rullerende vindu, uten sesong', `
    <div class="table-wrap">
      <table class="standings-table admin-table" id="tabellStraffer">
        <thead><tr><th>Fører</th><th>Runde</th><th>Poeng</th><th>Beskrivelse</th><th></th></tr></thead>
        <tbody>${data.straffer.map(rad).join('')}${rad({})}</tbody>
      </table>
    </div>
    <div class="admin-verktoy">
      <button class="admin-btn primary" data-handling="lagreStraffer">Lagre straffer</button>
      <span class="admin-hjelp">Nederste rad er tom — fyll den ut for å legge til en ny.</span>
    </div>`);
}

function seksjonDatoer() {
  const runder = data.runder.filter(r => r.aar === aar);
  const neste = runder.length ? Math.max(...runder.map(r => r.runde)) + 1 : 1;

  const rad = r => `
    <tr data-runde="${r.runde}">
      <td class="code-cell">R${r.runde}</td>
      <td>${felt('dato', r.dato ?? '', 'date')}</td>
      <td>${r.finnes ? `<button class="admin-btn fare" data-handling="slettRunde" data-runde="${r.runde}">Slett</button>` : ''}</td>
    </tr>`;

  return panel('Datoer', `${aar} · brukes av nedtellingen`, `
    <div class="table-wrap">
      <table class="standings-table admin-table" id="tabellDatoer">
        <thead><tr><th>Runde</th><th>Dato</th><th></th></tr></thead>
        <tbody>${runder.map(r => rad({ ...r, finnes: true })).join('')}${rad({ runde: neste, dato: '' })}</tbody>
      </table>
    </div>
    <div class="admin-verktoy">
      <button class="admin-btn primary" data-handling="lagreDatoer">Lagre datoer</button>
      <span class="admin-hjelp">Runder uten dato vises som «Dato ikke satt».</span>
    </div>`);
}

function seksjonLag() {
  const lag = data.lag.filter(l => l.aar === aar);
  const forere = data.forere.filter(f => f.aar === aar);

  const lagRad = l => `
    <tr data-id="${l.id ?? ''}">
      <td>${felt('navn', l.navn ?? '')}</td>
      <td>${felt('farge', l.farge ?? '#888888', 'color')}</td>
      <td>${l.id ? `<button class="admin-btn fare" data-handling="slettLag" data-id="${l.id}">Slett</button>` : ''}</td>
    </tr>`;

  const lagValg = valgt => `
    <select class="admin-input" data-felt="lag_id">
      <option value="">(uten lag)</option>
      ${lag.map(l => `<option value="${l.id}" ${l.id === valgt ? 'selected' : ''}>${esc(l.navn)}</option>`).join('')}
    </select>`;

  const forerRad = f => `
    <tr>
      <td>${f.spiller
        ? `<span class="name-cell">${esc(f.spiller)}</span><input type="hidden" data-felt="spiller" value="${esc(f.spiller)}">`
        : velgSpiller('spiller', '')}</td>
      <td>${lagValg(f.lag_id)}</td>
      <td>${f.spiller ? `<button class="admin-btn fare" data-handling="slettForer" data-spiller="${esc(f.spiller)}">Fjern</button>` : ''}</td>
    </tr>`;

  return panel('Lag og førere', `${aar}`, `
    <div class="admin-todelt">
      <div>
        <h3 class="admin-underhead">Lag</h3>
        <table class="standings-table admin-table" id="tabellLag">
          <thead><tr><th>Navn</th><th>Farge</th><th></th></tr></thead>
          <tbody>${lag.map(lagRad).join('')}${lagRad({})}</tbody>
        </table>
        <button class="admin-btn primary" data-handling="lagreLag">Lagre lag</button>
      </div>
      <div>
        <h3 class="admin-underhead">Førere denne sesongen</h3>
        <table class="standings-table admin-table" id="tabellForere">
          <thead><tr><th>Spiller</th><th>Lag</th><th></th></tr></thead>
          <tbody>${forere.map(forerRad).join('')}${forerRad({})}</tbody>
        </table>
        <button class="admin-btn primary" data-handling="lagreForere">Lagre førere</button>
      </div>
    </div>
    <div class="admin-verktoy">
      <span class="admin-hjelp">Et lag uten egne poengrader summeres fra førerne sine. Lag må lagres før de kan velges her.</span>
    </div>`);
}

function seksjonSpillere() {
  const rad = s => `
    <tr data-navnfor="${esc(s.navn ?? '')}">
      <td>${felt('navn', s.navn ?? '')}</td>
      <td>${felt('kode', s.kode ?? '', 'text', 'maxlength="3"')}</td>
      <td>${felt('farge', s.farge ?? '#888888', 'color')}</td>
      <td style="text-align:center">
        <input type="checkbox" data-felt="bot" ${s.bot ? 'checked' : ''}>
      </td>
    </tr>`;

  return panel('Spillere', 'gjelder alle sesonger', `
    <div class="table-wrap">
      <table class="standings-table admin-table" id="tabellSpillere">
        <thead><tr><th>Navn</th><th>Kode</th><th>Farge</th><th>Bot</th></tr></thead>
        <tbody>${data.spillere.map(rad).join('')}${rad({})}</tbody>
      </table>
    </div>
    <div class="admin-verktoy">
      <button class="admin-btn primary" data-handling="lagreSpillere">Lagre spillere</button>
      <span class="admin-hjelp">Endrer du et navn, følger resultater og straffer med. «Bot» skjuler føreren når resultatsiden står på «Bare mennesker».</span>
    </div>`);
}

function seksjonSesong() {
  const sesong = data.sesonger.find(s => s.aar === aar);

  return panel('Sesong', 'antall runder og ny sesong', `
    <div class="panel-body admin-verktoy">
      <label class="admin-hjelp" for="antallRunder">Runder i ${aar}</label>
      <input class="admin-input" id="antallRunder" type="number" min="1" max="40"
             value="${sesong ? sesong.antall_runder : 24}">
      <button class="admin-btn" data-handling="lagreSesong">Lagre</button>
      <span class="admin-skille"></span>
      <label class="admin-hjelp" for="nyttAar">Ny sesong</label>
      <input class="admin-input" id="nyttAar" type="number" min="2000" max="2100" placeholder="2027">
      <button class="admin-btn" data-handling="nySesong">Opprett</button>
    </div>`);
}

/* ---------- tegning ---------- */

function tegn() {
  $('adminInnhold').innerHTML = `
    <div class="admin-topp">
      <select class="season-select" id="velgAar">
        ${data.sesonger.map(s =>
          `<option value="${s.aar}" ${s.aar === aar ? 'selected' : ''}>${s.aar}</option>`).join('')}
      </select>
      <p class="admin-melding" id="adminMelding"></p>
      <button class="admin-btn" data-handling="loggUt">Logg ut</button>
    </div>
    ${seksjonResultater()}
    ${seksjonLop()}
    ${seksjonStraffer()}
    ${seksjonDatoer()}
    ${seksjonLag()}
    ${seksjonSpillere()}
    ${seksjonSesong()}`;

  $('velgAar').addEventListener('change', e => { aar = Number(e.target.value); tegn(); });
}

/* ---------- lagring per seksjon ---------- */

const ingenting = Promise.resolve({ error: null });

/**
 * Setter sammen podium-teksten slik podium.js leser den. Rekkefølgen på feltene
 * følger 2025-dataene, og sprintfeltene tas bare med på sprinthelger.
 */
function byggPodium(r) {
  if (r.slamdunk && r.racevinner) return `${r.racevinner} Slam Dunk`;

  const deler = [];
  if (r.sprinthelg && r.sprintpole)   deler.push(`Sprintpole: ${r.sprintpole}`);
  if (r.sprinthelg && r.sprintvinner) deler.push(`Sprintvinner: ${r.sprintvinner}`);
  if (r.pole)       deler.push(`Pole: ${r.pole}`);
  if (r.racevinner) deler.push(`Racevinner: ${r.racevinner}`);

  return deler.join(', ');
}

const handlinger = {
  async lagreResultater() {
    const nye = [];
    const tomme = [];

    document.querySelectorAll('#tabellResultater tbody tr').forEach(tr => {
      const runde = Number(tr.dataset.runde);
      const inputs = [...tr.querySelectorAll('[data-felt]')];
      // Helt tom rad betyr at runden ikke er kjørt, og skal ikke ligge i basen.
      if (inputs.every(i => i.value === '')) { tomme.push(runde); return; }
      inputs.forEach(i => nye.push({
        aar, runde, spiller: i.dataset.felt, poeng: Number(i.value || 0),
      }));
    });

    await lagre('Resultater',
      tomme.length ? db.from('resultater').delete().eq('aar', aar).in('runde', tomme) : ingenting,
      nye.length ? db.from('resultater').upsert(nye) : ingenting);
  },

  async lagreLop() {
    const rader = [...document.querySelectorAll('#tabellLop tbody tr')].map(lesRad)
      .filter(r => r.navn.trim())
      .map(r => ({
        aar,
        rekkefolge: Number(r.rekkefolge),
        navn: r.navn.trim().replace(SPRINT, '') + (r.sprinthelg ? ' [Sprint]' : ''),
        kjort: r.kjort,
        podium: byggPodium(r),
      }));

    await lagre('Løp', rader.length ? db.from('lop').upsert(rader) : ingenting);
  },

  async slettLop(knapp) {
    await lagre('Løp slettet', db.from('lop').delete()
      .eq('aar', aar).eq('rekkefolge', Number(knapp.dataset.rekkefolge)));
  },

  async lagreStraffer() {
    const rader = [...document.querySelectorAll('#tabellStraffer tbody tr')].map(lesRad)
      .filter(r => r.spiller && r.runde !== '' && r.poeng !== '');

    const verdier = r => ({
      spiller: r.spiller,
      runde: Number(r.runde),
      poeng: Number(r.poeng),
      beskrivelse: r.beskrivelse,
    });

    const gamle = rader.filter(r => r.id).map(r => ({ id: Number(r.id), ...verdier(r) }));
    const nye = rader.filter(r => !r.id).map(verdier);

    await lagre('Straffer',
      gamle.length ? db.from('straffer').upsert(gamle) : ingenting,
      nye.length ? db.from('straffer').insert(nye) : ingenting);
  },

  async slettStraff(knapp) {
    await lagre('Straff slettet', db.from('straffer').delete().eq('id', Number(knapp.dataset.id)));
  },

  async lagreDatoer() {
    const rader = [...document.querySelectorAll('#tabellDatoer tbody tr')].map(lesRad)
      .map(r => ({ aar, runde: Number(r.runde), dato: r.dato || null }));

    // Den nederste raden er ny; ta den bare med hvis en dato faktisk er satt.
    const siste = rader[rader.length - 1];
    const finnes = siste && data.runder.some(r => r.aar === aar && r.runde === siste.runde);
    if (siste && !siste.dato && !finnes) rader.pop();

    await lagre('Datoer', rader.length ? db.from('runder').upsert(rader) : ingenting);
  },

  async slettRunde(knapp) {
    await lagre('Runde slettet', db.from('runder').delete()
      .eq('aar', aar).eq('runde', Number(knapp.dataset.runde)));
  },

  async lagreLag() {
    const rader = [...document.querySelectorAll('#tabellLag tbody tr')].map(lesRad)
      .filter(r => r.navn.trim());

    const gamle = rader.filter(r => r.id)
      .map(r => ({ id: Number(r.id), aar, navn: r.navn.trim(), farge: r.farge }));
    const antall = data.lag.filter(l => l.aar === aar).length;
    const nye = rader.filter(r => !r.id)
      .map((r, i) => ({ aar, navn: r.navn.trim(), farge: r.farge, rekkefolge: antall + i }));

    await lagre('Lag',
      gamle.length ? db.from('lag').upsert(gamle) : ingenting,
      nye.length ? db.from('lag').insert(nye) : ingenting);
  },

  async slettLag(knapp) {
    await lagre('Lag slettet', db.from('lag').delete().eq('id', Number(knapp.dataset.id)));
  },

  async lagreForere() {
    const rader = [...document.querySelectorAll('#tabellForere tbody tr')].map(lesRad)
      .filter(r => r.spiller)
      .map((r, i) => ({ aar, spiller: r.spiller, lag_id: tall(r.lag_id), rekkefolge: i }));

    await lagre('Førere', rader.length ? db.from('sesong_forere').upsert(rader) : ingenting);
  },

  async slettForer(knapp) {
    await lagre('Fører fjernet', db.from('sesong_forere').delete()
      .eq('aar', aar).eq('spiller', knapp.dataset.spiller));
  },

  async lagreSpillere() {
    const rader = [...document.querySelectorAll('#tabellSpillere tbody tr')].map(lesRad)
      .filter(r => r.navn.trim());

    // navn er primærnøkkel, så et endret navn må oppdateres — ikke settes inn på nytt.
    // Rekkefølgen følger radene i tabellen, også når en av dem er døpt om.
    const omdopt = rader.filter(r => r.navnfor && r.navnfor !== r.navn.trim());
    const resten = rader
      .map((r, i) => ({ navn: r.navn.trim(), kode: r.kode, farge: r.farge, bot: r.bot, rekkefolge: i }))
      .filter((_, i) => !omdopt.includes(rader[i]));

    await lagre('Spillere',
      ...omdopt.map(r => db.from('spillere')
        .update({ navn: r.navn.trim(), kode: r.kode, farge: r.farge, bot: r.bot })
        .eq('navn', r.navnfor)),
      resten.length ? db.from('spillere').upsert(resten) : ingenting);
  },

  async lagreSesong() {
    await lagre('Sesong', db.from('sesonger')
      .update({ antall_runder: Number($('antallRunder').value) }).eq('aar', aar));
  },

  async nySesong() {
    const nytt = Number($('nyttAar').value);
    if (!nytt) { melding('Skriv inn et årstall.', true); return; }
    aar = nytt;
    await lagre('Sesong', db.from('sesonger').insert({ aar: nytt, antall_runder: 24 }));
  },

  async loggUt() {
    await db.auth.signOut();
    location.reload();
  },
};

/* ---------- oppstart ---------- */

document.addEventListener('DOMContentLoaded', () => {
  const loginPanel = $('loginPanel');
  const innhold    = $('adminInnhold');

  document.addEventListener('click', e => {
    const knapp = e.target.closest('[data-handling]');
    if (!knapp) return;
    e.preventDefault();
    handlinger[knapp.dataset.handling](knapp);
  });

  // Sprintfeltene vises med en gang haken settes, uten å måtte lagre først.
  document.addEventListener('change', e => {
    if (e.target.dataset.felt !== 'sprinthelg') return;
    e.target.closest('tr').classList.toggle('er-sprint', e.target.checked);
  });

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const { error } = await db.auth.signInWithPassword({
      email: $('loginEpost').value,
      password: $('loginPassord').value,
    });
    if (error) $('loginMelding').textContent = `Kom ikke inn: ${error.message}`;
    else vis();
  });

  async function vis() {
    const { data: { session } } = await db.auth.getSession();

    if (!session) {
      loginPanel.hidden = false;
      innhold.hidden = true;
      return;
    }

    loginPanel.hidden = true;
    innhold.hidden = false;

    try {
      await lastAlt();
      tegn();
    } catch (e) {
      innhold.innerHTML = `<section class="panel"><div class="panel-body">
        <p class="admin-melding feil">Fikk ikke lastet dataene: ${esc(e.message || e)}</p></div></section>`;
    }
  }

  vis();
});
