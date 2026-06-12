import { create } from "zustand";
import {
    getAddresses,
    addAddress,
    updateAddress as updateAddressAPI,
    deleteAddress,
    setDefaultAddress,
} from "../services/address/addressService";

const LABEL_ORDER = { Home: 1, Work: 2, Other: 3 };

const sortAddresses = (addresses) => {
    return [...addresses].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return (LABEL_ORDER[a.label] ?? 99) - (LABEL_ORDER[b.label] ?? 99);
    });
};

export const useAddressStore = create((set, get) => ({
    addresses: [],
    selectedAddress: null,
    loading: false,
    loadingAddrs: {},

    fetchAddresses: async () => {
        set({ loading: true });
        try {
            const res = await getAddresses();
            const data = res?.data ?? [];
            const sorted = sortAddresses(data);
            const defaultAddress = sorted.find(a => a.is_default);
            set({
                addresses: sorted,
                selectedAddress: defaultAddress || null,
                loading: false,
            });
        } catch (error) {
            console.log("Address fetch error", error);
            set({ loading: false });
        }
    },

    addNewAddress: async (address) => {
        try {
            const res = await addAddress(address);
            const newAddress = res?.data;
            if (!newAddress) {
                console.log("Address not returned from API");
                return;
            }
            const updated = sortAddresses([...get().addresses, newAddress]);
            set({
                addresses: updated,
                selectedAddress: newAddress.is_default ? newAddress : get().selectedAddress,
            });
        } catch (error) {
            console.log("addNewAddress error", error);
            throw error;
        }
    },

    removeAddress: async (id) => {
        set(s => ({ loadingAddrs: { ...s.loadingAddrs, [id]: true } }));
        try {
            await deleteAddress(id);
            const updated = get().addresses.filter(a => a.id !== id);
            set(s => ({
                addresses: updated,
                selectedAddress: updated.find(a => a.is_default) || null,
                loadingAddrs: { ...s.loadingAddrs, [id]: undefined },
            }));
        } catch (error) {
            set(s => ({ loadingAddrs: { ...s.loadingAddrs, [id]: undefined } }));
            console.log("removeAddress error", error);
            throw error;
        }
    },

    updateAddress: async (id, updatedData) => {
        try {
            const res = await updateAddressAPI(id, updatedData);
            const updated = res?.data;
            if (!updated) return;
            set(state => ({
                addresses: sortAddresses(
                    state.addresses.map(addr => addr.id === id ? updated : addr)
                ),
            }));
        } catch (error) {
            console.log("Update address error", error);
            throw error;
        }
    },

    setDefault: async (id) => {
        set(s => ({ loadingAddrs: { ...s.loadingAddrs, [id]: true } }));
        try {
            const res = await setDefaultAddress(id);
            const updated = res?.data;
            if (updated) {
                set(s => ({
                    addresses: sortAddresses(
                        s.addresses.map(addr => addr.id === id ? updated : addr)
                    ),
                    selectedAddress: updated,
                    loadingAddrs: { ...s.loadingAddrs, [id]: undefined },
                }));
            } else {
                const mapped = get().addresses.map(a => ({
                    ...a,
                    is_default: a.id === id,
                }));
                const sorted = sortAddresses(mapped);
                set(s => ({
                    addresses: sorted,
                    selectedAddress: sorted.find(a => a.is_default) || null,
                    loadingAddrs: { ...s.loadingAddrs, [id]: undefined },
                }));
            }
        } catch (error) {
            set(s => ({ loadingAddrs: { ...s.loadingAddrs, [id]: undefined } }));
            console.log("setDefault error", error);
            throw error;
        }
    },

    setSelectedAddress: (address) => set({ selectedAddress: address }),
}));