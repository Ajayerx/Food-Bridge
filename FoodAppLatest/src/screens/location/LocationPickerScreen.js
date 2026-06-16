import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  FlatList,
  Dimensions,
  Keyboard,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { reverseGeocode, searchAddress } from '../../services/geocodingService';

// ─── Map style ────────────────────────────────────────────────────────────────
// Pre-stringified at module level so the reference never changes across renders.
//
// Tile source priority:
//   1. openstreetmap.org/tile — most permissive CORS + UA policy, works on all
//      Android versions without extra headers
//   2. CartoDB voyager — better looking but occasionally blocks requests that
//      lack a browser UA (handled via CustomHeadersInterceptor in MainApplication)
//
// We use OSM directly here so tiles load even before the native interceptor
// has had a chance to attach the User-Agent on the very first request.
const MAP_STYLE_JSON = JSON.stringify({
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
});

// NOTE: Do NOT call MapLibreGL.addCustomHeader() here.
// Headers are now registered natively in MainApplication.kt via
// CustomHeadersInterceptor BEFORE MapLibre.getInstance() is called,
// which is the only way to guarantee they're present on the very
// first tile request. Calling addCustomHeader from JS races with
// native tile fetches and can arrive too late.

const BOTTOM_SHEET_HEIGHT = 220;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT - BOTTOM_SHEET_HEIGHT;

// Stable reference — never recreated as a new array literal in JSX
const DEFAULT_COORDS = [75.8577, 22.7196]; // Indore

const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

export const LocationPickerScreen = ({ navigation, route }) => {
  const { initialCoords, initialAddress } = route?.params || {};

  const [address, setAddress] = useState(initialAddress || null);
  const [isReversing, setIsReversing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const cameraRef = useRef(null);
  const cancelRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const reverseDebounceRef = useRef(null);
  const gpsAttemptedRef = useRef(false);
  // Always-current coords — updated on user drag, GPS, or search pick
  const currentCoordsRef = useRef(initialCoords || DEFAULT_COORDS);

  // ── Reverse geocode ───────────────────────────────────────────────────────
  const doReverseGeocode = useCallback(async (lat, lng) => {
    setIsReversing(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setAddress(result);
    } catch {
      setAddress(null);
    } finally {
      setIsReversing(false);
    }
  }, []);

  // ── Move camera imperatively — NEVER by changing JSX props ───────────────
  // Changing centerCoordinate as a prop creates a new array on every render
  // → MapLibre detects the changed reference → moves camera → fires
  // onRegionDidChange → state update → re-render → new array → infinite loop.
  const flyTo = useCallback((coords, zoom = 16) => {
    cameraRef.current?.setCamera({
      centerCoordinate: coords,
      zoomLevel: zoom,
      animationMode: 'flyTo',
      animationDuration: 800,
    });
  }, []);

  // ── On mount: try GPS, fall back to default centre ───────────────────────
  useEffect(() => {
    if (initialCoords) {
      doReverseGeocode(initialCoords[1], initialCoords[0]);
      return;
    }
    if (gpsAttemptedRef.current) return;
    gpsAttemptedRef.current = true;

    requestLocationPermission().then(granted => {
      if (!granted) return;
      Geolocation.getCurrentPosition(
        ({ coords: { latitude: lat, longitude: lng } }) => {
          const coords = [lng, lat];
          currentCoordsRef.current = coords;
          flyTo(coords);
          doReverseGeocode(lat, lng);
        },
        () => { /* silently stay at default */ },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Region change ─────────────────────────────────────────────────────────
  // MapLibre v10 sets feature.properties.isUserInteraction = true only when
  // the user actually dragged the map. When WE called setCamera() it's false.
  // Checking this flag is the correct way to avoid the geocode feedback loop.
  const onRegionDidChange = useCallback((feature) => {
    if (!feature?.properties?.isUserInteraction) return;

    const [lng, lat] = feature.geometry.coordinates;
    currentCoordsRef.current = [lng, lat];

    // Debounce — don't hit Nominatim on every pixel of drag
    clearTimeout(reverseDebounceRef.current);
    reverseDebounceRef.current = setTimeout(() => {
      doReverseGeocode(lat, lng);
    }, 500);
  }, [doReverseGeocode]);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (cancelRef.current) cancelRef.current();

    if (text.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [promise, cancel] = searchAddress(text);
        cancelRef.current = cancel;
        const results = await promise;
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch {
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setSearchLoading(false);
      }
    }, 600);
  }, []);

  const clearSearch = useCallback(() => {
    if (cancelRef.current) cancelRef.current();
    clearTimeout(searchDebounceRef.current);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    Keyboard.dismiss();
  }, []);

  // Use address data already in the search result — no extra API call needed
  const onSearchResultPress = useCallback((item) => {
    if (!item.latitude || !item.longitude) return;
    const coords = [item.longitude, item.latitude];
    currentCoordsRef.current = coords;
    Keyboard.dismiss();
    clearSearch();
    flyTo(coords);
    setAddress({
      addressLine1: item.addressLine1 || '',
      addressLine2: item.addressLine2 || '',
      city: item.city || '',
      state: item.state || '',
      pinCode: item.pinCode || '',
    });
  }, [clearSearch, flyTo]);

  // ── Current location button ───────────────────────────────────────────────
  const handleCurrentLocation = useCallback(async () => {
    const ok = await requestLocationPermission();
    if (!ok) return;
    Geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        const coords = [lng, lat];
        currentCoordsRef.current = coords;
        flyTo(coords);
        doReverseGeocode(lat, lng);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [flyTo, doReverseGeocode]);

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (!address) return;
    const [lng, lat] = currentCoordsRef.current;
    navigation.navigate('AddAddressScreen', {
      prefillData: {
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        pinCode: address.pinCode || '',
        latitude: lat,
        longitude: lng,
      },
    });
  }, [address, navigation]);

  // ── Derived display strings ───────────────────────────────────────────────
  const addressName = address
    ? (address.addressLine2 || address.addressLine1 || address.city || 'Selected Location')
    : '';
  const addressFull = address
    ? [address.addressLine1, address.addressLine2, address.city, address.state, address.pinCode]
      .filter(Boolean).join(', ')
    : '';

  const renderSearchItem = useCallback(({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.searchResultItem,
        index === searchResults.length - 1 && { borderBottomWidth: 0 },
      ]}
      onPress={() => onSearchResultPress(item)}
      activeOpacity={0.7}
    >
      <Icon name="location-on" size={16} color={Colors.primary} />
      <Text style={styles.searchResultText} numberOfLines={2}>
        {item.displayName}
      </Text>
    </TouchableOpacity>
  ), [searchResults.length, onSearchResultPress]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Map ─────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <MapLibreGL.MapView
          style={StyleSheet.absoluteFillObject}
          styleJSON={MAP_STYLE_JSON}
          onRegionDidChange={onRegionDidChange}
          compassEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapLibreGL.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: initialCoords || DEFAULT_COORDS,
              zoomLevel: 15,
            }}
          />
        </MapLibreGL.MapView>

        {/* Fixed pin — paddingBottom offsets icon so TIP sits at centre */}
        <View style={styles.pinContainer} pointerEvents="none">
          <Icon name="location-on" size={48} color={Colors.primary} />
        </View>

        <TouchableOpacity
          style={styles.currentLocationBtn}
          onPress={handleCurrentLocation}
          activeOpacity={0.75}
        >
          <Icon name="my-location" size={18} color={Colors.primary} />
          <Text style={styles.currentLocationText}>Current location</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Sheet ─────────────────────────────────────── */}
      <View style={styles.bottomSheet}>
        <Text style={styles.bottomHint}>Place the pin at exact delivery location</Text>

        <View style={styles.addressRow}>
          {isReversing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Finding address...</Text>
            </View>
          ) : address ? (
            <>
              <Icon name="location-on" size={22} color={Colors.primary} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressName} numberOfLines={1}>{addressName}</Text>
                <Text style={styles.addressFull} numberOfLines={2}>{addressFull}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.addressPlaceholder}>Move the map to find your location</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, (isReversing || !address) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={isReversing || !address}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm & proceed</Text>
        </TouchableOpacity>
      </View>

      {/* ── Top Bar (absolute, renders above map) ───────────── */}
      <View style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Icon name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          {searchLoading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Icon name="search" size={18} color={Colors.textLight} />
          }
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search an address"
            placeholderTextColor={Colors.textLight}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={{ padding: 4 }}>
              <Icon name="close" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Search Results ───────────────────────────────────── */}
      {showResults && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderSearchItem}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

export default LocationPickerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  mapContainer: { height: MAP_HEIGHT, overflow: 'hidden' },

  pinContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 48,
  },

  currentLocationBtn: {
    position: 'absolute',
    right: 16, bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  currentLocationText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  bottomSheet: {
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  bottomHint: {
    fontSize: 11,
    color: Colors.textLight,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
    minHeight: 44,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  loadingText: { fontSize: 13, color: Colors.textLight },
  addressName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  addressFull: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  addressPlaceholder: {
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic',
    flex: 1,
    paddingTop: 10,
    textAlign: 'center',
  },

  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 0 },

  searchResultsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 112 : 74,
    left: 12, right: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    zIndex: 30,
    elevation: 10,
    maxHeight: 240,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchResultText: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
});