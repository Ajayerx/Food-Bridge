import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAddressStore } from "../../store/addressStore";
import { Colors } from "../../constants/colors";
import {
  reverseGeocode,
  searchAddress,
  searchCities,
  searchByPincode,
  geocodeAddress,
} from "../../services/geocodingService";
import {
  ADDRESS_VALIDATION,
  ADDRESS_ERRORS,
  LOCATION_ERRORS,
  SEARCH_MESSAGES,
  LOCATION_CONFIRM,
  GEOCODING_ERRORS,
} from "../../constants/messages";
import { INDIAN_STATES } from "../../constants/indianStates";

const LABEL_OPTIONS = ["Home", "Work", "Other"];

export const EditAddressScreen = ({ route, navigation }) => {
  const { address } = route.params;
  const updateAddress = useAddressStore(s => s.updateAddress);
  const scrollRef = useRef(null);
  const debounceRef = useRef(null);
  const cancelRef = useRef(null);
  const stateBlurTimeout = useRef(null);
  const cityBlurTimeout = useRef(null);
  const cityDebounceRef = useRef(null);
  const cityCancelRef = useRef(null);
  const pincodeDebounceRef = useRef(null);
  const pincodeCancelRef = useRef(null);
  const pincodeQueryRef = useRef('');

  const [label, setLabel] = useState(address.label || "Home");
  const [customLabel, setCustomLabel] = useState(
    !["Home", "Work"].includes(address.label) ? address.label : ""
  );
  const [addressLine1, setAddressLine1] = useState(address.address_line1 || "");
  const [addressLine2, setAddressLine2] = useState(address.address_line2 || "");
  const [city, setCity] = useState(address.city || "");
  const [state, setState] = useState(address.state || "");
  const [pinCode, setPinCode] = useState(address.pin_code ?? "");
  const [latitude, setLatitude] = useState(address.latitude ?? 0);
  const [longitude, setLongitude] = useState(address.longitude ?? 0);
  const [isDefault, setIsDefault] = useState(address.is_default ?? false);

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState(null);

  const [errors, setErrors] = useState({});
  const [highlightedFields, setHighlightedFields] = useState({});

  const hasExistingLocation = latitude !== 0 && longitude !== 0;

  const getLabelValue = () => {
    if (label === "Other") return customLabel.trim() || "";
    return label;
  };

  const flashHighlight = (field) => {
    setHighlightedFields(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setHighlightedFields(prev => ({ ...prev, [field]: false }));
    }, 1500);
  };

  const populateFields = useCallback((data) => {
    if (data.addressLine1) { setAddressLine1(data.addressLine1); flashHighlight("addressLine1"); }
    if (data.addressLine2) { setAddressLine2(data.addressLine2); flashHighlight("addressLine2"); }
    if (data.city) { setCity(data.city); flashHighlight("city"); }
    if (data.state) { setState(data.state); flashHighlight("state"); }
    if (data.pinCode) { setPinCode(data.pinCode); flashHighlight("pinCode"); }
    if (data.latitude && data.longitude) {
      setLatitude(data.latitude);
      setLongitude(data.longitude);
    }
  }, []);

  const withLocationConfirm = (applyFn) => {
    if (hasExistingLocation) {
      Alert.alert(LOCATION_CONFIRM.TITLE, LOCATION_CONFIRM.MESSAGE, [
        { text: LOCATION_CONFIRM.CANCEL, style: "cancel" },
        {
          text: LOCATION_CONFIRM.REPLACE,
          onPress: () => applyFn(),
        },
      ]);
    } else {
      applyFn();
    }
  };

  const handleUseCurrentLocation = () => {
    withLocationConfirm(async () => {
      setGpsLoading(true);
      setGpsError(null);

      const Geolocation = require("react-native-geolocation-service").default;

      const getPosition = () => {
        Geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: lat, longitude: lon } = position.coords;
            try {
              const data = await reverseGeocode(lat, lon);
              populateFields(data);
            } catch (err) {
              setGpsError(err instanceof Error ? err.message : LOCATION_ERRORS.TIMEOUT);
            } finally {
              setGpsLoading(false);
            }
          },
          (error) => {
            if (error.code === 1) setGpsError(LOCATION_ERRORS.PERMISSION_DENIED);
            else if (error.code === 2) setGpsError(LOCATION_ERRORS.POSITION_UNAVAILABLE);
            else setGpsError(LOCATION_ERRORS.TIMEOUT);
            setGpsLoading(false);
          },
          { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
        );
      };

      if (Platform.OS === "ios") {
        Geolocation.requestAuthorization(
          "whenInUse",
          (status) => {
            if (status === "granted") {
              getPosition();
            } else {
              setGpsError(LOCATION_ERRORS.PERMISSION_DENIED);
              setGpsLoading(false);
            }
          },
        );
      } else {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            getPosition();
          } else {
            setGpsError(LOCATION_ERRORS.PERMISSION_DENIED);
            setGpsLoading(false);
          }
        } catch (err) {
          setGpsError(LOCATION_ERRORS.PERMISSION_DENIED);
          setGpsLoading(false);
        }
      }
    });
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setSearchError(null);

    if (cancelRef.current) cancelRef.current();
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [promise, cancel] = searchAddress(text);
        cancelRef.current = cancel;
        const results = await promise;
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        if (results.length === 0) {
          setSearchError(SEARCH_MESSAGES.NO_RESULTS);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setSearchError(SEARCH_MESSAGES.SEARCH_FAILED);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const selectSuggestion = (item) => {
    withLocationConfirm(() => {
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPinCode('');
      setLatitude(0);
      setLongitude(0);
      setPincodeError(null);
      setErrors({});
      populateFields(item);
      setShowSuggestions(false);
      setSearchQuery('');
      setSuggestions([]);

      if ((!item.pinCode) && item.latitude && item.longitude && item.latitude !== 0 && item.longitude !== 0) {
        reverseGeocode(item.latitude, item.longitude).then(rev => {
          if (rev && rev.pinCode) {
            setPinCode(rev.pinCode);
            flashHighlight('pinCode');
          }
        }).catch(() => {});
      }
    });
  };

  const validate = () => {
    const newErrors = {};
    const labelVal = getLabelValue();
    if (!labelVal) newErrors.label = ADDRESS_VALIDATION.LABEL_REQUIRED;
    if (!addressLine1.trim()) newErrors.addressLine1 = ADDRESS_VALIDATION.ADDRESS_LINE1_REQUIRED;
    if (!city.trim()) newErrors.city = ADDRESS_VALIDATION.CITY_REQUIRED;
    if (!state.trim()) newErrors.state = ADDRESS_VALIDATION.STATE_REQUIRED;
    if (!pinCode.trim()) {
      newErrors.pinCode = ADDRESS_VALIDATION.PIN_CODE_REQUIRED;
    } else if (!/^[1-9][0-9]{5}$/.test(pinCode.trim())) {
      newErrors.pinCode = ADDRESS_VALIDATION.PIN_CODE_INVALID;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setLoading(true);

    let resolvedLat = latitude;
    let resolvedLng = longitude;

    // If coordinates are still 0, try to geocode from address fields before submitting
    if (resolvedLat === 0 || resolvedLng === 0) {
      const query = [addressLine2, city, state, pinCode]
        .filter(Boolean)
        .join(', ');

      try {
        const coords = await geocodeAddress(query);
        if (coords && coords.latitude !== 0 && coords.longitude !== 0) {
          resolvedLat = coords.latitude;
          resolvedLng = coords.longitude;
          setLatitude(resolvedLat);
          setLongitude(resolvedLng);
        }
      } catch {
        // silently ignore — submit with 0 and let backend decide
      }
    }

    try {
      await updateAddress(address.id, {
        label: getLabelValue(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || null,
        city: city.trim(),
        state: state.trim(),
        pin_code: pinCode.trim(),
        latitude: resolvedLat,
        longitude: resolvedLng,
        is_default: isDefault,
      });
      navigation.goBack();
    } catch (err) {
      const responseData = err?.response?.data;
      if (responseData?.errors) {
        const serverErrors = {};
        const keyMap = {
          label: "label",
          addressLine1: "addressLine1",
          city: "city",
          state: "state",
          pinCode: "pinCode",
          latitude: "coordinates",
          longitude: "coordinates",
        };
        for (const [key, msg] of Object.entries(responseData.errors)) {
          const mappedKey = keyMap[key] || key;
          serverErrors[mappedKey] = msg;
        }
        setErrors(serverErrors);
      } else {
        Alert.alert("Error", ADDRESS_ERRORS.SAVE_FAILED);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle prefillData when returning from LocationPickerScreen
  const prefillData = route?.params?.prefillData;

  useEffect(() => {
    if (!prefillData) return;
    if (prefillData.addressLine1) setAddressLine1(prefillData.addressLine1);
    if (prefillData.addressLine2) setAddressLine2(prefillData.addressLine2);
    if (prefillData.city) setCity(prefillData.city);
    if (prefillData.state) setState(prefillData.state);
    if (prefillData.pinCode) setPinCode(prefillData.pinCode);
    if (prefillData.latitude && prefillData.longitude) {
      setLatitude(prefillData.latitude);
      setLongitude(prefillData.longitude);
    }
  }, [prefillData]);

  const handlePickOnMap = () => {
    withLocationConfirm(() => {
      navigation.navigate("LocationPickerScreen", {
        initialCoords: latitude && longitude ? [longitude, latitude] : undefined,
        initialAddress: addressLine1 ? { addressLine1, addressLine2, city, state, pinCode } : undefined,
        source: "EditAddressScreen",
      });
    });
  };

  const clearSearch = () => {
    if (cancelRef.current) cancelRef.current();
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back-ios" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Address</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* GPS & Search */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleUseCurrentLocation}
          disabled={gpsLoading}
          activeOpacity={0.75}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Icon name="my-location" size={20} color={Colors.primary} />
          )}
          <Text style={styles.gpsBtnText}>
            {gpsLoading ? "Getting location..." : "Use Current Location"}
          </Text>
        </TouchableOpacity>
        {gpsError && <Text style={styles.errorText}>{gpsError}</Text>}

        {latitude === 0 && longitude === 0 && (
          <View style={styles.coordHint}>
            <Icon name="info" size={16} color="#1565C0" />
            <Text style={styles.coordHintText}>
              Tap 'Use Current Location' above to set your exact location for better delivery accuracy
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.pickOnMapBtn}
          onPress={handlePickOnMap}
          activeOpacity={0.75}
        >
          <Icon name="map" size={16} color={Colors.primary} />
          <Text style={styles.pickOnMapText}>Pick location on map</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          {searchLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Icon name="search" size={20} color={Colors.textLight} />
          )}
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search address..."
            placeholderTextColor={Colors.textLight}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Icon name="close" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        {searchError && !showSuggestions && (
          <Text style={styles.errorText}>{searchError}</Text>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionContainer}>
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionItem, index < suggestions.length - 1 && styles.suggestionBorder]}
                onPress={() => selectSuggestion(item)}
                activeOpacity={0.7}
              >
                <Icon name="location-on" size={18} color={Colors.textLight} />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.displayName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Label Selector */}
        <Text style={styles.sectionLabel}>Address Type</Text>
        <View style={styles.labelRow}>
          {LABEL_OPTIONS.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.labelBtn, label === type && styles.labelBtnActive]}
              onPress={() => setLabel(type)}
              activeOpacity={0.75}
            >
              <Icon
                name={type === "Home" ? "home" : type === "Work" ? "work" : "location-on"}
                size={15}
                color={label === type ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.labelBtnText, label === type && styles.labelBtnTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {label === "Other" && (
          <TextInput
            style={[styles.input, errors.label ? styles.inputError : null]}
            value={customLabel}
            onChangeText={setCustomLabel}
            placeholder="e.g. Hostel, Warehouse, Friend's place"
            placeholderTextColor={Colors.textLight}
          />
        )}
        {errors.label && <Text style={styles.fieldError}>{errors.label}</Text>}

        {/* Address Line 1 */}
        <Text style={styles.inputLabel}>
          Address Line 1 <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            highlightedFields.addressLine1 ? styles.highlighted : null,
            errors.addressLine1 ? styles.inputError : null,
          ]}
          value={addressLine1}
          onChangeText={text => { setAddressLine1(text); setErrors(prev => ({ ...prev, addressLine1: null })); }}
          placeholder="House no / Street / Area"
          placeholderTextColor={Colors.textLight}
        />
        {errors.addressLine1 && <Text style={styles.fieldError}>{errors.addressLine1}</Text>}

        {/* Address Line 2 */}
        <Text style={styles.inputLabel}>
          Address Line 2 <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, highlightedFields.addressLine2 ? styles.highlighted : null]}
          value={addressLine2}
          onChangeText={setAddressLine2}
          placeholder="Landmark / Apartment"
          placeholderTextColor={Colors.textLight}
        />

        {/* State */}
        <Text style={styles.inputLabel}>
          State <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            highlightedFields.state ? styles.highlighted : null,
            errors.state ? styles.inputError : null,
          ]}
          value={state}
          onChangeText={text => {
            setState(text);
            setErrors(prev => ({ ...prev, state: null }));
            if (text.length >= 1) {
              const filtered = INDIAN_STATES.filter(s =>
                s.toLowerCase().includes(text.toLowerCase())
              );
              setStateSuggestions(filtered);
              setShowStateSuggestions(filtered.length > 0);
            } else {
              setStateSuggestions([]);
              setShowStateSuggestions(false);
            }
          }}
          onFocus={() => {
            if (state.length >= 1) {
              const filtered = INDIAN_STATES.filter(s =>
                s.toLowerCase().includes(state.toLowerCase())
              );
              setStateSuggestions(filtered);
              setShowStateSuggestions(filtered.length > 0);
            }
          }}
          onBlur={() => {
            stateBlurTimeout.current = setTimeout(() => {
              setShowStateSuggestions(false);
            }, 150);
          }}
          placeholder="e.g. Madhya Pradesh"
          placeholderTextColor={Colors.textLight}
        />
        {showStateSuggestions && stateSuggestions.length > 0 && (
          <View style={styles.suggestionContainer}>
            {stateSuggestions.map((item, index) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.suggestionItem,
                  index < stateSuggestions.length - 1 && styles.suggestionBorder,
                ]}
                onPress={() => {
                  clearTimeout(stateBlurTimeout.current);
                  setState(item);
                  setShowStateSuggestions(false);
                }}
                activeOpacity={0.7}
              >
                <Icon name="location-on" size={18} color={Colors.textLight} />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText}>{item}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.state && <Text style={styles.fieldError}>{errors.state}</Text>}

        {/* City & Pincode */}
        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>
              City <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                highlightedFields.city ? styles.highlighted : null,
                errors.city ? styles.inputError : null,
              ]}
              value={city}
              onChangeText={text => {
                setCity(text);
                setErrors(prev => ({ ...prev, city: null }));
                setShowCitySuggestions(false);
                if (cityCancelRef.current) cityCancelRef.current();
                if (text.length < 3) {
                  setCitySuggestions([]);
                  setCityLoading(false);
                  return;
                }
                clearTimeout(cityDebounceRef.current);
                cityDebounceRef.current = setTimeout(async () => {
                  setCityLoading(true);
                  try {
                    const [promise, cancel] = searchCities(text, state.trim() || null);
                    cityCancelRef.current = cancel;
                    const results = await promise;
                    setCitySuggestions(results);
                    setShowCitySuggestions(results.length > 0);
                  } catch (err) {
                    setCitySuggestions([]);
                    setShowCitySuggestions(false);
                  } finally {
                    setCityLoading(false);
                  }
                }, 400);
              }}
              onFocus={() => {
                if (city.length >= 3 && citySuggestions.length > 0) {
                  setShowCitySuggestions(true);
                }
              }}
              onBlur={() => {
                cityBlurTimeout.current = setTimeout(() => {
                  setShowCitySuggestions(false);
                }, 150);
              }}
              placeholder="City"
              placeholderTextColor={Colors.textLight}
            />
            {errors.city && <Text style={styles.fieldError}>{errors.city}</Text>}
            {showCitySuggestions && citySuggestions.length > 0 && (
              <View style={[styles.suggestionContainer, { marginTop: -8 }]}>
                {citySuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={item.cityName + item.stateName}
                    style={[
                      styles.suggestionItem,
                      index < citySuggestions.length - 1 && styles.suggestionBorder,
                    ]}
                    onPress={() => {
                      clearTimeout(cityBlurTimeout.current);
                      setCity(item.cityName);
                      setShowCitySuggestions(false);
                      if (!state && item.stateName) {
                        setState(item.stateName);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="location-on" size={18} color={Colors.textLight} />
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {item.cityName}
                        {item.stateName ? `, ${item.stateName}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {cityLoading && (
              <View style={[styles.suggestionContainer, { alignItems: 'center', paddingVertical: 12, marginTop: -8 }]}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
            {showCitySuggestions && !cityLoading && citySuggestions.length === 0 && city.length >= 3 && (
              <View style={[styles.suggestionContainer, { alignItems: 'center', paddingVertical: 12, marginTop: -8 }]}>
                <Text style={styles.suggestionText}>No results found</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>
              Pincode <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                highlightedFields.pinCode ? styles.highlighted : null,
                errors.pinCode ? styles.inputError : null,
                pincodeLoading && { borderColor: Colors.primary },
              ]}
              value={pinCode}
              onChangeText={text => {
                pincodeQueryRef.current = text;
                setPinCode(text);
                setErrors(prev => ({ ...prev, pinCode: null }));
                setPincodeError(null);
                if (pincodeCancelRef.current) pincodeCancelRef.current();
                clearTimeout(pincodeDebounceRef.current);
                if (text.length === 0) {
                  setPincodeLoading(false);
                  return;
                }
                if (/^[1-9][0-9]{5}$/.test(text)) {
                  setPincodeLoading(true);
                  const queryAtCall = text;
                  pincodeDebounceRef.current = setTimeout(async () => {
                    try {
                      const [promise, cancel] = searchByPincode(queryAtCall);
                      pincodeCancelRef.current = cancel;
                      const result = await promise;
                      if (pincodeQueryRef.current !== queryAtCall) return;
                      if (result) {
                        setAddressLine2(result.addressLine2);
                        setCity(result.city);
                        setState(result.state);
                        if (result.latitude && result.longitude && latitude === 0 && longitude === 0) {
                          setLatitude(result.latitude);
                          setLongitude(result.longitude);
                        }
                      } else {
                        setPincodeError('Could not find location for this pincode');
                      }
                    } catch (err) {
                      setPincodeError('Could not find location for this pincode');
                    } finally {
                      if (pincodeQueryRef.current === queryAtCall) setPincodeLoading(false);
                    }
                  }, 300);
                } else {
                  pincodeDebounceRef.current = setTimeout(() => {
                    setPincodeError(ADDRESS_VALIDATION.PIN_CODE_INVALID);
                  }, 300);
                }
              }}
              keyboardType="numeric"
              maxLength={6}
              placeholder="6-digit pincode"
              placeholderTextColor={Colors.textLight}
            />
            {pincodeLoading && (
              <View style={{ position: 'absolute', right: 14, top: 40 }}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
            {pincodeError && (
              <Text style={[styles.fieldError, { marginTop: 0, marginBottom: 8 }]}>{pincodeError}</Text>
            )}
            {errors.pinCode && <Text style={styles.fieldError}>{errors.pinCode}</Text>}
          </View>
        </View>

        {/* Set as Default */}
        <TouchableOpacity
          style={styles.defaultRow}
          onPress={() => setIsDefault(!isDefault)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
            {isDefault && <Icon name="check" size={14} color={Colors.white} />}
          </View>
          <View>
            <Text style={styles.defaultLabel}>Set as my default address</Text>
            <Text style={styles.defaultSub}>
              This will be selected automatically at checkout
            </Text>
          </View>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={save}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Icon name="check" size={18} color={Colors.white} />
              <Text style={styles.saveText}>Update Address</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // GPS
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  gpsBtnText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  pickOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: Colors.primaryLight,
  },
  pickOnMapText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: 0 },
  clearBtn: { padding: 4 },

  // Suggestions
  suggestionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionContent: { flex: 1 },
  suggestionText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  // Label
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  labelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  labelBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  labelBtnText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  labelBtnTextActive: { color: Colors.white },

  // Inputs
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  required: { color: Colors.error },
  optional: { color: Colors.textLight, fontWeight: "400" },
  input: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
    minHeight: 48,
  },
  inputError: { borderColor: Colors.error },
  highlighted: { borderColor: Colors.warning, backgroundColor: "#FFFDE7" },
  rowInputs: { flexDirection: "row", gap: 12 },

  // Default
  defaultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  defaultLabel: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  defaultSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },

  // Save
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    elevation: 3,
    minHeight: 52,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: Colors.white, fontWeight: "700", fontSize: 15 },

  // Coordinate hint
  coordHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  coordHintText: {
    flex: 1,
    fontSize: 12,
    color: "#1565C0",
    lineHeight: 17,
  },

  // Errors
  errorText: { color: Colors.error, fontSize: 12, marginBottom: 12, marginLeft: 4 },
  fieldError: { color: Colors.error, fontSize: 12, marginTop: -12, marginBottom: 12, marginLeft: 4 },
});
