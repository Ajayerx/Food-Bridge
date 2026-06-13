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

    const headPO = postOffices.find(p => p.BranchType === 'Head Post Office') || postOffices[0];

    const district = headPO.District || '';
    const stateFromAPI = headPO.State || '';

    // City: if Head PO name differs from District, use it (e.g. "Motihari" vs district "East Champaran")
    let city = district;
    const headName = (headPO.Name || '').trim();
    if (headName && headName.toLowerCase() !== district.toLowerCase()) {
      city = headName;
    }

    // AddressLine1: first non-Head PO with a meaningful locality name
    const localityPO = postOffices.find(p => {
      if (p.BranchType === 'Head Post Office') return false;
      const name = (p.Name || '').trim().toLowerCase();
      return name !== city.toLowerCase() && name !== district.toLowerCase();
    }) || headPO;
    const addressLine1 = localityPO.Name.trim();

    // AddressLine2: Division or Region
    const division = headPO.Division || '';
    const region = headPO.Region || '';
    let addressLine2 = '';
    if (division && division !== city && division !== addressLine1) {
      addressLine2 = division;
    } else if (region && region !== city && region !== addressLine1) {
      addressLine2 = region;
    }

    return { addressLine1, addressLine2, city, state: stateFromAPI };
  })();

  const cancelFn = () => controller.abort();
  return [promise, cancelFn];
}
