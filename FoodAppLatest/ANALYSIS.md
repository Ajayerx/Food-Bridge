# Map Feature Analysis & Changes

## Date: 2026-06-16

---

## Architecture Overview

```
HomeScreen ──► LocationPickerScreen ──► AddAddressScreen
                    ▲                        │
                    │                    EditAddressScreen
                    │                        │
               LocationSelectScreen ──────────┘
```

### Map Stack
- **Library**: `@maplibre/maplibre-react-native` v10.0.0
- **Tile Source**: OpenFreeMap Liberty (vector tiles)
- **Geocoding**: OSM Nominatim API
- **GPS**: `react-native-geolocation-service`

---

## Issues & Fixes

### Issue 1: Map view not as expected
**Root cause**: OSM raster tiles have no vector label/road layers.
**Fix**: Switched to OpenFreeMap Liberty vector tile style.

### Issue 2: Errors during drag/zoom
**Root cause**: `onRegionDidChange` without try-catch, no retry for Nominatim 429.
**Fix**: Added try-catch in handler, 429 retry logic in geocodingService.

### Issue 3: Names not showing for locations
**Root cause**: OSM raster tiles don't render all labels at every zoom.
**Fix**: Vector tiles with dedicated label layers show names consistently.

---

## Files Changed

| File | Change Summary |
|------|----------------|
| `src/screens/location/LocationPickerScreen.js` | Vector tile style, try-catch, error banners, contextual navigation |
| `src/screens/address/AddAddressScreen.js` | Pass existing coords to LocationPickerScreen |
| `src/screens/address/EditAddressScreen.js` | Added "Pick on map" button, handle prefillData return |
| `src/services/geocodingService.js` | 429 rate-limit retry logic |
| `src/screens/home/HomeScreen.js` | Removed hardcoded Google Maps API key, use geocodingService |

---

## Detailed Changes

### 1. `LocationPickerScreen.js`

**Before (raster style JSON)**:
```js
const MAP_STYLE = JSON.stringify({
  version: 8,
  sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
});
```

**After (vector URL)**:
```js
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
```

**New state variables added**:
- `geocodeError` — error message shown in bottom sheet when reverse geocode fails
- `tileError` — boolean, shows banner when map tiles fail to load

**`onRegionDidChange`** now wrapped in try-catch with null checks:
```js
const onRegionDidChange = useCallback((feature) => {
  try {
    if (!feature?.properties?.isUserInteraction) return;
    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length < 2) return;
    const [lng, lat] = coords;
    currentCoordsRef.current = [lng, lat];
    clearTimeout(reverseDebounceRef.current);
    reverseDebounceRef.current = setTimeout(() => {
      doReverseGeocode(lat, lng);
    }, 500);
  } catch (e) {
    console.warn('onRegionDidChange error:', e);
  }
}, [doReverseGeocode]);
```

**`handleConfirm` now respects `source` param**:
- `source === 'EditAddressScreen'` → navigates to `EditAddressScreen` with prefillData
- otherwise → navigates to `AddAddressScreen` with prefillData

### 2. `AddAddressScreen.js`

**Before**:
```js
onPress={() => navigation.navigate('LocationPickerScreen', {})}
```

**After**:
```js
onPress={() => navigation.navigate('LocationPickerScreen', {
  initialCoords: latitude && longitude ? [longitude, latitude] : undefined,
  initialAddress: addressLine1 ? { addressLine1, addressLine2, city, state, pinCode } : undefined,
  source: 'AddAddressScreen',
})}
```

### 3. `EditAddressScreen.js`

**Added**:
- `prefillData` route param reader + `useEffect` to populate fields on return from LocationPickerScreen
- `handlePickOnMap` callback with `withLocationConfirm` for existing location
- "Pick location on map" button in JSX (after GPS button)
- `pickOnMapBtn` and `pickOnMapText` styles

### 4. `geocodingService.js`

**Added `fetchWithRetry` helper**:
```js
async function fetchWithRetry(url, options, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.status !== 429 || attempt >= retries) return response;
    const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }
}
```

Used in `reverseGeocode` instead of direct `fetch()`.

### 5. `HomeScreen.js`

**Removed**: `import axios from "axios"`  
**Added**: `import { reverseGeocode } from '../../services/geocodingService'`  
**Replaced**: Google Maps API call with `reverseGeocode(latitude, longitude)`  

---

## Map Style Reference

**OpenFreeMap Liberty** URL: `https://tiles.openfreemap.org/styles/liberty`

Features:
- Vector tiles (smooth at all zoom levels)
- Label layers for: cities, towns, villages, states, countries, streets, POIs
- Non-Latin name support (Devanagari, etc.)
- Road network with color-coded types
- Building footprints
- Land use/land cover
- Free, no API key required

---

## Testing Checklist

- [ ] Map renders with vector tiles (labels visible at zoom 15)
- [ ] Drag map triggers reverse geocode (address updates in bottom sheet)
- [ ] Zoom in/out works without errors
- [ ] Search for address moves pin and updates address
- [ ] "Current Location" button gets GPS and moves map
- [ ] "Confirm" from LocationPickerScreen returns data to correct screen
- [ ] EditAddressScreen "Pick on map" button works
- [ ] EditAddressScreen receives prefillData on return
- [ ] Network error shows tile error banner
- [ ] AddAddressScreen opens map with existing coords if previously set
- [ ] HomeScreen "Use Current Location" works without Google Maps key
