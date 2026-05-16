import { useQuery } from "@tanstack/react-query";
import {
  getRestaurants,
  getRestaurantById,
  getMenuByRestaurantId,
  searchRestaurants,
} from "../services/restaurant/restaurantService";

export const useRestaurants = (filters = {}) => {
  return useQuery({
    queryKey: ["restaurants", filters],
    queryFn: async () => {
      const params = { page: 1, pageSize: 20 };

      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;
      if (filters.veg) params.isPureVeg = true;
      if (filters.top_rated) params.minRating = 4.0;
      if (filters.fast) params.maxPrepTime = 30;
      if (filters.budget) params.maxCost = 150;
      if (filters.popular) params.popular = true;
      if (filters.new) params.isNew = true;

      const data = await getRestaurants(params);
      return data ?? [];
    },
    staleTime: 1000 * 30,
    placeholderData: [],
    retry: 2,
  });
};
export const useRestaurantDetail = (restaurantId) =>
  useQuery({
    queryKey: ["restaurantDetail", restaurantId],
    queryFn: () => getRestaurantById(restaurantId),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

// ✅ Fix in useRestaurantMenu — just return the array directly
export const useRestaurantMenu = (restaurantId) =>
  useQuery({
    queryKey: ["restaurantMenu", restaurantId],
    queryFn: async () => {
      const data = await getMenuByRestaurantId(restaurantId);
      return Array.isArray(data) ? data : [];  // ← return array directly
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

export const useSearchRestaurants = (query) =>
  useQuery({
    queryKey: ["searchRestaurants", query],

    queryFn: () => searchRestaurants(query),

    enabled: query.length > 1,

    staleTime: 1000 * 30,
  });