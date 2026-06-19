import { useEffect, useCallback } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import {
    setRestaurants,
    setRestaurantLoading,
    switchRestaurant,
    setRestaurantIsOpen,
    setTogglingActive,
} from "../store/slices/restaurantSlice";
import { restaurantService } from "../services/restaurant.service";
import { useQueryClient } from "@tanstack/react-query";


export function useRestaurant() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const { user } = useAppSelector((s) => s.auth);
    const { all, current, loading, togglingActive } = useAppSelector((s) => s.restaurant);

    useEffect(() => {
        if (!user || (user.roleType !== "Vendor" && user.roleType !== "Staff")) return;
        if (all.length > 0 || loading) return;

        dispatch(setRestaurantLoading(true));
        restaurantService
            .getMyRestaurants()
            .then((res) => {
                const list = res.data.data ?? [];
                console.log("raw from API:", list);
                dispatch(setRestaurants(Array.isArray(list) ? list : [list]));
            })
            .catch(() => dispatch(setRestaurants([])));
    }, [user, all.length, dispatch]);


    const handleSwitch = useCallback(
        (id: string) => {

            queryClient.removeQueries({ queryKey: ["vendor-orders"] });
            queryClient.removeQueries({ queryKey: ["vendor-report"] });
            dispatch(switchRestaurant(id));
        },
        [dispatch, queryClient]
    );

    const handleToggleActive = useCallback(async () => {
        if (!current) return;
        dispatch(setTogglingActive(true));
        try {
            const res = await restaurantService.toggleActive(current.id);
            const newIsOpen = res.data.data.isOpen; // ✅ camelCase not snake_case
            dispatch(setRestaurantIsOpen({ id: current.id, isOpen: newIsOpen }));
        } catch {
        } finally {
            dispatch(setTogglingActive(false));
        }
    }, [current, dispatch]);

    return {
        restaurant: current,
        restaurants: all,
        loading,
        togglingOpen: togglingActive,   // alias — dashboard uses togglingOpen
        toggleOpen: handleToggleActive, // alias — dashboard uses toggleOpen
        switchRestaurant: handleSwitch,
    };
}