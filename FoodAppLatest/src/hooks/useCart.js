import { useCartStore } from '../store/cartStore';

export const useCart = () => {
  const items = useCartStore(state => state.items);
  const restaurantId = useCartStore(state => state.restaurantId);
  const restaurantName = useCartStore(state => state.restaurantName);

  const addItem = useCartStore(state => state.addItem);
  const replaceCartAndAdd = useCartStore(state => state.replaceCartAndAdd);
  const removeItem = useCartStore(state => state.removeItem);
  const clearCart = useCartStore(state => state.clearCart);

  // Correct quantity getter
  const getQuantityForItem = (dishId) => {
    const item = items.find(i => i.id === dishId);
    return item ? item.quantity : 0;
  };

  // Item count
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Correct subtotal
  const subtotal = items.reduce(
    (sum, i) => sum + (i.price * i.quantity),
    0
  );

  return {
    items,
    restaurantId,
    restaurantName,
    itemCount,
    subtotal,
    addItem,
    replaceCartAndAdd,
    removeItem,
    clearCart,
    getQuantityForItem,
  };
};