import { GEOCODING_ERRORS } from '../constants/messages';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const POSTAL_PINCODE_BASE = 'https://api.postalpincode.in';
const HEADERS = {
  'User-Agent': 'FoodBridgeApp/1.0 (foodbridge-app)',
  'Accept-Language': 'en',
};

export class GeocodingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GeocodingError';
  }
}

function mapNominatimAddress(address, lat, lon) {
  return {
    addressLine1: address.road
      || address.pedestrian
      || address.residential
      || address.neighbourhood
      || address.quarter
      || address.hamlet
      || '',
    addressLine2: address.suburb
      || address.neighbourhood
      || address.quarter
      || address.district
      || '',
    city: address.city
      || address.town
      || address.village
      || address.county
      || address.district
      || '',
    state: address.state || '',
    pinCode: address.postcode || '',
    latitude: parseFloat(lat) || 0,
    longitude: parseFloat(lon) || 0,
  };
}

export async function reverseGeocode(lat, lon) {
  if (!lat || !lon || (lat === 0 && lon === 0)) {
    throw new GeocodingError(GEOCODING_ERRORS.COORDINATES_MISSING);
  }

  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new GeocodingError(GEOCODING_ERRORS.TIMEOUT);
    }
    throw new GeocodingError(GEOCODING_ERRORS.NETWORK);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new GeocodingError(GEOCODING_ERRORS.SERVICE_UNAVAILABLE);
  }

  const data = await response.json();

  if (!data || !data.address) {
    return {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pinCode: '',
      latitude: lat,
      longitude: lon,
    };
  }

  return mapNominatimAddress(data.address, data.lat || lat, data.lon || lon);
}

function formatDisplayName(displayName) {
  if (!displayName) return '';
  const parts = displayName.split(',').map(p => p.trim()).filter(Boolean);
  const filtered = parts.filter(p => p.toLowerCase() !== 'india');
  return filtered.slice(0, 4).join(', ');
}

// Generate fallback queries tried one at a time if first fails
// Uses commas which Nominatim docs say improve performance
function generateQueryVariants(query) {
  const trimmed = query.trim();
  const words = trimmed.split(/\s+/);
  const variants = [];

  // Primary: original query with commas between words for better Nominatim parsing
  // Nominatim docs: "Commas are optional, but improve performance"
  variants.push(words.join(', '));

  // Fallback 1: first two words + last word
  // "Rajendra Nagar Bijalpur Indore" → "Rajendra Nagar, Indore"
  if (words.length >= 3) {
    variants.push([...words.slice(0, 2), words[words.length - 1]].join(', '));
  }

  // Fallback 2: last two words
  // "Rajendra Nagar Bijalpur Indore" → "Bijalpur, Indore"
  if (words.length >= 3) {
    variants.push(words.slice(-2).join(', '));
  }

  // Deduplicate
  return [...new Set(variants)];
}

export function searchAddress(query) {
  const controller = new AbortController();

  const promise = (async () => {
    if (!query || query.trim().length < 3) return [];

    const variants = generateQueryVariants(query.trim());

    // SEQUENTIAL not parallel — Nominatim policy: max 1 request/second
    // Try each variant one at a time, stop as soon as we get results
    for (const variant of variants) {
      if (controller.signal.aborted) return [];

      const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(variant)}&countrycodes=in&format=json&addressdetails=1&limit=8`;

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: HEADERS,
        });

        if (!response.ok) continue;

        const results = await response.json();

        if (!Array.isArray(results) || results.length === 0) continue;

        // Got results — deduplicate by place_id, sort by importance, return
        const seen = new Set();
        const unique = results.filter(item => {
          if (seen.has(item.place_id)) return false;
          seen.add(item.place_id);
          return true;
        });

        unique.sort((a, b) => (b.importance || 0) - (a.importance || 0));

        return unique.slice(0, 6).map(item => {
          const mapped = mapNominatimAddress(item.address, item.lat, item.lon);
          return {
            displayName: formatDisplayName(item.display_name || ''),
            ...mapped,
          };
        });

      } catch (err) {
        if (err.name === 'AbortError') return [];
        // Network error on this variant — try next
        continue;
      }
    }

    // All variants exhausted with no results
    return [];
  })();

  const cancelFn = () => controller.abort();
  return [promise, cancelFn];
}

export function searchCities(query, stateFilter = null) {
  const controller = new AbortController();

  const promise = (async () => {
    const searchQuery = stateFilter
      ? `${query}, ${stateFilter}, India`
      : `${query}, India`;

    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(searchQuery)}&countrycodes=in&format=json&addressdetails=1&limit=10`;

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: HEADERS,
      });
    } catch (err) {
      if (err.name === 'AbortError') return [];
      throw new GeocodingError(GEOCODING_ERRORS.NETWORK);
    }

    if (!response.ok) {
      throw new GeocodingError(GEOCODING_ERRORS.SERVICE_UNAVAILABLE);
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return [];

    const seen = new Set();
    return results
      .map(item => ({
        cityName: item.address?.city || item.address?.town || item.address?.village || item.address?.county || '',
        stateName: item.address?.state || '',
      }))
      .filter(item => {
        const key = item.cityName + '|' + item.stateName;
        if (!item.cityName || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  })();

  const cancelFn = () => controller.abort();
  return [promise, cancelFn];
}

export function searchByPincode(pincode) {
  const controller = new AbortController();

  const promise = (async () => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return null;

    const url = `${POSTAL_PINCODE_BASE}/pincode/${pincode}`;

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err) {
      if (err.name === 'AbortError') return null;
      throw new Error('Network error. Please check your connection.');
    }

    if (!response.ok) throw new Error('Service unavailable. Please try again.');

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0 || data[0].Status !== 'Success') return null;

    const postOffices = data[0].PostOffice;
    if (!Array.isArray(postOffices) || postOffices.length === 0) return null;

    const city = (postOffices[0].District || '').trim();
    const state = (postOffices[0].State || '').trim();

    const localityPO = postOffices.find(p => p.BranchType !== 'Head Post Office') || postOffices[0];
    const rawLocality = (localityPO.Name || '').trim();
    const addressLine2 = rawLocality.replace(/\s*\([^)]*\)\s*$/, '').trim();

    let latitude = 0;
    let longitude = 0;

    try {
      const nominatimUrl = `${NOMINATIM_BASE}/search?postalcode=${pincode}&countrycodes=in&format=json&limit=1`;
      const nomResponse = await fetch(nominatimUrl, {
        signal: controller.signal,
        headers: HEADERS,
      });
      if (nomResponse.ok) {
        const nomData = await nomResponse.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
          latitude = parseFloat(nomData[0].lat) || 0;
          longitude = parseFloat(nomData[0].lon) || 0;
        }
      }
    } catch {
      // silently ignore
    }

    return { city, state, addressLine2, latitude, longitude };
  })();

  const cancelFn = () => controller.abort();
  return [promise, cancelFn];
}

export async function geocodeAddress(query) {
  if (!query || query.trim().length < 3) return null;

  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=1`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: HEADERS,
    });
    if (!response.ok) return null;
    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;
    return {
      latitude: parseFloat(results[0].lat) || 0,
      longitude: parseFloat(results[0].lon) || 0,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}