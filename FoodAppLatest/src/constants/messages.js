export const GEOCODING_ERRORS = {
  NETWORK: 'No internet connection. Please check and try again.',
  TIMEOUT: 'Location search timed out. Please try again.',
  SERVICE_UNAVAILABLE: 'Location service is unavailable. Please try again.',
  COORDINATES_MISSING: 'Location coordinates are missing.',
};

export const LOCATION_ERRORS = {
  PERMISSION_DENIED: 'Location access denied. Enable it in device settings.',
  PERMANENT_DENIED: 'Location access denied. Enable it in device settings.',
  TIMEOUT: 'Taking too long to fetch location. Enter your address manually.',
  POSITION_UNAVAILABLE: 'GPS is turned off. Enable location services.',
};

export const ADDRESS_VALIDATION = {
  LABEL_REQUIRED: 'Please enter or select an address label.',
  ADDRESS_LINE1_REQUIRED: 'Street address is required.',
  CITY_REQUIRED: 'City is required.',
  STATE_REQUIRED: 'State is required.',
  PIN_CODE_REQUIRED: 'PIN code is required.',
  PIN_CODE_INVALID: 'Please enter a valid 6-digit Indian PIN code.',
  COORDINATES_REQUIRED: 'Location coordinates are missing. Please use current location or search.',
};

export const ADDRESS_ERRORS = {
  SAVE_FAILED: "Couldn't save your address. Check your connection and try again.",
  DELETE_FAILED: "Couldn't delete address. Please try again.",
  LOAD_FAILED: 'Failed to load addresses. Please try again.',
  DEFAULT_REMOVED: 'Default address removed. Please set a new one.',
  DEFAULT_FAILED: 'Failed to update default address.',
};

export const SEARCH_MESSAGES = {
  NO_RESULTS: 'No matching addresses found. Try a different search.',
  SEARCH_FAILED: 'Search failed. Check your connection.',
  MIN_CHARS: 'Type at least 3 characters to search.',
};

export const LOCATION_CONFIRM = {
  TITLE: 'Replace location?',
  MESSAGE: 'This will replace your current address details with the new location.',
  CANCEL: 'Cancel',
  REPLACE: 'Replace',
};

export const DELETE_CONFIRM = {
  TITLE: 'Delete address?',
  MESSAGE: 'Are you sure you want to delete this address?',
  DEFAULT_MESSAGE: 'This is your default address. Are you sure you want to delete it?',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
};

export const EMPTY_STATE = {
  TITLE: 'No saved addresses yet.',
  SUBTITLE: 'Add your home or work address for faster checkout',
  BUTTON: 'Add your first address',
};
