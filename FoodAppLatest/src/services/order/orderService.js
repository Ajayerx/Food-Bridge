import api from "../api/base";

// ✅ POST /v1/orders
// Returns full axios response so store can access res.data (= { success, data, message })
export const placeOrder = async (data) => {
  const res = await api.post("/orders", data);
  return res.data;   // { success: true, data: OrderDto, message: "Order placed successfully" }
};

// ✅ GET /v1/orders  — with optional filters
export const getOrders = async (params = {}) => {
  const res = await api.get("/orders", { params });
  return res.data;   // { success: true, data: [...OrderDto] }
};

// ✅ GET /v1/orders/:id
export const getOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;   // { success: true, data: OrderDto }
};

// ✅ POST /v1/orders/:id/cancel
// CancelOrderRequestDto: { Reason } → reason
export const cancelOrder = async (id, reason = '') => {
  const res = await api.post(`/orders/${id}/cancel`, { reason });
  return res.data;
};