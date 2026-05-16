import {create} from 'zustand';

export const useRestaurantStore = create((set, get) => ({
  restaurants: [],
  featuredRestaurants: [],
  currentRestaurant: null,
  currentMenu: null,
  searchResults: [],
  isLoading: false,
  error: null,

  // ── Set Data ──────────────────────────────────────────
  setRestaurants: restaurants => set({restaurants}),
  setFeatured: featured => set({featuredRestaurants: featured}),

  setCurrentRestaurant: restaurant =>
    set({currentRestaurant: restaurant}),

  setCurrentMenu: menu => set({currentMenu: menu}),

  setSearchResults: results => set({searchResults: results}),

  setLoading: isLoading => set({isLoading}),
  setError: error => set({error}),

  // ── Favourites ────────────────────────────────────────
  toggleFavourite: restaurantId =>
    set(state => ({
      restaurants: state.restaurants.map(r =>
        r.id === restaurantId
          ? {...r, isFavourite: !r.isFavourite}
          : r,
      ),
    })),

  // ── Selectors ─────────────────────────────────────────
  getFavourites: () =>
    get().restaurants.filter(r => r.isFavourite),

  getRestaurantById: id =>
    get().restaurants.find(r => r.id === id) ?? null,

  getFilteredRestaurants: filters => {
    let list = get().restaurants;
    if (filters?.isVeg) list = list.filter(r => r.isVeg);
    if (filters?.fastDelivery)
      list = list.filter(r => r.deliveryTime <= 30);
    if (filters?.topRated)
      list = list.filter(r => r.rating >= 4.0);
    if (filters?.freeDelivery)
      list = list.filter(r => r.deliveryFee === 0);
    return list;
  },
}));
