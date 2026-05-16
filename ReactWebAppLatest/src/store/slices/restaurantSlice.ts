import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Restaurant } from "types";

interface RestaurantState {
    all: Restaurant[];
    current: Restaurant | null;
    loading: boolean;
    togglingOpen: boolean;
    togglingActive: boolean;
}

const initialState: RestaurantState = {
    all: [],
    current: null,
    loading: false,
    togglingOpen: false,
    togglingActive: false,
};

function normaliseRestaurant(r: any): Restaurant {
    return {
        id: r.id,
        ownerId: r.owner_id ?? r.ownerId ?? "",
        name: r.name,
        description: r.description ?? null,
        address: r.address,
        city: r.city,
        latitude: r.latitude ?? null,
        longitude: r.longitude ?? null,
        phone: r.phone,
        email: r.email ?? null,
        logoUrl: r.logo_url ?? r.logoUrl ?? null,
        coverImageUrl: r.cover_image_url ?? r.coverImageUrl ?? null,
        isOpen: r.is_open === 1 || r.is_open === true || r.isOpen === true,
        isActive: r.is_active === 1 || r.is_active === true || r.isActive === true,
        status: r.status,
        rejectionReason: r.rejection_reason ?? r.rejectionReason ?? null,
        avgRating:
            r.average_rating != null ? Number(r.average_rating)
                : r.avg_rating != null ? Number(r.avg_rating)
                    : r.avgRating != null ? Number(r.avgRating)
                        : undefined,
        totalRatings:
            r.total_ratings != null ? Number(r.total_ratings)
                : r.totalRatings != null ? Number(r.totalRatings)
                    : undefined,
        createdAt: r.created_at ?? r.createdAt ?? "",
        updatedAt: r.updated_at ?? r.updatedAt ?? "",
    };
}

const restaurantSlice = createSlice({
    name: "restaurant",
    initialState,
    reducers: {
        setRestaurants(state, action: PayloadAction<any[]>) {
            const normalised = action.payload.map(normaliseRestaurant);
            state.all = normalised;
            if (!state.current && normalised.length > 0) {
                state.current = normalised.find((r) => r.status === "approved") ?? normalised[0];
            }
            state.loading = false;
        },

        switchRestaurant(state, action: PayloadAction<string>) {
            const found = state.all.find((r) => r.id === action.payload);
            if (found) state.current = found;
        },

        setRestaurantLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },

        setRestaurantIsOpen(state, action: PayloadAction<{ id: string; isOpen: boolean }>) {
            const { id, isOpen } = action.payload;
            const r = state.all.find((r) => r.id === id);
            if (r) r.isOpen = isOpen;
            if (state.current?.id === id) state.current.isOpen = isOpen;
        },

        setTogglingOpen(state, action: PayloadAction<boolean>) {
            state.togglingOpen = action.payload;
        },

        setRestaurantIsActive(state, action: PayloadAction<{ id: string; isActive: boolean }>) {
            const { id, isActive } = action.payload;
            const r = state.all.find((r) => r.id === id);
            if (r) r.isActive = isActive;
            if (state.current?.id === id) state.current.isActive = isActive;
        },

        setTogglingActive(state, action: PayloadAction<boolean>) {
            state.togglingActive = action.payload;
        },

        clearRestaurant(state) {
            state.all = [];
            state.current = null;
            state.loading = false;
            state.togglingOpen = false;
            state.togglingActive = false;
        },
    },
});

export const {
    setRestaurants,
    switchRestaurant,
    setRestaurantLoading,
    setRestaurantIsOpen,
    setTogglingOpen,
    setRestaurantIsActive,
    setTogglingActive,
    clearRestaurant,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;