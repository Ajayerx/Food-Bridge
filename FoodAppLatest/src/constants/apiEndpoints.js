// ─── API Endpoints — aligned with backend v1 routes ──────────────────────────
// Backend base: /v1  (set in services/api/base.js)

export const API_ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  // OLD: /auth/login  /auth/signup  → REMOVED (backend uses OTP flow only)
  REQUEST_OTP: '/auth/request-otp',          // POST  { mobile_number }
  VERIFY_OTP: '/auth/verify-otp',            // POST  { mobile_number, otp }
  REFRESH_TOKEN: '/auth/refresh',               // POST  { refresh_token }
  LOGOUT: '/auth/logout',                // POST  (auth required)

  // ── User / Me ──────────────────────────────────────────────────────────────
  // OLD: /user/profile  /user/addresses  → FIXED to /me  /me/addresses
  ME: '/me',                         // GET / PUT
  ME_ADDRESSES: '/me/addresses',               // GET / POST
  ME_ADDRESS_BY_ID: (id) => `/me/addresses/${id}`, // PUT / DELETE

  // ── Restaurants ────────────────────────────────────────────────────────────
  RESTAURANTS: '/restaurants',              // GET (supports ?q= for search)
  RESTAURANT_BY_ID: (id) => `/restaurants/${id}`,// GET
  // OLD: /menu/:id  → FIXED to /restaurants/:id/menu
  MENU_BY_RESTAURANT: (id) => `/restaurants/${id}/menu`, // GET

  // ── Orders ─────────────────────────────────────────────────────────────────
  ORDERS: '/orders',                     // GET / POST
  ORDER_BY_ID: (id) => `/orders/${id}`,       // GET
  // OLD: /orders/history → REMOVED (use GET /orders — same endpoint)
  CANCEL_ORDER: (id) => `/orders/${id}/cancel`,// POST { reason }

  // ── Coupons ────────────────────────────────────────────────────────────────
  // OLD: /coupons/apply  → FIXED to /coupons/validate
  VALIDATE_COUPON: '/coupons/validate',           // POST  { coupon_code, restaurant_id, order_total }

  // ── Payments ───────────────────────────────────────────────────────────────
  CREATE_PAYMENT: '/payments/create-razorpay-order', // POST { order_id }
  VERIFY_PAYMENT: '/payments/verify',                // POST { razorpay_* }
};