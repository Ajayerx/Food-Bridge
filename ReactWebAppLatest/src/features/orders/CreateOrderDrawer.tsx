// ─────────────────────────────────────────────────────────────────────────────
// CreateOrderDrawer.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Drawer,
  Steps,
  Button,
  Input,
  Tag,
  Divider,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Empty,
  Badge,
  Radio,
  notification,
  Avatar,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  TableOutlined,
  CarOutlined,
  ShopOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  TagOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { orderService } from "../../services/order.service";
import { restaurantService } from "../../services/restaurant.service";
import { menuService } from "../../services/menu.service";
import { tableService } from "../../services/table.service";
import type {
  OrderType,
  PaymentMethod,
  MenuItem,
  Table,
  CartItem,
} from "types";

const { Text } = Typography;

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL TYPES (not in types/index.ts)
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  userRole: "waiter" | "manager" | "vendor";
  onSuccess: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Order Type & Table
// ─────────────────────────────────────────────────────────────────────────────

const StepOrderType: React.FC<{
  userRole: Props["userRole"];
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  tableId: string | undefined;
  setTableId: (id: string | undefined) => void;
  tables: Table[];
  tablesLoading: boolean;
  onSkipMenu: () => void;
  skipLoading: boolean;
}> = ({
  userRole,
  orderType,
  setOrderType,
  tableId,
  setTableId,
  tables,
  tablesLoading,
  onSkipMenu,
  skipLoading,
}) => {
  const isWaiter = userRole === "waiter";
  const typeOptions: {
    value: OrderType;
    label: string;
    icon: string;
    desc: string;
  }[] = [
    {
      value: "dinein",
      label: "Dine-In",
      icon: "🍽️",
      desc: "Customer seated at a table",
    },
    {
      value: "takeaway",
      label: "Takeaway",
      icon: "🥡",
      desc: "Customer picks up in person",
    },
  ];

  return (
    <div style={{ padding: "4px 0" }}>
      <Text
        type="secondary"
        style={{ fontSize: 12, display: "block", marginBottom: 12 }}
      >
        Select how this order will be fulfilled
      </Text>

      <Space direction="vertical" style={{ width: "100%" }} size={10}>
        {typeOptions.map((opt) => {
          const disabled = isWaiter && opt.value !== "dinein";
          const selected = orderType === opt.value;
          return (
            <Card
              key={opt.value}
              size="small"
              onClick={() => !disabled && setOrderType(opt.value)}
              style={{
                cursor: disabled ? "not-allowed" : "pointer",
                border: selected ? "2px solid #1677ff" : "1px solid #f0f0f0",
                borderRadius: 10,
                background: selected
                  ? "#e6f4ff"
                  : disabled
                    ? "#fafafa"
                    : "#fff",
                opacity: disabled ? 0.45 : 1,
                transition: "all 0.15s",
              }}
              styles={{ body: { padding: "10px 14px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 13 }}>
                    {opt.label}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {opt.desc}
                  </Text>
                </div>
                {selected && <Badge status="processing" color="#1677ff" />}
              </div>
            </Card>
          );
        })}
      </Space>

      {/* Table selector — only for dine-in */}
      {orderType === "dinein" && (
        <div style={{ marginTop: 20 }}>
          <Text
            strong
            style={{ display: "block", marginBottom: 8, fontSize: 13 }}
          >
            <TableOutlined style={{ marginRight: 6 }} />
            Select Table <Text type="danger">*</Text>
          </Text>
          {tablesLoading ? (
            <Spin size="small" />
          ) : tables.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              No tables found
            </Text>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tables.map((t) => {
                const isOccupied = t.status === "occupied";
                const isReserved = t.status === "reserved";
                const isUnavailable = isOccupied || isReserved;
                const isSelected = tableId === t.id;
                return (
                  <Tooltip
                    key={t.id}
                    title={
                      isOccupied
                        ? "Table occupied"
                        : isReserved
                          ? "Table reserved"
                          : `${t.capacity} seats`
                    }
                  >
                    <Tag
                      onClick={() =>
                        !isUnavailable &&
                        setTableId(isSelected ? undefined : t.id)
                      }
                      color={
                        isSelected
                          ? "blue"
                          : isOccupied
                            ? "red"
                            : isReserved
                              ? "orange"
                              : undefined
                      }
                      style={{
                        cursor: isUnavailable ? "not-allowed" : "pointer",
                        fontSize: 12,
                        padding: "4px 10px",
                        borderRadius: 6,
                        opacity: isUnavailable ? 0.4 : 1,
                        border: isSelected ? "1.5px solid #1677ff" : undefined,
                      }}
                    >
                      {t.tableNumber}
                    </Tag>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
      )}

      {orderType === "dinein" && tableId && (
        <div
          style={{
            marginTop: 20,
            padding: "12px 14px",
            background: "#fffbe6",
            border: "1px dashed #faad14",
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: "#7c5700",
              display: "block",
              marginBottom: 8,
            }}
          >
            🪑 Customer hasn't decided yet? Reserve the table now — waiter will
            take the order at the table later.
          </Text>
          <Button
            onClick={onSkipMenu}
            loading={skipLoading}
            icon={skipLoading ? <LoadingOutlined /> : <TableOutlined />}
            style={{ borderColor: "#faad14", color: "#faad14", width: "100%" }}
          >
            Skip Menu (Assign Table Only)
          </Button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Add Items
// ─────────────────────────────────────────────────────────────────────────────

const StepAddItems: React.FC<{
  menuItems: MenuItem[];
  menuLoading: boolean;
  cart: CartItem[];
  onAdd: (
    item: MenuItem,
    variantId?: string,
    variantName?: string,
    price?: number,
  ) => void;
  onQtyChange: (
    menuItemId: string,
    variantId: string | undefined,
    delta: number,
  ) => void;
  onRemove: (menuItemId: string, variantId: string | undefined) => void;
}> = ({ menuItems, menuLoading, cart, onAdd, onQtyChange, onRemove }) => {
  const [search, setSearch] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return menuItems;
    const q = search.toLowerCase();
    return menuItems.filter((m) => m.name.toLowerCase().includes(q));
  }, [menuItems, search]);

  const cartQty = useCallback(
    (menuItemId: string, variantId?: string) =>
      cart.find((c) => c.menuItemId === menuItemId && c.variantId === variantId)
        ?.quantity ?? 0,
    [cart],
  );

  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);

  return (
    <div>
      <Input
        placeholder="Search menu items…"
        prefix={<SearchOutlined style={{ color: "#bbb" }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="small"
        style={{ marginBottom: 12 }}
      />

      {menuLoading ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin tip="Loading menu…" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No items found"
          style={{ padding: 32 }}
        />
      ) : (
        <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: 2 }}>
          {filtered.map((item) => {
            // MenuItem from types uses camelCase — item.price, item.imageUrl
            // Variants are not on the shared MenuItem type, treat as any from API
            const rawItem = item as any;
            const hasVariants = rawItem.variants && rawItem.variants.length > 0;
            const isExpanded = expandedItem === item.id;

            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  marginBottom: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    background: "#fff",
                  }}
                >
                  <Avatar
                    size={36}
                    src={item.imageUrl}
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
                  </div>
                  <Text strong style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    ₹{item.price}
                  </Text>

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
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      {cartQty(item.id, undefined) > 0 ? (
                        <>
                          <Button
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() => onQtyChange(item.id, undefined, -1)}
                            style={{ padding: "0 6px" }}
                          />
                          <Text
                            strong
                            style={{
                              minWidth: 18,
                              textAlign: "center",
                              fontSize: 13,
                            }}
                          >
                            {cartQty(item.id, undefined)}
                          </Text>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            type="primary"
                            onClick={() => onQtyChange(item.id, undefined, 1)}
                            style={{ padding: "0 6px" }}
                          />
                        </>
                      ) : (
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          type="primary"
                          ghost
                          onClick={() => onAdd(item)}
                          style={{ padding: "0 10px" }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {hasVariants && isExpanded && (
                  <div
                    style={{ background: "#fafafa", padding: "6px 10px 10px" }}
                  >
                    {(
                      rawItem.variants as {
                        id: string;
                        name: string;
                        price: number;
                      }[]
                    ).map((v) => (
                      <div
                        key={v.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 0",
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 12 }}>{v.name}</Text>
                        <Text style={{ fontSize: 12, color: "#555" }}>
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
                                onClick={() => onQtyChange(item.id, v.id, -1)}
                                style={{ padding: "0 6px" }}
                              />
                              <Text
                                strong
                                style={{
                                  minWidth: 18,
                                  textAlign: "center",
                                  fontSize: 12,
                                }}
                              >
                                {cartQty(item.id, v.id)}
                              </Text>
                              <Button
                                size="small"
                                icon={<PlusOutlined />}
                                type="primary"
                                onClick={() => onQtyChange(item.id, v.id, 1)}
                                style={{ padding: "0 6px" }}
                              />
                            </>
                          ) : (
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              type="primary"
                              ghost
                              onClick={() => onAdd(item, v.id, v.name, v.price)}
                              style={{ padding: "0 10px" }}
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

      {cart.length > 0 && (
        <div
          style={{
            marginTop: 12,
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text strong style={{ fontSize: 12 }}>
              <ShoppingCartOutlined style={{ marginRight: 6 }} />
              Cart ({cart.reduce((s, c) => s + c.quantity, 0)} items)
            </Text>
            <Text strong style={{ fontSize: 12 }}>
              ₹{cartTotal.toLocaleString("en-IN")}
            </Text>
          </div>
          {cart.map((c) => (
            <div
              key={`${c.menuItemId}-${c.variantId}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
                color: "#555",
                marginBottom: 2,
              }}
            >
              <span>
                {c.quantity}× {c.name}
                {c.variantName && (
                  <span style={{ color: "#999" }}> ({c.variantName})</span>
                )}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>
                  ₹{(c.unitPrice * c.quantity).toLocaleString("en-IN")}
                </span>
                <DeleteOutlined
                  style={{ color: "#ff4d4f", cursor: "pointer" }}
                  onClick={() => onRemove(c.menuItemId, c.variantId)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Payment & Confirm
// ─────────────────────────────────────────────────────────────────────────────

const StepConfirm: React.FC<{
  orderType: OrderType;
  tableId: string | undefined;
  tables: Table[];
  cart: CartItem[];
  couponCode: string;
  setCouponCode: (c: string) => void;
  restaurantId: string;
}> = ({
  orderType,
  tableId,
  tables,
  cart,
  couponCode,
  setCouponCode,
  restaurantId,
}) => {
  const [couponInput, setCouponInput] = useState(couponCode);

  const calcPayload = useMemo(
    () => ({
      restaurant_id: restaurantId,
      items: cart.map((c) => ({
        menu_item_id: c.menuItemId,
        quantity: c.quantity,
        ...(c.variantId ? { variant_id: c.variantId } : {}),
      })),
      order_type: orderType, // service layer handles PascalCase conversion
      ...(couponCode ? { coupon_code: couponCode } : {}),
    }),
    [restaurantId, cart, orderType, couponCode],
  );

  const { data: calcData, isLoading: calcLoading } = useQuery({
    queryKey: ["create-order-calc", calcPayload],
    queryFn: () =>
      orderService.calculateCart(calcPayload).then((r) => r.data.data),
    enabled: cart.length > 0,
    staleTime: 10_000,
  });

  // Table uses camelCase tableNumber from types/index.ts
  const tableName = tables.find((t) => t.id === tableId)?.tableNumber;

  const typeIcon =
    orderType === "dinein" ? "🍽️" : orderType === "takeaway" ? "🥡" : "🛵";
  const typeLabel =
    orderType === "dinein"
      ? "Dine-In"
      : orderType === "takeaway"
        ? "Takeaway"
        : "Delivery";

  return (
    <div>
      <div
        style={{
          background: "#fafafa",
          border: "1px solid #f0f0f0",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>{typeIcon}</span>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {typeLabel}
            </Text>
            {orderType === "dinein" && tableName && (
              <Tag color="geekblue" style={{ marginLeft: 8, fontSize: 11 }}>
                Table {tableName}
              </Tag>
            )}
          </div>
        </div>
        <Divider style={{ margin: "8px 0" }} />
        {cart.map((c) => (
          <Row
            key={`${c.menuItemId}-${c.variantId}`}
            justify="space-between"
            style={{ fontSize: 12, color: "#555", marginBottom: 2 }}
          >
            <Col>
              {c.quantity}× {c.name}
              {c.variantName && (
                <span style={{ color: "#aaa" }}> ({c.variantName})</span>
              )}
            </Col>
            <Col>₹{(c.unitPrice * c.quantity).toLocaleString("en-IN")}</Col>
          </Row>
        ))}
      </div>

      {/* Coupon */}
      <div style={{ marginBottom: 14 }}>
        <Text
          strong
          style={{ display: "block", marginBottom: 6, fontSize: 13 }}
        >
          <TagOutlined style={{ marginRight: 6 }} />
          Coupon Code
        </Text>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Enter coupon code"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            size="small"
            allowClear
          />
          <Button
            size="small"
            type="primary"
            onClick={() => setCouponCode(couponInput)}
          >
            Apply
          </Button>
        </Space.Compact>
        {calcData?.coupon && (
          <Text
            style={{
              color: "#52c41a",
              fontSize: 11,
              marginTop: 4,
              display: "block",
            }}
          >
            ✓ Coupon applied — ₹{calcData.coupon.discount_amount} off
            {calcData.coupon.free_delivery ? " + free delivery" : ""}
          </Text>
        )}
      </div>

      {/* Price breakdown */}
      <div
        style={{
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 14,
          fontSize: 12,
        }}
      >
        {calcLoading ? (
          <div style={{ textAlign: "center", padding: 8 }}>
            <Spin size="small" />
          </div>
        ) : calcData ? (
          <>
            <Row justify="space-between" style={{ marginBottom: 3 }}>
              <Col style={{ color: "#666" }}>Subtotal</Col>
              <Col>₹{calcData.subtotal_amount?.toLocaleString("en-IN")}</Col>
            </Row>
            <Row justify="space-between" style={{ marginBottom: 3 }}>
              <Col style={{ color: "#666" }}>Tax (5%)</Col>
              <Col>₹{calcData.tax_amount?.toLocaleString("en-IN")}</Col>
            </Row>
            {calcData.delivery_fee > 0 && (
              <Row justify="space-between" style={{ marginBottom: 3 }}>
                <Col style={{ color: "#666" }}>Delivery Fee</Col>
                <Col>₹{calcData.delivery_fee?.toLocaleString("en-IN")}</Col>
              </Row>
            )}
            {calcData.discount_amount > 0 && (
              <Row justify="space-between" style={{ marginBottom: 3 }}>
                <Col style={{ color: "#52c41a" }}>Discount</Col>
                <Col style={{ color: "#52c41a" }}>
                  −₹{calcData.discount_amount?.toLocaleString("en-IN")}
                </Col>
              </Row>
            )}
            <Row justify="space-between" style={{ marginBottom: 3 }}>
              <Col style={{ color: "#666" }}>Platform Fee</Col>
              <Col>₹{calcData.platform_fee?.toLocaleString("en-IN")}</Col>
            </Row>
            <Divider style={{ margin: "6px 0" }} />
            <Row justify="space-between">
              <Col>
                <Text strong>Total</Text>
              </Col>
              <Col>
                <Text strong style={{ fontSize: 14 }}>
                  ₹{calcData.total_amount?.toLocaleString("en-IN")}
                </Text>
              </Col>
            </Row>
          </>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Calculating…
          </Text>
        )}
      </div>

      {/* DineIn/Takeaway — payment at billing time */}
      {(orderType === "dinein" || orderType === "takeaway") && (
        <div
          style={{
            background: "#fffbe6",
            border: "1px dashed #faad14",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            color: "#7c5700",
          }}
        >
          💡 Payment will be collected at billing time. Customer can choose Cash
          or Online at that point.
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DRAWER
// ─────────────────────────────────────────────────────────────────────────────

export const CreateOrderDrawer: React.FC<Props> = ({
  open,
  onClose,
  restaurantId,
  userRole,
  onSuccess,
}) => {
  const [notifApi, contextHolder] = notification.useNotification();
  const [step, setStep] = useState(0);

  const [orderType, setOrderType] = useState<OrderType>("dinein");
  const [tableId, setTableId] = useState<string | undefined>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    if (open) {
      setStep(0);
      setOrderType("dinein");
      setTableId(undefined);
      setCart([]);
      setPaymentMethod("cod");
      setCouponCode("");
    }
  }, [open, userRole]);

  // ── Data fetches ────────────────────────────────────────────────────────────

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>(
    {
      queryKey: ["menu-items-for-order", restaurantId],
      enabled: !!restaurantId && open,
      queryFn: async () => {
        const res = await menuService.getItems(restaurantId);
        const items: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
        return items
          .filter((m: any) => m.is_available !== false)
          .map(
            (m: any): MenuItem => ({
              id: m.id,
              categoryId: m.category_id,
              restaurantId: m.restaurant_id,
              name: m.name,
              description: m.description ?? null,
              price: Number(m.base_price ?? 0),
              imageUrl: m.image_url ?? null,
              isVeg: m.dietary_tag === "Veg" || m.dietary_tag === "Vegan",
              dietaryTag: m.dietary_tag ?? "Veg",
              isAvailable: m.is_available !== false,
              isFeatured: m.is_featured === true,
              prepTimeMinutes: m.prep_time_minutes ?? null,
              sortOrder: m.display_order ?? 0,
              // attach variants as extra field for drawer use
              ...(m.variants ? { variants: m.variants } : {}),
            }),
          );
      },
      staleTime: 60_000,
    },
  );

  const { data: tables = [], isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ["tables-for-order", restaurantId],
    enabled: !!restaurantId && open && orderType === "dinein",
    queryFn: async () => {
      const res = await restaurantService.getTables(restaurantId);
      const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return raw.map(
        (t: any): Table => ({
          id: t.id,
          restaurantId: t.restaurant_id,
          tableNumber: t.table_name ?? t.table_number ?? t.tableNumber ?? "",
          capacity: t.capacity,
          status:
            t.status === "Reserved"
              ? "reserved"
              : t.status === "Occupied"
                ? "occupied"
                : t.status === "OutOfService"
                  ? "occupied"
                  : "available",
          qrCode: t.qr_code_url ?? null,
        }),
      );
    },
    staleTime: 30_000,
  });

  // ── Cart helpers ────────────────────────────────────────────────────────────

  const addToCart = useCallback(
    (
      item: MenuItem,
      variantId?: string,
      variantName?: string,
      price?: number,
    ) => {
      const unitPrice = price ?? item.price;
      setCart((prev) => {
        const existing = prev.find(
          (c) => c.menuItemId === item.id && c.variantId === variantId,
        );
        if (existing) {
          return prev.map((c) =>
            c.menuItemId === item.id && c.variantId === variantId
              ? { ...c, quantity: c.quantity + 1 }
              : c,
          );
        }
        return [
          ...prev,
          {
            menuItemId: item.id,
            variantId,
            name: item.name,
            variantName,
            unitPrice,
            quantity: 1,
          },
        ];
      });
    },
    [],
  );

  const changeQty = useCallback(
    (menuItemId: string, variantId: string | undefined, delta: number) => {
      setCart((prev) =>
        prev
          .map((c) =>
            c.menuItemId === menuItemId && c.variantId === variantId
              ? { ...c, quantity: c.quantity + delta }
              : c,
          )
          .filter((c) => c.quantity > 0),
      );
    },
    [],
  );

  const removeFromCart = useCallback(
    (menuItemId: string, variantId: string | undefined) => {
      setCart((prev) =>
        prev.filter(
          (c) => !(c.menuItemId === menuItemId && c.variantId === variantId),
        ),
      );
    },
    [],
  );

  // ── Validation ──────────────────────────────────────────────────────────────

  const step1Valid = orderType !== "dinein" || !!tableId;
  const step2Valid = cart.length > 0;

  // ── Mutations ───────────────────────────────────────────────────────────────

  // ── REPLACE this broken mutation ─────────────────────────────────────────
  const assignTableMutation = useMutation({
    mutationFn: () => tableService.reserveTable(restaurantId, tableId!), // ← correct service
    onSuccess: () => {
      const name = tables.find((t) => t.id === tableId)?.tableNumber ?? tableId;
      notifApi.success({
        message: "Table Reserved",
        description: `Table ${name} reserved. Waiter will take the order shortly.`,
        placement: "topRight",
        duration: 4,
      });
      onSuccess(); // closes drawer + refreshes orders board
    },
    onError: (e: any) => {
      notifApi.error({
        message: "Failed to Reserve Table",
        description:
          e?.response?.data?.error?.message ?? "Something went wrong",
        placement: "topRight",
        duration: 5,
      });
    },
  });

  const createOrder = useMutation({
    mutationFn: () =>
      orderService.createOrder({
        restaurant_id: restaurantId,
        order_type: orderType,
        ...(orderType === "delivery" ? { payment_method: paymentMethod } : {}),
        items: cart.map((c) => ({
          menu_item_id: c.menuItemId,
          quantity: c.quantity,
          ...(c.variantId ? { variant_id: c.variantId } : {}),
        })),
        ...(orderType === "dinein" && tableId ? { table_id: tableId } : {}),
        ...(couponCode ? { coupon_code: couponCode } : {}),
      }),
    onSuccess: (res) => {
      const code = res.data?.data?.order_code ?? "";
      notifApi.success({
        message: "Order Created",
        description: code
          ? `Order ${code} placed successfully`
          : "Order placed successfully",
        placement: "topRight",
        duration: 4,
      });
      onSuccess();
    },
    onError: (e: any) => {
      notifApi.error({
        message: "Failed to Create Order",
        description:
          e?.response?.data?.error?.message ?? "Something went wrong",
        placement: "topRight",
        duration: 5,
      });
    },
  });

  // ── Steps config ────────────────────────────────────────────────────────────

  const steps = [
    {
      title: "Order Type",
      icon:
        orderType === "dinein" ? (
          <TableOutlined />
        ) : orderType === "takeaway" ? (
          <ShopOutlined />
        ) : (
          <CarOutlined />
        ),
    },
    {
      title: "Add Items",
      icon: (
        <Badge
          count={cart.reduce((s, c) => s + c.quantity, 0)}
          size="small"
          offset={[4, -4]}
        >
          <ShoppingCartOutlined />
        </Badge>
      ),
    },
    { title: "Confirm", icon: <CheckOutlined /> },
  ];

  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
        disabled={createOrder.isPending || assignTableMutation.isPending}
      >
        {step === 0 ? "Cancel" : "Back"}
      </Button>
      {step < 2 ? (
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          disabled={step === 0 ? !step1Valid : !step2Valid}
          onClick={() => setStep(step + 1)}
        >
          Next
        </Button>
      ) : (
        <Button
          type="primary"
          icon={<CheckOutlined />}
          loading={createOrder.isPending}
          onClick={() => createOrder.mutate()}
          style={{ background: "#52c41a", borderColor: "#52c41a" }}
        >
          Place Order
        </Button>
      )}
    </div>
  );

  return (
    <>
      {contextHolder}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusOutlined style={{ color: "#1677ff" }} />
            <span>New Order</span>
            {cart.length > 0 && (
              <Tag color="blue" style={{ marginLeft: 4, borderRadius: 10 }}>
                {cart.reduce((s, c) => s + c.quantity, 0)} item
                {cart.reduce((s, c) => s + c.quantity, 0) !== 1 ? "s" : ""}
              </Tag>
            )}
          </div>
        }
        open={open}
        onClose={onClose}
        width={440}
        footer={footer}
        styles={{
          body: { padding: "16px 20px" },
          footer: { padding: "12px 20px" },
        }}
        destroyOnHidden
      >
        <Steps
          current={step}
          size="small"
          items={steps}
          style={{ marginBottom: 20 }}
          onChange={(s) => {
            if (s < step) setStep(s);
            else if (s === 1 && step1Valid) setStep(1);
            else if (s === 2 && step1Valid && step2Valid) setStep(2);
          }}
        />

        {step === 0 && (
          <StepOrderType
            userRole={userRole}
            orderType={orderType}
            setOrderType={(t) => {
              setOrderType(t);
              setTableId(undefined);
            }}
            tableId={tableId}
            setTableId={setTableId}
            tables={tables}
            tablesLoading={tablesLoading}
            onSkipMenu={() => assignTableMutation.mutate()}
            skipLoading={assignTableMutation.isPending}
          />
        )}
        {step === 1 && (
          <StepAddItems
            menuItems={menuItems}
            menuLoading={menuLoading}
            cart={cart}
            onAdd={addToCart}
            onQtyChange={changeQty}
            onRemove={removeFromCart}
          />
        )}
        {step === 2 && (
          <StepConfirm
            orderType={orderType}
            tableId={tableId}
            tables={tables}
            cart={cart}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            restaurantId={restaurantId}
          />
        )}
      </Drawer>
    </>
  );
};
