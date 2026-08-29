// Podium-teksten i kalender.json er fritekst. To former forekommer:
//   «Pole: X, Racevinner: Y» (evt. med Sprintvinner i stedet for Pole)
//   «X Slam Dunk»            – pole og seier til samme fører, ført opp som slam dunk
const SLAM = /^\s*([\wÆØÅæøå]+)\s+slam\s*dunk/i;
// \b foran Pole hindrer at «Sprintpole:» også treffer pole-regexen.
const FELT = {
  pole:       /\bPole:?\s+([\wÆØÅæøå]+)/i,
  sprintpole: /\bSprintpole:?\s+([\wÆØÅæøå]+)/i,
  vinner:     /\bRacevinner:?\s+([\wÆØÅæøå]+)/i,
  sprint:     /\bSprintvinner:?\s+([\wÆØÅæøå]+)/i,
};

/**
 * `slamDunk` settes kun når løpet faktisk er skrevet som «X Slam Dunk».
 * Pole + seier til samme fører i den vanlige formen teller altså ikke —
 * slam dunk er noe vi noterer for hånd, ikke noe som utledes.
 */
export function parsePodium(text) {
  const tom = { pole: null, sprintpole: null, vinner: null, sprint: null, slamDunk: false };
  if (!text || !text.trim()) return tom;

  const slam = text.match(SLAM);
  if (slam) return { ...tom, pole: slam[1], vinner: slam[1], slamDunk: true };

  const felt = re => {
    const m = text.match(re);
    return m ? m[1].trim() : null;
  };

  return {
    pole:       felt(FELT.pole),
    sprintpole: felt(FELT.sprintpole),
    vinner:     felt(FELT.vinner),
    sprint:     felt(FELT.sprint),
    slamDunk:   false,
  };
}
