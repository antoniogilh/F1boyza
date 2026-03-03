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
  Gorba: [
    "Gorba har fått så mange penalty points at FIA har spurt om han er OK.",
    "Gorba sin kjørestil er kreativ. Og ulovlig.",
    "9 penalty points. Gorba er ikke sjåfør, han er et faresignal på fire hjul.",
    "Gorba krasjer inn i folk som om det er en målsetning, ikke en konsekvens.",
    "Gorba tror safetycar betyr fritt frem.",
    "Gorba sin racingfilosofi: hvis du ikke kan slå dem, krasj inn i dem.",
    "Gorba har sendt inn flere unnskyldninger enn faktisk gode resultater.",
    "Gorba er farligst når han er i nærheten av andre biler. Og det er alltid.",
    "Gorba har et øye for gaps. De fleste finnes ikke.",
    "Gorba er den eneste spilleren med sin egen incident-kategori i statistikken.",
    "Med Gorba ved rattet er safetycar ikke et unntak, det er en garanti.",
    "Gorba sin forklaring etter hvert krasj er lengre enn selve racet.",
    "Gorba er aggressiv, unnskyldende og alltid uskyldig. I den rekkefølgen.",
    "FIA ringer Gorba oftere enn mamma.",
    "Gorba har ikke krasjet inn i alle. Sesongen er ikke ferdig.",
    "Gorba prøver. Egentlig veldig hardt. Det er det skumle.",
    "Gorba er en tikkende bombe i en garasje full av biler.",
    "Gorba sin racingfilosofi: enten vinner du, eller du tar med deg noen i fallet.",
  ],
  Frenzy: [
    "Frenzy vinner fortsatt, men han begynner å bli kjedelig å heie på.",
    "Frenzy er så god at resten av gjengen vurderer å bytte spill.",
    "Frenzy er arrogant. Igjen: med god grunn, men fortsatt.",
    "Frenzy tror han er Max Verstappen. Kanskje han faktisk er det.",
    "Frenzy vinner ikke alltid. Men når han taper vet alle at det er en anomali.",
    "Frenzy er grunnen til at de andre spiller. De håper på at han tar feil.",
    "Frenzy er statistisk sett umulig å slå. Og allikevel er han der hver runde.",
    "Frenzy er ikke heldig. Han er bare bedre. Det er verre.",
    "Å tape mot Frenzy er blitt en rituell opplevelse for resten av gjengen.",
    "Frenzy sin worst-case er de andres best-case.",
    "Frenzy trenger ikke trash talk. Poengene taler for seg selv.",
    "De andre spiller for andreplassen. Frenzy vet ikke at det finnes en.",
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

function weightedPick() {
  const r = Math.random();
  if (r < 0.50) return 'Dave';
  if (r < 0.80) return 'Gorba';
  if (r < 0.90) return 'Frenzy';
  return 'Antonio';
}

function initTrashTalk() {
  const btn    = document.getElementById('trashTalkBtn');
  const result = document.getElementById('trashTalkResult');
  if (!btn || !result) return;

  btn.addEventListener('click', () => {
    const driver = weightedPick();
    const lines  = TRASH_TALK[driver];
    const line   = lines[Math.floor(Math.random() * lines.length)];

    result.innerHTML = `<span class="trash-driver">${driver}</span><span class="trash-line">"${line}"</span>`;
    result.classList.add('visible');
  });
}

export function initHomepage() {
  initTrashTalk();
}
