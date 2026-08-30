/**
 * Shared fetch wrapper with error handling.
 *
 * Dataene kommer fra Supabase (js/modules/data.js). Denne leser filene under
 * data/ og brukes nå bare som reserve når databasen ikke svarer.
 *
 * Svaret caches per URL, siden flere moduler kan be om samme fil på én side.
 */
const cache = new Map();

export function fetchData(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        return null;
      }));
  }
  return cache.get(url);
}
