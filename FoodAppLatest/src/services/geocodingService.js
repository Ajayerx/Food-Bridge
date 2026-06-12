import { GEOCODING_ERRORS } from '../constants/messages';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
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

export function searchAddress(query) {
  const controller = new AbortController();

  const promise = (async () => {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=5`;

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: HEADERS,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        return [];
      }
      throw new GeocodingError(GEOCODING_ERRORS.NETWORK);
    }

    if (!response.ok) {
      throw new GeocodingError(GEOCODING_ERRORS.SERVICE_UNAVAILABLE);
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }

    return results.map(item => {
      const mapped = mapNominatimAddress(item.address, item.lat, item.lon);
      return {
        displayName: item.display_name || '',
        ...mapped,
      };
    });
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
      if (err.name === 'AbortError') {
        return [];
      }
      throw new GeocodingError(GEOCODING_ERRORS.NETWORK);
    }

    if (!response.ok) {
      throw new GeocodingError(GEOCODING_ERRORS.SERVICE_UNAVAILABLE);
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }

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

function cleanGovtSuffix(s) {
  return s.replace(/\s+(Municipal\s+Corporation|Municipal\s+Council|Nagar\s+Nigam|Nagar\s+Parishad|City\s+Municipal\s+Council)\s*$/i, '').trim();
}
function cleanDistrictSuffix(s) {
  let r = s;
  while (/\s+(Urban|Rural|District|City)\s*$/i.test(r)) {
    r = r.replace(/\s+(Urban|Rural|District|City)\s*$/i, '').trim();
  }
  return r;
}
function cleanTehsilSuffix(s) {
  return s.replace(/\s+(Tehsil|Tahsil)\s*$/i, '').trim();
}
function cleanZoneWard(s) {
  return s.replace(/\b(Ward|Zone)\s*\d*\s*/gi, '').trim();
}
function hasGovtPattern(s) {
  return /Municipal|Corporation|Council|Nagar\s+Nigam|Nagar\s+Parishad|District|Tehsil|Tahsil|Zone\s+\d|Ward\s+\d/i.test(s);
}

function extractPincodeAddress(item) {
  const addr = item.address || {};
  const parts = (item.display_name || '').split(',').map(s => s.trim());

  // ── City ──
  let city = '';
  if (addr.city && !hasGovtPattern(addr.city)) {
    city = cleanGovtSuffix(addr.city);
  }
  if (!city || hasGovtPattern(city)) {
    city = addr.state_district || '';
    city = cleanDistrictSuffix(city);
  }
  if (!city && addr.county) {
    city = cleanTehsilSuffix(addr.county);
  }
  if (hasGovtPattern(city)) city = '';

  // Known state name for exclusion (prevents state from leaking into address lines)
  const knownState = (addr.state || '').toLowerCase();

  // ── Address Line 1 (most specific area/locality) ──
  let line1 = '';
  if (addr.suburb && !hasGovtPattern(addr.suburb)) {
    line1 = addr.suburb;
  } else if (addr.suburb) {
    const cleaned = cleanTehsilSuffix(cleanZoneWard(addr.suburb));
    if (cleaned && !hasGovtPattern(cleaned)) line1 = cleaned;
  }
  if (!line1 && addr.neighbourhood) {
    line1 = addr.neighbourhood;
  }
  if (!line1 && parts.length >= 2) {
    const candidate = parts[1];
    if (candidate !== city && candidate.toLowerCase() !== knownState && !hasGovtPattern(candidate)) {
      line1 = candidate;
    }
  }

  // ── Address Line 2 (broader area) ──
  let line2 = '';
  if (addr.city_district && addr.city_district !== line1 && !hasGovtPattern(addr.city_district)) {
    line2 = addr.city_district;
  }
  if ((!line2 || line2 === line1) && addr.county && addr.county !== line1) {
    const cleaned = cleanTehsilSuffix(addr.county);
    if (cleaned && cleaned !== city && cleaned.toLowerCase() !== knownState && !hasGovtPattern(cleaned)) {
      line2 = cleaned;
    }
  }
  if (!line2 && addr.suburb && addr.suburb !== line1) {
    const cleaned = cleanTehsilSuffix(cleanZoneWard(addr.suburb));
    if (cleaned && cleaned !== city && cleaned.toLowerCase() !== knownState && !hasGovtPattern(cleaned)) {
      line2 = cleaned;
    }
  }
  if (!line2 && parts.length >= 3) {
    const candidate = parts[2];
    if (candidate !== city && candidate !== line1 && candidate.toLowerCase() !== knownState && !hasGovtPattern(candidate)) {
      line2 = candidate;
    }
  }
  if (!line2 && parts.length >= 4) {
    const candidate = parts[parts.length - 3];
    if (candidate !== city && candidate !== line1 && candidate.toLowerCase() !== knownState && !hasGovtPattern(candidate)) {
      line2 = candidate;
    }
  }

  if (hasGovtPattern(line1)) line1 = '';
  if (hasGovtPattern(line2) || line2 === line1 || line2 === city) line2 = '';

  // ── State: Nominatim omits "state" for UTs like Delhi, fallback to display_name ──
  let state = addr.state || '';
  if (!state && parts.length >= 2) {
    const candidate = parts[parts.length - 2];
    if (candidate && candidate !== 'India') state = candidate;
  }

  return { addressLine1: line1, addressLine2: line2, city, state };
}

export function searchByPincode(pincode) {
  const controller = new AbortController();

  const promise = (async () => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return null;

    const url = `${NOMINATIM_BASE}/search?postalcode=${pincode}&countrycodes=in&format=json&addressdetails=1&limit=5`;

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: HEADERS,
      });
    } catch (err) {
      if (err.name === 'AbortError') return null;
      throw new GeocodingError(GEOCODING_ERRORS.NETWORK);
    }

    if (!response.ok) throw new GeocodingError(GEOCODING_ERRORS.SERVICE_UNAVAILABLE);

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    return extractPincodeAddress(results[0]);
  })();

  const cancelFn = () => controller.abort();
  return [promise, cancelFn];
}
