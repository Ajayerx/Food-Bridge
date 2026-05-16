import { create } from "zustand";
import {
    getAddresses,
    addAddress,
    updateAddress as updateAddressAPI,
    deleteAddress,
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

    fetchAddresses: async () => {
        set({ loading: true });
        try {
            // ✅ res = { success, data: CustomerAddressDto[] }
            const res = await getAddresses();
            const data = res?.data ?? [];          // ← was res.data directly ❌
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
        // ✅ res = { success, data: CustomerAddressDto }
        const res = await addAddress(address);
        const newAddress = res?.data;              // ← was res.data directly ❌
        if (!newAddress) {
            console.log("❌ Address not returned from API");
            return;
        }
        const updated = sortAddresses([...get().addresses, newAddress]);
        set({
            addresses: updated,
            selectedAddress: newAddress.is_default ? newAddress : get().selectedAddress,
        });
    },

    removeAddress: async (id) => {
        await deleteAddress(id);
        const updated = get().addresses.filter(a => a.id !== id);
        set({
            addresses: updated,
            selectedAddress: updated.find(a => a.is_default) || null,
        });
    },

    updateAddress: async (id, updatedData) => {
        try {
            // ✅ res = { success, data: CustomerAddressDto }
            const res = await updateAddressAPI(id, updatedData);
            const updated = res?.data;             // ← was res.data directly ❌
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

    makeDefault: async (id) => {
        const address = get().addresses.find(a => a.id === id);
        if (!address) return;

        try {
            await updateAddressAPI(id, {
                label: address.label,
                address_line1: address.address_line1,
                address_line2: address.address_line2 || undefined,
                city: address.city,
                state: address.state || '',
                // ✅ CustomerAddressDto.PinCode → pin_code
                pin_code: address.pin_code ?? '',   // ← was address.pincode ❌
                latitude: address.latitude ?? 0,
                longitude: address.longitude ?? 0,
                is_default: true,
            });

            const updated = get().addresses.map(a => ({
                ...a,
                is_default: a.id === id,
            }));
            const sorted = sortAddresses(updated);

            set({
                addresses: sorted,
                selectedAddress: sorted.find(a => a.is_default) || null,
            });
        } catch (error) {
            console.log("makeDefault error", error?.response?.data || error);
            throw error;
        }
    },

    setSelectedAddress: (address) => set({ selectedAddress: address }),
}));