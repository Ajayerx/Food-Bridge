import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,

      addItem: (dish, restaurantId, restaurantName) => {
        const dishId = dish.id || dish._id;
        const currentRestaurantId = get().restaurantId;

        if (currentRestaurantId && currentRestaurantId !== restaurantId && get().items.length > 0) {
          return 'CONFLICT';
        }

        // ✅ FIX: toLowerCase() handles API returning 'Veg', 'Vegan', 'NonVeg' (PascalCase)
        const tag = dish.dietary_tag?.toLowerCase();
        const cartItem = {
          id: dishId,
          name: dish.name,
          price: dish.base_price ?? dish.price ?? 0,
          image: dish.image_url ?? dish.image ?? null,
          isVeg: tag
            ? (tag === 'veg' || tag === 'vegan')
            : (dish.isVeg ?? false),
          quantity: 1,
        };

        set(state => {
          const existingItem = state.items.find(i => i.id === dishId);

          if (existingItem) {
            return {
              items: state.items.map(i =>
                i.id === dishId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }

          return {
            items: [...state.items, cartItem],
            restaurantId,
            restaurantName,
          };
        });

        return 'ADDED';
      },

      replaceCartAndAdd: (dish, restaurantId, restaurantName) => {
        const dishId = dish.id || dish._id;

        // ✅ FIX: same toLowerCase() fix here
        const tag = dish.dietary_tag?.toLowerCase();
        set({
          items: [{
            id: dishId,
            name: dish.name,
            price: dish.base_price ?? dish.price ?? 0,
            image: dish.image_url ?? dish.image ?? null,
            isVeg: tag
              ? (tag === 'veg' || tag === 'vegan')
              : (dish.isVeg ?? false),
            quantity: 1,
          }],
          restaurantId,
          restaurantName,
        });
      },

      removeItem: dishId => {
        const updated = get()
          .items.map(i => i.id === dishId ? { ...i, quantity: i.quantity - 1 } : i)
          .filter(i => i.quantity > 0);

        set({
          items: updated,
          restaurantId: updated.length === 0 ? null : get().restaurantId,
          restaurantName: updated.length === 0 ? null : get().restaurantName,
        });
      },

      updateQuantity: (dishId, quantity) => {
        if (quantity <= 0) { get().removeItem(dishId); return; }
        set(state => ({
          items: state.items.map(i => i.id === dishId ? { ...i, quantity } : i),
        }));
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

      getQuantityForItem: dishId => {
        const item = get().items.find(i => i.id === dishId);
        return item ? item.quantity : 0;
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      hasItem: dishId => get().items.some(i => i.id === dishId),
    }),
    {
      name: 'foodapp-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);