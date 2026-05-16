import api from "../api/base";

// GET /restaurants — supports filters: cuisine, dietary, is_open, sort_by, page, limit
// Also used for search: pass { q: query } in filters
export const getRestaurants = async (filters = {}) => {
  const res = await api.get("/restaurants", { params: filters });
  return res.data.data; // backend: { success, data: [...], meta: {} }
};

// GET /restaurants/:id
export const getRestaurantById = async (id) => {
  const res = await api.get(`/restaurants/${id}`);
  return res.data.data;
};

// GET /restaurants/:id/menu
// OLD path was: /menu/:id  ← FIXED
// Returns: { categories: [], items: [], variants: [], modifiers: [] }
export const getMenuByRestaurantId = async (id) => {
  const res = await api.get(`/restaurants/${id}/menu`);
  return res.data.data;
};

// Search uses the same GET /restaurants endpoint with a `q` param
export const searchRestaurants = async (query) => {
  const res = await api.get("/restaurants/search", { params: { q: query, page: 1, pageSize: 20 } });
  return res.data.data;
};