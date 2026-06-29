// constants/config.js

export const USE_MOCK = false;

// Android Emulator: 10.0.2.2 = your PC's localhost
// iOS Simulator / Physical device: use your PC's LAN IP e.g. 192.168.1.8
//export const BASE_URL = "http://10.0.2.2:5196/v1";
export const BASE_URL = "https://footbridgeapi.alphavisionlabs.com/v1";
export const APP_CONFIG = {
  APP_NAME: 'FoodApp',
  VERSION: '1.0.0',
  DEFAULT_CITY: 'Indore',
  CURRENCY_SYMBOL: '₹',
  OTP_LENGTH: 6,
  OTP_RESEND_SECONDS: 30,
  CART_MAX_QUANTITY: 10,
  FREE_DELIVERY_THRESHOLD: 299,
  GST_RATE: 0.05,
  PLATFORM_FEE: 5,
};