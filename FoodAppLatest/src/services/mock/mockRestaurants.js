import restaurants from '../../data/restaurants.json';

export const getRestaurants = (filters = {}) => {
  let list = [...restaurants.restaurants];
  
  if (filters.isVeg) list = list.filter(r => r.isVeg);
  if (filters.rating) list = list.filter(r => r.rating >= filters.rating);
  if (filters.cuisine) list = list.filter(r => r.cuisines.includes(filters.cuisine));
  if (filters.maxDeliveryFee) list = list.filter(r => r.deliveryFee <= filters.maxDeliveryFee);
  if (filters.query) {
    const q = filters.query.toLowerCase();
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cuisines.some(c => c.toLowerCase().includes(q))
    );
  }
  
  if (filters.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  else if (filters.sort === 'delivery_time') list.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
  
  return Promise.resolve({data: list, total: list.length});
};

export const getRestaurantById = (id) => {
  const r = restaurants.restaurants.find(r => r.id === id);
  if (!r) return Promise.reject(new Error('Restaurant not found'));
  return Promise.resolve({data: r});
};
