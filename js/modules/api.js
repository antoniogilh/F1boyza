/**
 * Shared fetch wrapper with error handling.
 *
 * Flere moduler leser de samme datafilene på samme side (statuslinja og
 * nedtellingen deler datoer.json), så svaret caches per URL.
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
