import ordersData from '../../data/orders.json';

export const getOrderHistory = () =>
  Promise.resolve({data: ordersData.orders});

export const getOrderById = (id) => {
  const order = ordersData.orders.find(o => o.id === id);
  return order
    ? Promise.resolve({data: order})
    : Promise.reject(new Error('Order not found'));
};

export const placeOrder = (orderData) => {
  const newOrder = {
    id: `ord_${Date.now()}`,
    ...orderData,
    status: 'Placed',
    orderDate: new Date().toISOString(),
    estimatedDelivery: '30-35 mins',
  };
  return Promise.resolve({data: newOrder});
};

export const getOffers = () => {
  return Promise.resolve({
    data: [
      {id: 'coupon_001', code: 'SAVE50', discount: 50, minOrder: 199, type: 'percent', maxDiscount: 100},
      {id: 'coupon_002', code: 'FLAT80', discount: 80, minOrder: 349, type: 'flat'},
      {id: 'coupon_003', code: 'FREEDEL', discount: 0, minOrder: 0, type: 'freeDelivery'},
      {id: 'coupon_004', code: 'WEEKEND30', discount: 30, minOrder: 199, type: 'percent', maxDiscount: 120},
    ]
  });
};
