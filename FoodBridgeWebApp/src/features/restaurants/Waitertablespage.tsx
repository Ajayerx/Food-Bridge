// =============================================================================
// WaiterTablesPage.tsx
// Route: /waiter/tables
// Add to your router:  <Route path="/waiter/tables" element={<WaiterTablesPage />} />
// =============================================================================

import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  Col,
  Row,
  Tag,
  Button,
  Typography,
  Spin,
  Modal,
  Input,
  Avatar,
  Space,
  Divider,
  Badge,
  Empty,
  notification,
  Statistic,
} from "antd";
import {
  TableOutlined,
  PlusOutlined,
  MinusOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantService } from "../../services/restaurant.service";
import { orderService } from "../../services/order.service";
import { useRestaurant } from "../../hooks/useRestaurant";
import { menuService } from "../../services/menu.service";
import { tableService } from "../../services/table.service";
import { useMenu } from "../../hooks/useMenu";
import { useTable } from "../../hooks/useTable";

const { Text, Title } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableRow {
  id: string;
  table_name: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
  qr_code_url?: string | null;
}

interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

interface MenuItem {
  id: string;
  name: string;
  base_price: number;
  image_url?: string;
  is_available: boolean;
  variants?: { id: string; name: string; price: number }[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  available: {
    color: "#52c41a",
    bg: "#f6ffed",
    border: "#b7eb8f",
    label: "Available",
  },
  reserved: {
    color: "#fa8c16",
    bg: "#fff7e6",
    border: "#ffd591",
    label: "Reserved",
  },
  occupied: {
    color: "#ff4d4f",
    bg: "#fff1f0",
    border: "#ffa39e",
    label: "Occupied",
  },
};

// ─── Take Order Modal ─────────────────────────────────────────────────────────

const TakeOrderModal: React.FC<{
  table: TableRow;
  restaurantId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ table, restaurantId, open, onClose, onSuccess }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [notifApi, ctxHolder] = notification.useNotification();

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ["menu-for-waiter", restaurantId],
    enabled: !!restaurantId && open,

    queryFn: async () => {
      const res = await menuService.getItems(restaurantId);
      const items: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return items
        .filter((m: any) => m.is_available !== false)
        .map((m: any) => ({
          ...m,
          variants: Array.isArray(m.variants) ? m.variants : [],
        }));
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const items: MenuItem[] = menuData ?? [];
    if (!search.trim()) return items;
    return items.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [menuData, search]);

  const cartQty = useCallback(
    (menuItemId: string, variantId?: string) =>
      cart.find((c) => c.menuItemId === menuItemId && c.variantId === variantId)
        ?.quantity ?? 0,
    [cart],
  );

  const addItem = (
    item: MenuItem,
    variantId?: string,
    variantName?: string,
    price?: number,
  ) => {
    const unitPrice = price ?? item.base_price;
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.menuItemId === item.id && c.variantId === variantId,
      );
      if (existing)
        return prev.map((c) =>
          c.menuItemId === item.id && c.variantId === variantId
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice,
          quantity: 1,
          variantId,
          variantName,
        },
      ];
    });
  };

  const changeQty = (
    menuItemId: string,
    variantId: string | undefined,
    delta: number,
  ) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItemId === menuItemId && c.variantId === variantId
            ? { ...c, quantity: c.quantity + delta }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  // In TakeOrderModal, replace the placeOrder mutation with this:

  const placeOrder = useMutation({
    mutationFn: async () => {
      // Step 1: Create the order
      const orderRes = await orderService.createOrder({
        restaurant_id: restaurantId,
        order_type: "dinein",
        table_id: table.id,
        items: cart.map((c) => ({
          menu_item_id: c.menuItemId,
          quantity: c.quantity,
          ...(c.variantId ? { variant_id: c.variantId } : {}),
        })),
        payment_method: "cod",
      });

      // Step 2: Mark table as occupied
      await tableService.updateTable(restaurantId, table.id, {
        tableNumber: table.table_name,
        capacity: table.capacity,
        status: "Occupied",
      });
      return orderRes;
    },
    onSuccess: () => {
      notifApi.success({
        message: "Order placed",
        description: `Order created for ${table.table_name}`,
        placement: "topRight",
        duration: 3,
      });
      setCart([]);
      setSearch("");
      onSuccess();
    },
    onError: (e: any) =>
      notifApi.error({
        message: "Failed to place order",
        description: e?.response?.data?.error?.message ?? "Error",
        placement: "topRight",
      }),
  });

  return (
    <>
      {ctxHolder}
      <Modal
        open={open}
        onCancel={() => {
          setCart([]);
          setSearch("");
          onClose();
        }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TableOutlined style={{ color: "#1677ff" }} />
            <span>Take Order — {table.table_name}</span>
            <Tag color="geekblue" style={{ fontSize: 11 }}>
              {table.capacity} seats
            </Tag>
          </div>
        }
        width={640}
        footer={null}
        destroyOnClose
      >
        <Row gutter={16} style={{ minHeight: 420 }}>
          {/* Menu list */}
          <Col
            span={14}
            style={{ borderRight: "1px solid #f0f0f0", paddingRight: 12 }}
          >
            <Input
              placeholder="Search menu items…"
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size="small"
              style={{ marginBottom: 10 }}
            />
            {menuLoading ? (
              <div style={{ textAlign: "center", padding: 32 }}>
                <Spin />
              </div>
            ) : filtered.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No items"
              />
            ) : (
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {filtered.map((item) => {
                  const hasVariants = item.variants && item.variants.length > 0;
                  const isExpanded = expandedItem === item.id;
                  return (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        marginBottom: 6,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 10px",
                          background: "#fff",
                        }}
                      >
                        <Avatar
                          size={32}
                          src={item.image_url}
                          style={{
                            background: "#f0f5ff",
                            color: "#1677ff",
                            flexShrink: 0,
                          }}
                        >
                          {item.name[0]}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            strong
                            style={{ fontSize: 12, display: "block" }}
                            ellipsis
                          >
                            {item.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ₹{item.base_price}
                          </Text>
                        </div>
                        {hasVariants ? (
                          <Button
                            size="small"
                            type={isExpanded ? "primary" : "default"}
                            onClick={() =>
                              setExpandedItem(isExpanded ? null : item.id)
                            }
                            style={{ fontSize: 11, padding: "0 8px" }}
                          >
                            {isExpanded ? "Hide" : "Variants"}
                          </Button>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {cartQty(item.id, undefined) > 0 ? (
                              <>
                                <Button
                                  size="small"
                                  icon={<MinusOutlined />}
                                  onClick={() =>
                                    changeQty(item.id, undefined, -1)
                                  }
                                  style={{ padding: "0 6px" }}
                                />
                                <Text
                                  strong
                                  style={{
                                    minWidth: 16,
                                    textAlign: "center",
                                    fontSize: 13,
                                  }}
                                >
                                  {cartQty(item.id, undefined)}
                                </Text>
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  onClick={() =>
                                    changeQty(item.id, undefined, 1)
                                  }
                                  style={{ padding: "0 6px" }}
                                />
                              </>
                            ) : (
                              <Button
                                size="small"
                                type="primary"
                                ghost
                                icon={<PlusOutlined />}
                                onClick={() => addItem(item)}
                                style={{ padding: "0 8px" }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      {hasVariants && isExpanded && (
                        <div
                          style={{
                            background: "#fafafa",
                            padding: "4px 10px 8px",
                          }}
                        >
                          {item.variants!.map((v) => (
                            <div
                              key={v.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "3px 0",
                              }}
                            >
                              <Text style={{ flex: 1, fontSize: 11 }}>
                                {v.name}
                              </Text>
                              <Text style={{ fontSize: 11, color: "#888" }}>
                                ₹{v.price}
                              </Text>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                {cartQty(item.id, v.id) > 0 ? (
                                  <>
                                    <Button
                                      size="small"
                                      icon={<MinusOutlined />}
                                      onClick={() =>
                                        changeQty(item.id, v.id, -1)
                                      }
                                      style={{ padding: "0 6px" }}
                                    />
                                    <Text
                                      strong
                                      style={{
                                        minWidth: 16,
                                        textAlign: "center",
                                        fontSize: 12,
                                      }}
                                    >
                                      {cartQty(item.id, v.id)}
                                    </Text>
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={<PlusOutlined />}
                                      onClick={() =>
                                        changeQty(item.id, v.id, 1)
                                      }
                                      style={{ padding: "0 6px" }}
                                    />
                                  </>
                                ) : (
                                  <Button
                                    size="small"
                                    type="primary"
                                    ghost
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      addItem(item, v.id, v.name, v.price)
                                    }
                                    style={{ padding: "0 8px" }}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Col>

          {/* Cart */}
          <Col span={10} style={{ paddingLeft: 12 }}>
            <Text
              strong
              style={{ display: "block", marginBottom: 8, fontSize: 13 }}
            >
              <ShoppingCartOutlined style={{ marginRight: 6 }} />
              Order ({cartCount} items)
            </Text>
            {cart.length === 0 ? (
              <div
                style={{
                  color: "#ccc",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 40,
                }}
              >
                Add items from the menu
              </div>
            ) : (
              <>
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {cart.map((c) => (
                    <div
                      key={`${c.menuItemId}-${c.variantId}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div>{c.name}</div>
                        {c.variantName && (
                          <div style={{ color: "#aaa", fontSize: 11 }}>
                            {c.variantName}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Button
                          size="small"
                          icon={<MinusOutlined />}
                          onClick={() =>
                            changeQty(c.menuItemId, c.variantId, -1)
                          }
                          style={{ padding: "0 4px" }}
                        />
                        <Text
                          strong
                          style={{ minWidth: 14, textAlign: "center" }}
                        >
                          {c.quantity}
                        </Text>
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() =>
                            changeQty(c.menuItemId, c.variantId, 1)
                          }
                          style={{ padding: "0 4px" }}
                        />
                      </div>
                      <Text
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ₹{(c.unitPrice * c.quantity).toLocaleString("en-IN")}
                      </Text>
                    </div>
                  ))}
                </div>
                <Divider style={{ margin: "8px 0" }} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text strong>Total</Text>
                  <Text strong>₹{cartTotal.toLocaleString("en-IN")}</Text>
                </div>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  style={{
                    width: "100%",
                    background: "#52c41a",
                    borderColor: "#52c41a",
                  }}
                  loading={placeOrder.isPending}
                  onClick={() => placeOrder.mutate()}
                >
                  Place Order
                </Button>
              </>
            )}
          </Col>
        </Row>
      </Modal>
    </>
  );
};

// ─── Add More Items Modal ─────────────────────────────────────────────────────

const AddMoreItemsModal: React.FC<{
  table: TableRow;
  orderId: string;
  restaurantId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ table, orderId, restaurantId, open, onClose, onSuccess }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [notifApi, ctxHolder] = notification.useNotification();

  const { data: menuData, isLoading } = useQuery({
    queryKey: ["menu-for-waiter", restaurantId],
    enabled: !!restaurantId && open,
    queryFn: async () => {
      const res = await menuService.getItems(restaurantId);
      const items: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return items.filter((m: any) => m.is_available !== false);
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const items: any[] = menuData ?? [];
    if (!search.trim()) return items;
    return items.filter((m: any) =>
      m.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [menuData, search]);

  const cartQty = (menuItemId: string) =>
    cart.find((c) => c.menuItemId === menuItemId)?.quantity ?? 0;

  const changeQty = (item: any, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        const updated = prev
          .map((c) =>
            c.menuItemId === item.id
              ? { ...c, quantity: c.quantity + delta }
              : c,
          )
          .filter((c) => c.quantity > 0);
        return updated;
      }
      if (delta > 0) {
        return [
          ...prev,
          {
            menuItemId: item.id,
            name: item.name,
            unitPrice: item.base_price,
            quantity: 1,
          },
        ];
      }
      return prev;
    });
  };

  const addItems = useMutation({
    mutationFn: () =>
      orderService.addItemsToOrder(orderId, {
        items: cart.map((c) => ({
          menu_item_id: c.menuItemId,
          quantity: c.quantity,
        })),
      }),
    onSuccess: (res) => {
      const data = res.data?.data;
      notifApi.success({
        message: "Items added to order",
        placement: "topRight",
        duration: 3,
      });
      if (data?.status_reverted) {
        notifApi.warning({
          message: "Order sent back to kitchen",
          description:
            "Status reverted to Accepted — kitchen will prepare the new items.",
          placement: "topRight",
          duration: 6,
        });
      }
      setCart([]);
      onSuccess();
    },
    onError: (e: any) =>
      notifApi.error({
        message: "Failed to add items",
        description: e?.response?.data?.error?.message ?? "Error",
        placement: "topRight",
      }),
  });

  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);

  return (
    <>
      {ctxHolder}
      <Modal
        open={open}
        onCancel={() => {
          setCart([]);
          setSearch("");
          onClose();
        }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusOutlined style={{ color: "#52c41a" }} />
            <span>Add More Items — {table.table_name}</span>
          </div>
        }
        width={480}
        footer={null}
        destroyOnClose
      >
        <Input
          placeholder="Search menu…"
          prefix={<SearchOutlined style={{ color: "#bbb" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
          style={{ marginBottom: 10 }}
        />
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 12 }}>
            {filtered.map((item: any) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <Text style={{ flex: 1, fontSize: 12 }}>{item.name}</Text>
                <Text style={{ fontSize: 11, color: "#888" }}>
                  ₹{item.base_price}
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {cartQty(item.id) > 0 ? (
                    <>
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => changeQty(item, -1)}
                        style={{ padding: "0 6px" }}
                      />
                      <Text
                        strong
                        style={{
                          minWidth: 16,
                          textAlign: "center",
                          fontSize: 12,
                        }}
                      >
                        {cartQty(item.id)}
                      </Text>
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => changeQty(item, 1)}
                        style={{ padding: "0 6px" }}
                      />
                    </>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      icon={<PlusOutlined />}
                      onClick={() => changeQty(item, 1)}
                      style={{ padding: "0 8px" }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {cart.length > 0 && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text strong style={{ fontSize: 13 }}>
                {cart.reduce((s, c) => s + c.quantity, 0)} items added
              </Text>
              <Text strong>₹{cartTotal.toLocaleString("en-IN")}</Text>
            </div>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              style={{ width: "100%" }}
              loading={addItems.isPending}
              onClick={() => addItems.mutate()}
            >
              Add to Order
            </Button>
          </>
        )}
      </Modal>
    </>
  );
};

// ─── Table Card ───────────────────────────────────────────────────────────────

const TableCard: React.FC<{
  table: TableRow;
  activeOrder: any | null;
  restaurantId: string;
  onRefresh: () => void;
}> = ({ table, activeOrder, restaurantId, onRefresh }) => {
  const [takeOrderOpen, setTakeOrderOpen] = useState(false);
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const cfg = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.available;

  return (
    <>
      <Card
        size="small"
        style={{
          borderRadius: 12,
          border: `1.5px solid ${cfg.border}`,
          background: cfg.bg,
          minHeight: 160,
        }}
        styles={{ body: { padding: "14px 16px" } }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <div>
            <Text strong style={{ fontSize: 15 }}>
              {table.table_name}
            </Text>
            <div style={{ fontSize: 11, color: "#888" }}>
              {table.capacity} seats
            </div>
          </div>
          <Tag
            color={
              table.status === "available"
                ? "green"
                : table.status === "reserved"
                  ? "orange"
                  : "red"
            }
            style={{ borderRadius: 10, fontSize: 11 }}
          >
            {cfg.label}
          </Tag>
        </div>

        {/* Active order info */}
        {activeOrder && (
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              borderRadius: 8,
              padding: "6px 10px",
              marginBottom: 8,
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  fontWeight: 700,
                }}
              >
                #{String(activeOrder.order_code ?? activeOrder.id).slice(-6)}
              </Text>
              <Tag color="blue" style={{ fontSize: 10, borderRadius: 6 }}>
                {activeOrder.order_status}
              </Tag>
            </div>
            <div style={{ color: "#555", marginTop: 2 }}>
              ₹{Number(activeOrder.total_amount ?? 0).toLocaleString("en-IN")} ·{" "}
              {activeOrder.items?.length ?? 0} item
              {activeOrder.items?.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {table.status === "reserved" && !activeOrder && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              style={{
                width: "100%",
                background: "#52c41a",
                borderColor: "#52c41a",
              }}
              onClick={() => setTakeOrderOpen(true)}
            >
              Take Order
            </Button>
          )}
          {table.status === "occupied" &&
            activeOrder &&
            ["placed", "accepted", "preparing", "ready"].includes(
              activeOrder.order_status,
            ) && (
              <Button
                size="small"
                icon={<PlusOutlined />}
                style={{
                  width: "100%",
                  borderColor: "#1677ff",
                  color: "#1677ff",
                }}
                onClick={() => setAddMoreOpen(true)}
              >
                Add More Items
              </Button>
            )}
          {table.status === "available" && (
            <div
              style={{
                color: "#bbb",
                fontSize: 11,
                textAlign: "center",
                paddingTop: 4,
              }}
            >
              Waiting for manager to assign
            </div>
          )}
        </div>
      </Card>

      <TakeOrderModal
        table={table}
        restaurantId={restaurantId}
        open={takeOrderOpen}
        onClose={() => setTakeOrderOpen(false)}
        onSuccess={() => {
          setTakeOrderOpen(false);
          onRefresh();
        }}
      />

      {activeOrder && (
        <AddMoreItemsModal
          table={table}
          orderId={String(activeOrder.id)}
          restaurantId={restaurantId}
          open={addMoreOpen}
          onClose={() => setAddMoreOpen(false)}
          onSuccess={() => {
            setAddMoreOpen(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const WaiterTablesPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const qc = useQueryClient();

  const { tables: rawTables, isLoading: tablesLoading } = useTable();

  const tables: TableRow[] = rawTables.map((t) => ({
    id: t.id,
    table_name: t.table_number,
    capacity: t.capacity,
    status: (t.status === "Reserved"
      ? "reserved"
      : t.status === "Occupied"
        ? "occupied"
        : "available") as "available" | "occupied" | "reserved",
    qr_code_url: null,
  }));

  const { data: activeOrders = [] } = useQuery({
    queryKey: ["waiter-active-orders", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const res = await orderService.getRestaurantOrders(restaurantId, {
        limit: 100,
      });
      const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return raw.filter(
        (o: any) =>
          o.order_type === "dinein" &&
          !["completed", "cancelled"].includes(o.order_status),
      );
    },
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  // Map table_id → active order
  const orderByTable = useMemo(() => {
    const map: Record<string, any> = {};
    for (const o of activeOrders) {
      if (o.table_id) map[o.table_id] = o;
    }
    return map;
  }, [activeOrders]);

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["tables"] });
    qc.invalidateQueries({ queryKey: ["waiter-active-orders"] });
  }, [qc]);

  const available = tables.filter((t) => t.status === "available").length;
  const reserved = tables.filter((t) => t.status === "reserved").length;
  const occupied = tables.filter((t) => t.status === "occupied").length;

  if (tablesLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" tip="Loading tables…" />
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Tables
        </Title>
        <Button icon={<ReloadOutlined />} size="small" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          {
            label: "Available",
            value: available,
            color: "#52c41a",
            bg: "#f6ffed",
          },
          {
            label: "Reserved",
            value: reserved,
            color: "#fa8c16",
            bg: "#fff7e6",
          },
          {
            label: "Occupied",
            value: occupied,
            color: "#ff4d4f",
            bg: "#fff1f0",
          },
        ].map((s) => (
          <Col key={s.label} span={8}>
            <Card
              size="small"
              style={{ background: s.bg, border: "none", borderRadius: 10 }}
              styles={{ body: { padding: "10px 14px" } }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: 11, color: "#666" }}>{s.label}</span>
                }
                value={s.value}
                valueStyle={{ fontSize: 20, fontWeight: 700, color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Table grid */}
      {tables.length === 0 ? (
        <Empty
          description="No tables found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: 48 }}
        />
      ) : (
        <Row gutter={[12, 12]}>
          {tables.map((table) => (
            <Col key={table.id} xs={12} sm={8} md={6}>
              <TableCard
                table={table}
                activeOrder={orderByTable[table.id] ?? null}
                restaurantId={restaurantId}
                onRefresh={handleRefresh}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
