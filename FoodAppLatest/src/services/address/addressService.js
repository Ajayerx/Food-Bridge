import api from "../api/base";

// All .NET endpoints return { success, data: T }
// So res.data = { success, data: T } — we return res.data directly
// and the store reads .data from it

// GET /me/addresses → { success, data: CustomerAddressDto[] }
export const getAddresses = async () => {
    const res = await api.get("/me/addresses");
    return res.data;  // store reads res.data → { success, data: [...] }
};

// POST /me/addresses → { success, data: CustomerAddressDto }
export const addAddress = async (data) => {
    const res = await api.post("/me/addresses", data);
    return res.data;  // store reads res.data → { success, data: {...} }
};

// PUT /me/addresses/:id → { success, data: CustomerAddressDto }
export const updateAddress = async (id, data) => {
    const res = await api.put(`/me/addresses/${id}`, data);
    return res.data;
};

// DELETE /me/addresses/:id → { success, message }
export const deleteAddress = async (id) => {
    const res = await api.delete(`/me/addresses/${id}`);
    return res.data;
};

// PUT /me/addresses/:id/default → { success, data: CustomerAddressDto }
export const setDefaultAddress = async (id) => {
    const res = await api.put(`/me/addresses/${id}/default`);
    return res.data;
};