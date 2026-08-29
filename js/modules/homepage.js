import { fetchData } from './api.js';
import { kode } from './codes.js';
import { lagTilForer } from './season.js';

const TRASH_TALK = {
  Dave: [
    "Dave er ikke dårlig. Han er... særegen.",
    "Dave sin strategi er å tape sakte, og den fungerer overraskende bra.",
    "Dave er teknisk sett med i konkurransen. Teknisk sett.",
    "Dave har like mange raceseire som en parkert bil.",
    "Dave er så langt bak at han tror han kjører kvalifisering.",
    "Dave sin poengkurve er en flat linje. Det er ikke bra i F1.",
    "Dave er optimist. Det hjelper ikke, men det er en fin egenskap.",
    "Dave er inspirert av Fernando Alonso. Dessverre 2023-versjonen.",
    "Dave sitt bidrag til laget er best beskrevet som 'tilstedeværelse'.",
    "Dave spiller fantasy F1 som om det er et avslappings-spill.",
    "Dave sine tall er konfidensielle. Av skamhensyn.",
    "Dave sine prognoser er alltid optimistiske. Virkeligheten er aldri det.",
    "Dave er konstant i én ting: å skuffe konsekvent.",
    "Noen er født til å vinne. Dave er født til å heie på de som vinner.",
    "Dave hevder han har en strategi. Ingen har sett den enda.",
    "Dave er ikke sist fordi han er dårlig. Han er sist fordi alle andre er bedre.",
    "Dave sin mesterstrategi: velg alltid den som krasjer.",
    "Dave sin poengutvikling minner om et DNF — starter greit, slutter vondt.",
    "Dave er en varm person. Bilen hans er alltid i brann.",
    "Dave betaler for å tape. Det er faktisk imponerende.",
    "Dave gjør fantasy F1 til en form for meditasjon. Veldig lavt tempo.",
    "Dave har tro på seg selv. Det er den eneste som har det.",
    "Dave er ikke konsistent. Han er konsekvent inkonsistent.",
    "Dave sin fantasy-sjåfør presterer nøyaktig som Dave: under forventning.",
  ],
  Oddi: [
    "Oddi har fått så mange penalty points at FIA har spurt om han er OK.",
    "Oddi sin kjørestil er kreativ. Og ulovlig.",
    "9 penalty points. Oddi er ikke sjåfør, han er et faresignal på fire hjul.",
    "Oddi krasjer inn i folk som om det er en målsetning, ikke en konsekvens.",
    "Oddi tror safetycar betyr fritt frem.",
    "Oddi sin racingfilosofi: hvis du ikke kan slå dem, krasj inn i dem.",
    "Oddi har sendt inn flere unnskyldninger enn faktisk gode resultater.",
    "Oddi er farligst når han er i nærheten av andre biler. Og det er alltid.",
    "Oddi har et øye for gaps. De fleste finnes ikke.",
    "Oddi er den eneste spilleren med sin egen incident-kategori i statistikken.",
    "Med Oddi ved rattet er safetycar ikke et unntak, det er en garanti.",
    "Oddi sin forklaring etter hvert krasj er lengre enn selve racet.",
    "Oddi er aggressiv, unnskyldende og alltid uskyldig. I den rekkefølgen.",
    "FIA ringer Oddi oftere enn mamma.",
    "Oddi har ikke krasjet inn i alle. Sesongen er ikke ferdig.",
    "Oddi prøver. Egentlig veldig hardt. Det er det skumle.",
    "Oddi er en tikkende bombe i en garasje full av biler.",
    "Oddi sin racingfilosofi: enten vinner du, eller du tar med deg noen i fallet.",
  ],
  William: [
    "William er ny, men skuffelsen føles allerede godt etablert.",
    "William har rookie-unnskyldningen. Den varer ikke ut sesongen.",
    "William kjører som om han fortsatt leser reglementet underveis.",
    "William har ambisjoner. De er betydelig større enn poengsummen.",
    "William lærer fort. Bare ikke fort nok.",
    "William er Mercedes sin fremtid. Fremtiden ligger et godt stykke frem.",
    "William stiller alltid opp. Resultatene gjør det sjeldnere.",
    "William har allerede lært det viktigste: hvordan man forklarer et dårlig løp.",
    "William er uforutsigbar. Det er både styrken hans og hele problemet.",
    "William har fart. Retningen er det verre med.",
    "William er lagkameraten til Dave. Det er straff nok i seg selv.",
    "William blir bedre for hvert løp. Fra et bemerkelsesverdig lavt utgangspunkt.",
    "William sin sesong beskrives best som en læringsprosess. Det er pent sagt.",
    "William tok ikke feil valg. Han tok alle sammen.",
  ],
  Philip: [
    "Philip sin pre-race rutine er kylling. Post-race rutine: også kylling.",
    "Philip valgte lag basert på hvem som hadde best kylling i hospitality.",
    "Philip har spist mer kylling denne sesongen enn han har scoret poeng.",
    "Philip sin strategi er kyllingbasert. Den er like uklar som den høres ut.",
    "Philip bytter gjerne en raceseier mot en halv grillkylling.",
    "Philip sin box-radio består av ett ord, ropt tre ganger: KYLLING.",
    "Philip ser på F1 for pit stop-pausene. Da rekker han en kyllingwrap.",
    "Philip sin fantasy-strategi lukter kylling. Bokstavelig talt.",
    "Philip har regnet ut at én raceseier tilsvarer fjorten kyllingfileter. Det er det eneste han har regnet ut.",
    "Philip sin garasje er ikke en garasje. Det er en rotisserie.",
    "Philip vil ha DRS på kyllingen også. Raskere levering.",
    "Philip mistet fokus i R3 fordi noen nevnte kylling. Det er hele forklaringen.",
    "Philip er rask i pitlane. Enda raskere i kyllingkøen.",
    "Philip sin drømmesponsor er ikke Red Bull. Det er en kyllinggård.",
    "Philip forhandler alltid om kontrakt. Betalingen skal være i kylling.",
    "Philip er ikke sulten på seier. Han er bare sulten.",
    "Philip er kyllingdrevet. Bilen er dessverre ikke det.",
    "Philip sitt eneste konsekvente resultat er kyllingforbruket.",
  ],
  Shaya: [
    "Shaya leder. Shaya vet at han leder. Alle vet at Shaya vet det.",
    "Shaya vinner med en selvfølgelighet som er direkte provoserende.",
    "Shaya kjører for Ferrari. Endelig et lag som matcher selvtilliten.",
    "Shaya sin verste runde er fortsatt bedre enn Dave sin beste.",
    "Shaya trenger ikke flaks. Det er nettopp det som er irriterende.",
    "Shaya snakker ikke trash. Han lar tabellen gjøre det for seg.",
    "Shaya er grunnen til at de andre åpner resultatsiden med frykt.",
    "Shaya har funnet formelen. Han deler den ikke.",
    "Shaya taper av og til. Det regnes som en nyhetssak.",
    "Shaya sin selvtillit har egen startplass på grid.",
    "Å slå Shaya er ikke lenger et mål. Det er en fantasi.",
    "Shaya er stabil, rask og uutholdelig. I den rekkefølgen.",
  ],
  Antonio: [
    "Antonio er stabil. Stabilt i nedoverbakke.",
    "Antonio er god nok til å delta. Ikke alltid god nok til å score.",
    "Antonio har potensial. Vi venter fortsatt, tålmodig, på at det skal vises.",
    "Antonio sin poengkurve ser ut som en feilmelding midtveis i sesongen.",
    "Antonio er taktisk. Bare ingen vet hvilken taktikk det er.",
    "Antonio leverer. Bare ikke poeng.",
    "Antonio er F1 BOYZAs mest pålitelige wildcard.",
    "Antonio har hatt gode runder. Ingen husker dem.",
    "Antonio sin kurve ser ut som et EKG etter en dårlig nyhet.",
    "Antonio spiller alltid med full innsats. Resultatene respekterer ikke det.",
    "Antonio er en mann med visjoner. Visjoner om seire som aldri kommer.",
    "Antonio er ikke alltid sist. Det er Dave sin jobb.",
  ],
};

// Sannsynlighet i prosent for hvem som blir utpekt. Må summere til 100.
const VEKTER = {
  Dave:    25,
  William: 25,
  Philip:  25,
  Oddi:   10,
  Shaya:   10,
  Antonio:  5,
};

function weightedPick() {
  const total = Object.values(VEKTER).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [navn, vekt] of Object.entries(VEKTER)) {
    r -= vekt;
    if (r < 0) return navn;
  }
  return 'Dave';
}

function initTrashTalk() {
  const btn    = document.getElementById('trashTalkBtn');
  const result = document.getElementById('trashTalkResult');
  if (!btn || !result) return;

  btn.addEventListener('click', () => {
    const driver = weightedPick();
    const lines  = TRASH_TALK[driver];
    const line   = lines[Math.floor(Math.random() * lines.length)];

    result.innerHTML = `
      <span class="trash-driver">Radio · ${kode(driver)} · ${driver}</span>
      <span class="trash-line">«${line}»</span>
    `;
    result.classList.add('visible');
  });
}

// Startoppstillingen hentes fra resultatdataen, så forsiden aldri kommer i
// utakt med tabellene på resultatsiden.
function initGrid() {
  const container = document.getElementById('lineup');
  if (!container) return;

  fetchData('data/resultater.json').then(allData => {
    if (!allData) return;

    const season = Object.keys(allData).sort().pop();
    const sesong = allData[season];
    if (!sesong) return;

    const label = document.getElementById('lineupSeason');
    if (label) label.textContent = season;

    // Filene lagrer poeng per løp, så sesongtotalen er summen av lista.
    const sum = f => f.poeng.reduce((a, b) => a + b, 0);
    const startet = sesong.forere.some(f => f.poeng.length > 0);
    const rekkefolge = startet
      ? [...sesong.forere].sort((a, b) => sum(b) - sum(a))
      : sesong.forere;

    container.innerHTML = rekkefolge.map((forer, i) => {
      const lag   = lagTilForer(sesong, forer.navn);
      const farge = (lag && lag.farge) || '#78849a';
      return `
        <div class="grid-slot" style="--team:${farge}">
          <span class="slot-pos">${i + 1}</span>
          <span class="slot-code">${kode(forer.navn)}<span class="slot-name">${forer.navn}</span></span>
          <span class="slot-team">${lag ? lag.navn : 'Uten lag'}</span>
        </div>
      `;
    }).join('');

    const note = document.getElementById('lineupNote');
    if (note) {
      note.textContent = startet
        ? 'Oppstillingen følger mesterskapsstillingen.'
        : 'Sesongen har ikke startet. Rekkefølgen er lagoppsettet, ikke stillingen.';
    }
  });
}

export function initHomepage() {
  initTrashTalk();
  initGrid();
}
