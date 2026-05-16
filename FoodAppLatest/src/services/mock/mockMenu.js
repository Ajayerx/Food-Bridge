import menus from '../../data/menus.json';

export const getMenu = (restaurantId) => {
  const menu = menus[restaurantId];
  if (!menu) return Promise.resolve({data: {categories: []}});
  return Promise.resolve({data: menu});
};
