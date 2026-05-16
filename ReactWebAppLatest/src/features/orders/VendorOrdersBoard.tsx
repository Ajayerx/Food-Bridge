import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Modal,
  Row,
  Tag,
  Typography,
  Spin,
  Tooltip,
  notification,
  Input,
  Select,
  DatePicker,
  Space,
  Drawer,
  Statistic,
  Empty,
  Radio,
} from "antd";
import {
  ReloadOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  ShoppingOutlined,
  DollarOutlined,
  FireOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, normalizeOrder } from "../../services/order.service";
import { useRestaurant } from "../../hooks/useRestaurant";
import { useAppSelector } from "../../hooks/useAppSelector";
import type { Order, OrderStatus } from "types";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { restaurantService } from "../../services/restaurant.service";
import { CreateOrderDrawer } from "./CreateOrderDrawer";
import { PlusOutlined } from "@ant-design/icons";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const { RangePicker } = DatePicker;

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLUMNS: {
  key: OrderStatus;
  label: string;
  color: string;
  hex: string;
}[] = [
  { key: "placed", label: "New", color: "blue", hex: "#1677ff" },
  { key: "accepted", label: "Accepted", color: "cyan", hex: "#13c2c2" },
  { key: "preparing", label: "Preparing", color: "gold", hex: "#faad14" },
  { key: "ready", label: "Ready", color: "lime", hex: "#a0d911" },
  {
    key: "out_for_delivery",
    label: "Delivering",
    color: "orange",
    hex: "#fa8c16",
  },
  { key: "completed", label: "Completed", color: "green", hex: "#52c41a" },
  { key: "cancelled", label: "Cancelled", color: "red", hex: "#ff4d4f" },
];

// ✅ Contract 7.3 — delivery flow for vendor/manager
const DELIVERY_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "completed",
};

// ✅ Contract 7.3 — dine-in/takeaway skips out_for_delivery
const DINEIN_TAKEAWAY_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed", // ← direct to completed, no delivery step
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  placed: "Accept",
  accepted: "Start Preparing",
  preparing: "Mark Ready for Pickup",
  out_for_delivery: "Mark Delivered",
};

// ✅ Helper — get next status based on order type + role
const KITCHEN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: "preparing",
  preparing: "ready",
};

function getNextStatus(
  o: Order,
  userRoleKey: string | null,
): OrderStatus | undefined {
  if (!userRoleKey) return undefined;
  // ✅ Waiters cannot mutate status - return undefined
  if (userRoleKey === "waiter") return undefined;
  if (userRoleKey === "kitchen") {
    return KITCHEN_TRANSITIONS[o.status];
  }
  if (!["vendor", "manager"].includes(userRoleKey)) return undefined;
  if (o.orderType === "dinein" || o.orderType === "takeaway") {
    return DINEIN_TAKEAWAY_TRANSITIONS[o.status];
  }
  return DELIVERY_TRANSITIONS[o.status];
}

// ✅ Helper — get button label based on order type
function getNextLabel(
  o: Order,
  nextStatus: OrderStatus | undefined,
): string | null {
  if (!nextStatus) return null;
  if (
    nextStatus === "completed" &&
    (o.orderType === "dinein" || o.orderType === "takeaway")
  ) {
    return "Complete & Collect Payment";
  }
  if (o.status === "ready" && o.orderType === "delivery") {
    return "Out for Delivery";
  }
  return NEXT_LABEL[o.status] ?? null;
}

// ✅ Order type display helpers
function orderTypeIcon(type: string | null | undefined): string {
  if (type === "dinein") return "🍽";
  if (type === "delivery") return "🛵";
  if (type === "takeaway") return "🥡";
  return "";
}

function orderTypeColor(type: string | null | undefined): string {
  if (type === "dinein") return "green";
  if (type === "delivery") return "blue";
  if (type === "takeaway") return "orange";
  return "default";
}

const PAYMENT_METHODS = ["online", "cod"];
const ORDER_TYPES = ["delivery", "takeaway", "dinein"];

// ─────────────────────────────────────────────────────────────────────────────
// FILTER STATE
// ─────────────────────────────────────────────────────────────────────────────

interface FilterState {
  search: string;
  statuses: OrderStatus[];
  paymentMethods: string[];
  paymentStatus: string;
  orderTypes: string[];
  dateRange: [Dayjs, Dayjs] | null;
  amountMin: string;
  amountMax: string;
  sortBy: "createdAt_desc" | "createdAt_asc" | "amount_desc" | "amount_asc";
  viewMode: "kanban" | "list";
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  statuses: [],
  paymentMethods: [],
  paymentStatus: "all",
  orderTypes: [],
  dateRange: null,
  amountMin: "",
  amountMax: "",
  sortBy: "createdAt_desc",
  viewMode: "kanban",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatOrderId(order: Pick<Order, "id" | "orderCode">): string {
  if (order.orderCode) {
    const code = order.orderCode.replace(/^ORD-/, "");
    return `#${code.slice(-6)}`;
  }
  return `#${String(order.id).slice(-6).padStart(6, "0")}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.search) n++;
  if (f.statuses.length) n++;
  if (f.paymentMethods.length) n++;
  if (f.paymentStatus !== "all") n++;
  if (f.orderTypes.length) n++;
  if (f.dateRange) n++;
  if (f.amountMin || f.amountMax) n++;
  if (f.sortBy !== "createdAt_desc") n++;
  return n;
}

function applyFilters(orders: Order[], f: FilterState): Order[] {
  let r = [...orders];
  if (f.search.trim()) {
    const q = f.search.toLowerCase();
    r = r.filter(
      (o) =>
        formatOrderId(o).toLowerCase().includes(q) ||
        (o.orderCode ?? "").toLowerCase().includes(q) ||
        (o.deliveryAddress ?? "").toLowerCase().includes(q) ||
        (o.tableName ?? "").toLowerCase().includes(q),
    );
  }
  if (f.statuses.length) r = r.filter((o) => f.statuses.includes(o.status));
  if (f.paymentMethods.length)
    r = r.filter((o) =>
      f.paymentMethods.includes(o.paymentMethod?.toLowerCase()),
    );
  if (f.paymentStatus !== "all") {
    r = r.filter((o) =>
      f.paymentStatus === "paid"
        ? o.paymentStatus === "paid"
        : o.paymentStatus !== "paid",
    );
  }
  if (f.orderTypes.length)
    r = r.filter(
      (o) => !!o.orderType && f.orderTypes.includes(o.orderType.toLowerCase()),
    );
  if (f.dateRange) {
    const [from, to] = f.dateRange;
    r = r.filter((o) => {
      const d = dayjs(o.createdAt);
      return (
        d.isSameOrAfter(from.startOf("day")) &&
        d.isSameOrBefore(to.endOf("day"))
      );
    });
  }
  if (f.amountMin !== "") {
    const min = parseFloat(f.amountMin);
    if (!isNaN(min)) r = r.filter((o) => o.totalAmount >= min);
  }
  if (f.amountMax !== "") {
    const max = parseFloat(f.amountMax);
    if (!isNaN(max)) r = r.filter((o) => o.totalAmount <= max);
  }
  r.sort((a, b) => {
    switch (f.sortBy) {
      case "createdAt_asc":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "amount_desc":
        return b.totalAmount - a.totalAmount;
      case "amount_asc":
        return a.totalAmount - b.totalAmount;
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY STRIP
// ─────────────────────────────────────────────────────────────────────────────

const SummaryStrip: React.FC<{
  orders: Order[];
  filtered: Order[];
  canSeeRevenue: boolean;
}> = ({ orders, filtered, canSeeRevenue }) => {
  const totalRevenue = filtered.reduce(
    (s, o) => (o.paymentStatus === "paid" ? s + o.totalAmount : s),
    0,
  );
  const activeOrders = filtered.filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  ).length;
  const pendingPay = filtered.filter((o) => o.paymentStatus !== "paid").length;
  const isFiltered = filtered.length !== orders.length;

  const stats = [
    {
      title: isFiltered ? "Orders (filtered)" : "Total Orders",
      value: filtered.length,
      suffix: isFiltered ? `/ ${orders.length}` : undefined,
      icon: <ShoppingOutlined style={{ color: "#1677ff" }} />,
      color: "#e6f4ff",
      isText: false,
    },
    {
      title: "Active",
      value: activeOrders,
      icon: <FireOutlined style={{ color: "#fa8c16" }} />,
      color: "#fff7e6",
      isText: false,
    },
    ...(canSeeRevenue
      ? [
          {
            title: "Revenue (paid)",
            value: `₹${totalRevenue.toLocaleString("en-IN")}`,
            icon: <RiseOutlined style={{ color: "#52c41a" }} />,
            color: "#f6ffed",
            isText: true,
          },
        ]
      : []),
    {
      title: "Pending Payment",
      value: pendingPay,
      icon: <DollarOutlined style={{ color: "#ff4d4f" }} />,
      color: "#fff1f0",
      isText: false,
    },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      {stats.map((stat, i) => (
        <Col key={i} xs={12} sm={6}>
          <Card
            size="small"
            style={{ background: stat.color, border: "none", borderRadius: 10 }}
            styles={{ body: { padding: "10px 14px" } }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 2,
              }}
            >
              {stat.icon}
              <span style={{ fontSize: 11, color: "#666" }}>{stat.title}</span>
            </div>
            {stat.isText ? (
              <div style={{ fontWeight: 700, fontSize: 16 }}>{stat.value}</div>
            ) : (
              <Statistic
                value={stat.value as number}
                suffix={(stat as any).suffix}
                valueStyle={{ fontSize: 20, fontWeight: 700 }}
              />
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER DRAWER
// ─────────────────────────────────────────────────────────────────────────────

const FilterDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
  activeCount: number;
}> = ({ open, onClose, filters, onChange, onReset, activeCount }) => {
  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    onChange({ ...filters, [key]: val });
  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FilterOutlined />
          <span>Filters & Sorting</span>
          {activeCount > 0 && <Tag color="blue">{activeCount} active</Tag>}
        </div>
      }
      open={open}
      onClose={onClose}
      width={360}
      extra={
        activeCount > 0 && (
          <Button
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            onClick={onReset}
          >
            Reset All
          </Button>
        )
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size={20}>
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
            Order Status
          </Typography.Text>
          <Select
            mode="multiple"
            placeholder="All statuses"
            value={filters.statuses}
            onChange={(v) => set("statuses", v)}
            style={{ width: "100%" }}
            options={STATUS_COLUMNS.map((s) => ({
              label: (
                <span>
                  <Badge color={s.hex} />
                  <span style={{ marginLeft: 6 }}>{s.label}</span>
                </span>
              ),
              value: s.key,
            }))}
            maxTagCount="responsive"
          />
        </div>
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
            Payment Method
          </Typography.Text>
          <Select
            mode="multiple"
            placeholder="All methods"
            value={filters.paymentMethods}
            onChange={(v) => set("paymentMethods", v)}
            style={{ width: "100%" }}
            options={PAYMENT_METHODS.map((m) => ({
              label: m.toUpperCase(),
              value: m,
            }))}
          />
        </div>
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
            Payment Status
          </Typography.Text>
          <Radio.Group
            value={filters.paymentStatus}
            onChange={(e) => set("paymentStatus", e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="paid">Paid</Radio.Button>
            <Radio.Button value="unpaid">Unpaid</Radio.Button>
          </Radio.Group>
        </div>
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
            Order Type
          </Typography.Text>
          <Select
            mode="multiple"
            placeholder="All types"
            value={filters.orderTypes}
            onChange={(v) => set("orderTypes", v)}
            style={{ width: "100%" }}
            options={ORDER_TYPES.map((t) => ({
              label: `${orderTypeIcon(t)} ${t.toUpperCase()}`,
              value: t,
            }))}
          />
        </div>
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
            Date Range
          </Typography.Text>
          <RangePicker
            style={{ width: "100%" }}
            value={filters.dateRange}
            onChange={(v) => set("dateRange", v as [Dayjs, Dayjs] | null)}
            presets={[
              {
                label: "Today",
                value: [dayjs().startOf("day"), dayjs().endOf("day")],
              },
              {
                label: "Yesterday",
                value: [
                  dayjs().subtract(1, "day").startOf("day"),
                  dayjs().subtract(1, "day").endOf("day"),
                ],
              },
              {
                label: "Last 7d",
                value: [
                  dayjs().subtract(6, "day").startOf("day"),
                  dayjs().endOf("day"),
                ],
              },
              {
                label: "This month",
                value: [dayjs().startOf("month"), dayjs().endOf("month")],
              },
            ]}
            allowClear
          />
        </div>
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
            Order Amount (₹)
          </Typography.Text>
          <Row gutter={8}>
            <Col span={12}>
              <Input
                placeholder="Min"
                prefix="₹"
                type="number"
                value={filters.amountMin}
                onChange={(e) => set("amountMin", e.target.value)}
                size="small"
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="Max"
                prefix="₹"
                type="number"
                value={filters.amountMax}
                onChange={(e) => set("amountMax", e.target.value)}
                size="small"
              />
            </Col>
          </Row>
        </div>
        <Divider style={{ margin: "4px 0" }} />
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
            Sort By
          </Typography.Text>
          <Select
            value={filters.sortBy}
            onChange={(v) => set("sortBy", v)}
            style={{ width: "100%" }}
            options={[
              { label: "Newest first", value: "createdAt_desc" },
              { label: "Oldest first", value: "createdAt_asc" },
              { label: "Amount: High → Low", value: "amount_desc" },
              { label: "Amount: Low → High", value: "amount_asc" },
            ]}
          />
        </div>
      </Space>
    </Drawer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE FILTER TAGS
// ─────────────────────────────────────────────────────────────────────────────

const ActiveFilterTags: React.FC<{
  filters: FilterState;
  onChange: (f: FilterState) => void;
}> = ({ filters, onChange }) => {
  const chips: { label: string; clear: () => void }[] = [];
  if (filters.statuses.length)
    chips.push({
      label: `Status: ${filters.statuses.map((s) => STATUS_COLUMNS.find((c) => c.key === s)?.label).join(", ")}`,
      clear: () => onChange({ ...filters, statuses: [] }),
    });
  if (filters.paymentMethods.length)
    chips.push({
      label: `Payment: ${filters.paymentMethods.join(", ").toUpperCase()}`,
      clear: () => onChange({ ...filters, paymentMethods: [] }),
    });
  if (filters.paymentStatus !== "all")
    chips.push({
      label: `Payment Status: ${filters.paymentStatus}`,
      clear: () => onChange({ ...filters, paymentStatus: "all" }),
    });
  if (filters.orderTypes.length)
    chips.push({
      label: `Type: ${filters.orderTypes.join(", ")}`,
      clear: () => onChange({ ...filters, orderTypes: [] }),
    });
  if (filters.dateRange)
    chips.push({
      label: `Date: ${filters.dateRange[0].format("DD MMM")} – ${filters.dateRange[1].format("DD MMM")}`,
      clear: () => onChange({ ...filters, dateRange: null }),
    });
  if (filters.amountMin || filters.amountMax)
    chips.push({
      label: `Amount: ₹${filters.amountMin || "0"} – ₹${filters.amountMax || "∞"}`,
      clear: () => onChange({ ...filters, amountMin: "", amountMax: "" }),
    });
  if (!chips.length) return null;
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}
    >
      {chips.map((chip, i) => (
        <Tag
          key={i}
          closable
          onClose={chip.clear}
          color="blue"
          style={{ borderRadius: 20, fontSize: 11, padding: "1px 10px" }}
        >
          {chip.label}
        </Tag>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE PRESETS
// ─────────────────────────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { label: "All", value: null },
  {
    label: "Today",
    value: [dayjs().startOf("day"), dayjs().endOf("day")] as [Dayjs, Dayjs],
  },
  {
    label: "Yesterday",
    value: [
      dayjs().subtract(1, "day").startOf("day"),
      dayjs().subtract(1, "day").endOf("day"),
    ] as [Dayjs, Dayjs],
  },
  {
    label: "Last 7d",
    value: [
      dayjs().subtract(6, "day").startOf("day"),
      dayjs().endOf("day"),
    ] as [Dayjs, Dayjs],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────

const ListView: React.FC<{ orders: Order[]; onSelect: (o: Order) => void }> = ({
  orders,
  onSelect,
}) => {
  if (!orders.length)
    return (
      <Empty
        description="No orders match your filters"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: 48 }}
      />
    );
  return (
    <div>
      <Row
        style={{
          background: "#fafafa",
          borderRadius: "8px 8px 0 0",
          border: "1px solid #f0f0f0",
          padding: "8px 12px",
          fontWeight: 600,
          fontSize: 12,
          color: "#888",
        }}
      >
        <Col span={4}>Order</Col>
        <Col span={3}>Status</Col>
        <Col span={3}>Time</Col>
        <Col span={4}>Type</Col>
        <Col span={5}>Payment</Col>
        <Col span={3}>Amount</Col>
      </Row>
      {orders.map((order) => {
        const col = STATUS_COLUMNS.find((c) => c.key === order.status);
        return (
          <Row
            key={order.id}
            onClick={() => onSelect(order)}
            style={{
              padding: "10px 12px",
              border: "1px solid #f0f0f0",
              borderTop: "none",
              cursor: "pointer",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Col span={4}>
              <span style={{ fontWeight: 700, fontFamily: "monospace" }}>
                {formatOrderId(order)}
              </span>
            </Col>
            <Col span={3}>
              <Tag
                color={col?.color}
                style={{ borderRadius: 10, fontSize: 11 }}
              >
                {order.status.replace(/_/g, " ")}
              </Tag>
            </Col>
            <Col span={3} style={{ fontSize: 12, color: "#666" }}>
              {formatTime(order.createdAt)}
            </Col>
            <Col span={4}>
              {/* ✅ Show order type with icon + table name for dine-in */}
              <Tag
                color={orderTypeColor(order.orderType)}
                style={{ fontSize: 11 }}
              >
                {orderTypeIcon(order.orderType)} {order.orderType ?? "—"}
              </Tag>
              {order.orderType === "dinein" && order.tableName && (
                <Tag color="geekblue" style={{ fontSize: 10, marginLeft: 2 }}>
                  T:{order.tableName}
                </Tag>
              )}
            </Col>
            <Col span={5}>
              <Tag
                color={order.paymentStatus === "paid" ? "green" : "orange"}
                style={{ fontSize: 11 }}
              >
                {order.paymentMethod} · {order.paymentStatus}
              </Tag>
            </Col>
            <Col span={3}>
              <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
            </Col>
          </Row>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BOARD
// ─────────────────────────────────────────────────────────────────────────────

export const VendorOrdersBoard: React.FC = () => {
  const { restaurant } = useRestaurant();
  const qc = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const [selected, setSelected] = useState<Order | null>(null);
  const [api, contextHolder] = notification.useNotification();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ Role detection
  const isVendor = user?.roleType === "Vendor";
  const isManager = user?.roleType === "Staff" && user?.staffRole === "manager";
  const isKitchen = user?.roleType === "Staff" && user?.staffRole === "kitchen";
  const isWaiter = user?.roleType === "Staff" && user?.staffRole === "waiter";

  // ✅ Waiter permissions: can view and create orders, but CANNOT mutate status or cancel
  const canMutateStatus = isVendor || isManager || isKitchen; // ❌ waiter excluded
  const canAssignAgent = isVendor || isManager; // ❌ waiter excluded
  const canCancel = isVendor || isManager; // ❌ waiter excluded
  const canSeeRevenue = isVendor || isManager; // ❌ waiter excluded (no revenue visibility)

  // ✅ Add waiter role key for proper UI rendering (but no mutation permissions)
  const userRoleKey = isVendor
    ? "vendor"
    : isManager
      ? "manager"
      : isKitchen
        ? "kitchen"
        : isWaiter
          ? "waiter" // ✅ waiter can view but not mutate
          : null;

  const [createOpen, setCreateOpen] = useState(false);

  console.log("restaurantID", restaurant?.id);
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["vendor-orders", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const res = await orderService.getRestaurantOrders(restaurant!.id, {
        limit: 200,
      });
      const rawList: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return rawList.map((raw) => normalizeOrder(raw));
    },
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  const orders = data ?? [];
  const filteredOrders = useMemo(
    () => applyFilters(orders, filters),
    [orders, filters],
  );
  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // ── Track orderId → ISO timestamp of last items-added event ──────────────
  const [itemAddedEvents, setItemAddedEvents] = useState<
    Record<string, string>
  >({});

  // ── Socket listener for waiter adding items mid-order ────────────────────
  useEffect(() => {
    const socket = (window as any).__socket; // replace with your socket instance
    if (!socket) return;

    const restaurantId = restaurant?.id;
    const handler = (payload: {
      orderId: string;
      new_status: string;
      status_reverted: boolean;
      items_updated_at: string;
    }) => {
      qc.invalidateQueries({ queryKey: ["vendor-orders", restaurantId] });
      qc.invalidateQueries({ queryKey: ["order-detail", payload.orderId] });

      setItemAddedEvents((prev) => ({
        ...prev,
        [payload.orderId]: payload.items_updated_at,
      }));

      setSelected((prev) =>
        prev && String(prev.id) === String(payload.orderId)
          ? { ...prev, status: payload.new_status as OrderStatus }
          : prev,
      );

      if (payload.status_reverted) {
        api.warning({
          message: "Order back in kitchen",
          description: `New items added — order reverted to Accepted.`,
          placement: "topRight",
          duration: 6,
        });
      }
    };

    socket.on("orderItemsAdded", handler);
    return () => socket.off("orderItemsAdded", handler);
  }, [qc, api, restaurant?.id]);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateStatus(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["vendor-orders", restaurant?.id] });
      qc.invalidateQueries({ queryKey: ["order-detail", vars.id] });
      setSelected(null);
      api.success({
        message: "Order Updated",
        description: "Status updated successfully",
        placement: "topRight",
        duration: 3,
      });
    },
    onError: (e: any) =>
      api.error({
        message: "Update Failed",
        description:
          e?.response?.data?.error?.message ?? "Failed to update order status",
        placement: "topRight",
        duration: 5,
      }),
  });

  const cancelOrder = useMutation({
    mutationFn: (id: string) =>
      orderService.cancelOrder(id, "Cancelled by vendor"),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["vendor-orders", restaurant?.id] });
      qc.invalidateQueries({ queryKey: ["order-detail", id] });
      setSelected(null);
      api.success({
        message: "Order Cancelled",
        placement: "topRight",
        duration: 3,
      });
    },
    onError: (e: any) =>
      api.error({
        message: "Cancel Failed",
        description:
          e?.response?.data?.error?.message ?? "Failed to cancel order",
        placement: "topRight",
        duration: 5,
      }),
  });
  const settleBill = useMutation({
    mutationFn: ({
      orderId,
      paymentMethod,
    }: {
      orderId: string;
      paymentMethod: string;
    }) => orderService.settleBill(orderId, paymentMethod),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["vendor-orders", restaurant?.id] });
      qc.invalidateQueries({ queryKey: ["order-detail", vars.orderId] });
      setSelected(null);
      api.success({
        message: "Payment Confirmed",
        description: "Bill settled successfully",
        placement: "topRight",
        duration: 3,
      });
    },
    onError: (e: any) =>
      api.error({
        message: "Failed to Settle Bill",
        description:
          e?.response?.data?.error?.message ?? "Failed to settle bill",
        placement: "topRight",
        duration: 5,
      }),
  });

  const assignAgent = useMutation({
    mutationFn: ({ orderId, agentId }: { orderId: string; agentId: string }) =>
      orderService.assignAgent(orderId, agentId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["vendor-orders", restaurant?.id] });
      qc.invalidateQueries({ queryKey: ["order-detail", vars.orderId] });
      api.success({
        message: "Agent Assigned",
        placement: "topRight",
        duration: 3,
      });
    },
    onError: (e: any) =>
      api.error({
        message: "Assign Failed",
        description:
          e?.response?.data?.error?.message ?? "Failed to assign agent",
        placement: "topRight",
        duration: 5,
      }),
  });

  if (isLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" tip="Loading orders..." />
      </div>
    );

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <div>
      {contextHolder}

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Orders Board
        </Typography.Title>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {lastUpdated && (
            <span style={{ fontSize: 12, color: "#999" }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              Updated {lastUpdated}
            </span>
          )}
          <Radio.Group
            value={filters.viewMode}
            onChange={(e) =>
              setFilters((f) => ({ ...f, viewMode: e.target.value }))
            }
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="kanban">Kanban</Radio.Button>
            <Radio.Button value="list">List</Radio.Button>
          </Radio.Group>
          <Tooltip title="Refresh now">
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              size="small"
              onClick={() => refetch()}
              loading={isFetching && !isLoading}
            >
              Refresh
            </Button>
          </Tooltip>
          {/* ✅ Waiters can create orders */}
          {(isVendor || isManager || isWaiter) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => setCreateOpen(true)}
            >
              New Order
            </Button>
          )}
        </div>
      </div>
      <CreateOrderDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        restaurantId={restaurant?.id ?? ""}
        userRole={isWaiter ? "waiter" : isManager ? "manager" : "vendor"}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["vendor-orders", restaurant?.id] });
          setCreateOpen(false);
        }}
      />
      {/* ── Toolbar ── */}
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }} align="middle">
        <Col flex="auto" style={{ minWidth: 180, maxWidth: 320 }}>
          <Input
            placeholder="Search order, address, table…"
            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            allowClear
            size="small"
          />
        </Col>
        <Col>
          <Space size={4}>
            {DATE_PRESETS.map((p) => {
              const isActive =
                p.value === null
                  ? !filters.dateRange
                  : filters.dateRange?.[0]?.isSame(p.value[0]) &&
                    filters.dateRange?.[1]?.isSame(p.value[1]);
              return (
                <Button
                  key={p.label}
                  size="small"
                  type={isActive ? "primary" : "default"}
                  onClick={() =>
                    setFilters((f) => ({ ...f, dateRange: p.value }))
                  }
                >
                  {p.label}
                </Button>
              );
            })}
          </Space>
        </Col>
        <Col>
          <Badge count={activeFilterCount} size="small" offset={[-4, 4]}>
            <Button
              icon={<FilterOutlined />}
              size="small"
              type={activeFilterCount > 0 ? "primary" : "default"}
              onClick={() => setDrawerOpen(true)}
            >
              Filters
            </Button>
          </Badge>
        </Col>
        {activeFilterCount > 0 && (
          <Col>
            <Button
              size="small"
              type="link"
              danger
              icon={<CloseCircleOutlined />}
              onClick={resetFilters}
            >
              Clear all
            </Button>
          </Col>
        )}
        <Col style={{ marginLeft: "auto" }}>
          <Typography.Text style={{ fontSize: 12, color: "#999" }}>
            Showing{" "}
            <strong style={{ color: "#333" }}>{filteredOrders.length}</strong>{" "}
            of {orders.length} orders
          </Typography.Text>
        </Col>
      </Row>

      <ActiveFilterTags filters={filters} onChange={setFilters} />

      {/* ✅ Waiters don't see revenue in summary */}
      <SummaryStrip
        orders={orders}
        filtered={filteredOrders}
        canSeeRevenue={canSeeRevenue}
      />

      {/* ── Kanban / List ── */}
      {filters.viewMode === "kanban" ? (
        <div style={{ overflowX: "auto", paddingBottom: 12 }}>
          <Row gutter={12} style={{ flexWrap: "nowrap", minWidth: 1295 }}>
            {STATUS_COLUMNS.map((col) => {
              const colOrders = filteredOrders.filter(
                (o) => o.status === col.key,
              );
              const isFiltered =
                filters.statuses.length > 0 &&
                !filters.statuses.includes(col.key);
              return (
                <Col
                  key={col.key}
                  style={{
                    minWidth: 175,
                    flex: "0 0 175px",
                    opacity: isFiltered ? 0.35 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <Card
                    size="small"
                    title={
                      <span style={{ fontSize: 13 }}>
                        <Badge color={col.hex} />
                        <span style={{ marginLeft: 4 }}>{col.label}</span>
                        <Tag
                          color={col.color}
                          style={{ borderRadius: 10, marginLeft: 4 }}
                        >
                          {colOrders.length}
                        </Tag>
                      </span>
                    }
                    style={{
                      background: "#fafafa",
                      minHeight: 480,
                      borderRadius: 12,
                      border: "1px solid #f0f0f0",
                    }}
                    styles={{ body: { padding: "8px" } }}
                  >
                    {colOrders.length === 0 && (
                      <div
                        style={{
                          color: "#ccc",
                          textAlign: "center",
                          marginTop: 40,
                          fontSize: 12,
                        }}
                      >
                        No orders
                      </div>
                    )}
                    {colOrders.map((order) => (
                      <Card
                        key={order.id}
                        size="small"
                        hoverable
                        style={{
                          marginBottom: 8,
                          cursor: "pointer",
                          borderRadius: 10,
                          borderLeft: `3px solid ${col.hex}`,
                        }}
                        styles={{ body: { padding: "10px 12px" } }}
                        onClick={() => setSelected(order)}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {formatOrderId(order)}
                          {itemAddedEvents[String(order.id)] && (
                            <Tag
                              color="orange"
                              style={{
                                fontSize: 10,
                                padding: "0 5px",
                                margin: 0,
                              }}
                            >
                              +items
                            </Tag>
                          )}
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#444", marginTop: 2 }}
                        >
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                        </div>
                        {/* ✅ Show order type icon + table name on kanban card */}
                        <div
                          style={{ fontSize: 11, color: "#999", marginTop: 2 }}
                        >
                          {orderTypeIcon(order.orderType)}{" "}
                          {formatTime(order.createdAt)}
                          {order.orderType === "dinein" && order.tableName && (
                            <span style={{ marginLeft: 4, color: "#1677ff" }}>
                              · T:{order.tableName}
                            </span>
                          )}
                        </div>
                        <Tag
                          color={
                            order.paymentStatus === "paid" ? "green" : "orange"
                          }
                          style={{
                            marginTop: 4,
                            fontSize: 10,
                            borderRadius: 4,
                          }}
                        >
                          {order.paymentMethod} · {order.paymentStatus}
                        </Tag>
                      </Card>
                    ))}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ) : (
        <ListView orders={filteredOrders} onSelect={setSelected} />
      )}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        title={
          selected ? (
            <span>
              Order{" "}
              <span style={{ fontFamily: "monospace" }}>
                {formatOrderId(selected)}
              </span>
            </span>
          ) : null
        }
        footer={null}
        width={580}
        destroyOnHidden={false}
        styles={{ body: { paddingTop: 8 } }}
      >
        {selected && (
          <OrderDetail
            order={selected}
            updateStatus={updateStatus}
            cancelOrder={cancelOrder}
            assignAgent={assignAgent}
            settleBill={settleBill}
            onClose={() => setSelected(null)}
            canMutateStatus={canMutateStatus}
            canCancel={canCancel}
            canAssignAgent={canAssignAgent}
            userRoleKey={userRoleKey}
            restaurantId={restaurant?.id ?? ""}
            itemAddedAt={itemAddedEvents[String(selected.id)] ?? null}
          />
        )}
      </Modal>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

const OrderDetail: React.FC<{
  order: Order;
  updateStatus: any;
  cancelOrder: any;
  assignAgent: any;
  settleBill: any;
  onClose: () => void;
  canMutateStatus: boolean;
  canCancel: boolean;
  canAssignAgent: boolean;
  userRoleKey: string | null;
  restaurantId: string;
  itemAddedAt: string | null;
}> = ({
  order,
  updateStatus,
  cancelOrder,
  assignAgent,
  settleBill,
  canMutateStatus,
  canCancel,
  canAssignAgent,
  userRoleKey,
  restaurantId,
  itemAddedAt,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const { data: full, isLoading } = useQuery({
    queryKey: ["order-detail", order.id],
    queryFn: async () => {
      const res = await orderService.getOrder(String(order.id));
      return normalizeOrder(res.data.data);
    },
    staleTime: 30_000,
  });

  const { data: agents } = useQuery({
    queryKey: ["agents", restaurantId],
    enabled: canAssignAgent && !!restaurantId,
    queryFn: async () => {
      const res = await restaurantService.getDeliveryAgents(restaurantId);
      const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return raw.filter((a: any) => a.status === "approved");
    },
    staleTime: 60_000,
  });

  const o = full ?? order;

  const { data: calcData } = useQuery({
    queryKey: ["order-calc", order.id, o.items?.length],
    enabled: !!o.items?.length && !!order.restaurantId,
    queryFn: async () => {
      const res = await orderService.calculateCart({
        restaurant_id: String(order.restaurantId),
        items: o.items.map((item) => ({
          menu_item_id: String(item.menuItemId),
          quantity: item.quantity,
        })),
        coupon_code: o.couponCode ?? undefined,
        order_type: o.orderType ?? undefined,
      });
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const breakdown = {
    subtotal: calcData?.subtotal_amount ?? o.subtotalAmount,
    tax: calcData?.tax_amount ?? o.taxAmount,
    delivery: calcData?.delivery_fee ?? o.deliveryFee,
    discount: calcData?.discount_amount ?? o.discountAmount,
    platform: calcData?.platform_fee ?? o.platformFee,
    total: calcData?.total_amount ?? o.totalAmount,
  };

  // ✅ Use order-type-aware next status (waiters always get undefined)
  const nextStatus = getNextStatus(o, userRoleKey);
  const nextLabel = getNextLabel(o, nextStatus);
  const canCancel_ =
    canCancel && !["completed", "cancelled"].includes(o.status);

  // ✅ Assign agent only for delivery orders
  const showAssignAgent =
    canAssignAgent &&
    o.orderType === "delivery" &&
    ["ready", "out_for_delivery"].includes(o.status);

  const isMutating =
    updateStatus.isPending || cancelOrder.isPending || assignAgent.isPending;

  const itemsWereAdded =
    ["accepted", "preparing"].includes(o.status) &&
    (!!itemAddedAt ||
      (!!o.updatedAt &&
        !!o.createdAt &&
        new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime() >
          60_000));

  return (
    <>
      {itemsWereAdded && (
        <Alert
          type="warning"
          showIcon
          message="Items were added after order was placed"
          description={
            itemAddedAt
              ? `Waiter added items at ${new Date(itemAddedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })} — all items shown below including new ones.`
              : `Order was updated after placement — new items are highlighted below.`
          }
          style={{ marginBottom: 12 }}
        />
      )}
      <Descriptions
        column={2}
        size="small"
        bordered
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Status">
          <Tag>{o.status.replace(/_/g, " ")}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Total">
          <strong>₹{o.totalAmount.toLocaleString("en-IN")}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Payment">
          {o.paymentMethod} ·{" "}
          <Tag
            color={o.paymentStatus === "paid" ? "green" : "orange"}
            style={{ marginLeft: 2 }}
          >
            {o.paymentStatus}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Time">
          {formatDateTime(o.createdAt)}
        </Descriptions.Item>

        {/* ✅ Order type with colored icon */}
        {o.orderType && (
          <Descriptions.Item label="Order Type">
            <Tag
              color={orderTypeColor(o.orderType)}
              style={{ textTransform: "capitalize" }}
            >
              {orderTypeIcon(o.orderType)} {o.orderType}
            </Tag>
          </Descriptions.Item>
        )}

        {/* ✅ Table info for dine-in orders */}
        {o.orderType === "dinein" && o.tableName && (
          <Descriptions.Item label="Table">
            <Tag color="geekblue" style={{ fontSize: 13 }}>
              🪑 Table {o.tableName}
              {o.tableCapacity ? ` (${o.tableCapacity} seats)` : ""}
            </Tag>
          </Descriptions.Item>
        )}

        {breakdown.delivery > 0 && (
          <Descriptions.Item label="Delivery Fee">
            ₹{breakdown.delivery.toLocaleString("en-IN")}
          </Descriptions.Item>
        )}
        {breakdown.discount > 0 && (
          <Descriptions.Item label="Discount">
            <span style={{ color: "#52c41a" }}>
              −₹{breakdown.discount.toLocaleString("en-IN")}
            </span>
          </Descriptions.Item>
        )}
        {o.deliveryAddress && (
          <Descriptions.Item label="Address" span={2}>
            {o.deliveryAddress}
          </Descriptions.Item>
        )}
        {o.couponCode && (
          <Descriptions.Item label="Coupon" span={2}>
            <Tag color="purple">{o.couponCode}</Tag>
          </Descriptions.Item>
        )}
        {o.specialInstructions && (
          <Descriptions.Item label="Note" span={2}>
            {o.specialInstructions}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider orientation="left" plain>
        Items
      </Divider>
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 16 }}>
          <Spin size="small" />
        </div>
      ) : o.items?.length ? (
        <>
          {o.items.map((item, idx) => {
            const isHighlighted = itemsWereAdded;
            return (
              <div
                key={item.id ?? idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                  fontSize: 13,
                  background: isHighlighted ? "#fffbe6" : "transparent",
                  borderLeft: isHighlighted
                    ? "3px solid #fa8c16"
                    : "3px solid transparent",
                  paddingLeft: isHighlighted ? 8 : 0,
                  borderRadius: 4,
                }}
              >
                <span>
                  <strong>{item.quantity}×</strong> {item.name}
                  {item.variantName && (
                    <span style={{ color: "#888", fontSize: 11 }}>
                      {" "}
                      ({item.variantName})
                    </span>
                  )}
                  {item.notes && (
                    <div style={{ color: "#aaa", fontSize: 11 }}>
                      📝 {item.notes}
                    </div>
                  )}
                </span>
                <span
                  style={{ color: "#555", whiteSpace: "nowrap", marginLeft: 8 }}
                >
                  ₹{item.subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            );
          })}
          <Divider style={{ margin: "8px 0" }} />
          <div style={{ fontSize: 12, color: "#888" }}>
            {breakdown.subtotal > 0 && (
              <Row justify="space-between">
                <Col>Subtotal</Col>
                <Col>₹{breakdown.subtotal.toLocaleString("en-IN")}</Col>
              </Row>
            )}
            {breakdown.tax > 0 && (
              <Row justify="space-between">
                <Col>Tax (5%)</Col>
                <Col>₹{breakdown.tax.toLocaleString("en-IN")}</Col>
              </Row>
            )}
            {breakdown.delivery > 0 && (
              <Row justify="space-between">
                <Col>Delivery</Col>
                <Col>₹{breakdown.delivery.toLocaleString("en-IN")}</Col>
              </Row>
            )}
            {breakdown.discount > 0 && (
              <Row justify="space-between">
                <Col>Discount</Col>
                <Col style={{ color: "#52c41a" }}>
                  −₹{breakdown.discount.toLocaleString("en-IN")}
                </Col>
              </Row>
            )}
            {breakdown.platform > 0 && (
              <Row justify="space-between">
                <Col>Platform Fee</Col>
                <Col>₹{breakdown.platform.toLocaleString("en-IN")}</Col>
              </Row>
            )}
          </div>
        </>
      ) : (
        <div style={{ color: "#999", fontSize: 12 }}>
          Item details unavailable
        </div>
      )}

      <Divider />

      {/* ✅ Assign agent — delivery orders only */}
      {showAssignAgent && (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text
            strong
            style={{ display: "block", marginBottom: 6, fontSize: 13 }}
          >
            <CarOutlined style={{ marginRight: 6 }} />
            Assign Delivery Agent
          </Typography.Text>
          <Row gutter={8}>
            <Col flex="auto">
              <Select
                placeholder="Select agent"
                style={{ width: "100%" }}
                value={selectedAgentId}
                onChange={setSelectedAgentId}
                size="small"
                options={(agents ?? []).map((a: any) => ({
                  label: `${a.name} (${a.mobile_number ?? a.mobileNumber ?? ""})`,
                  value: a.id,
                }))}
              />
            </Col>
            <Col>
              <Button
                size="small"
                type="primary"
                icon={<CarOutlined />}
                loading={assignAgent.isPending}
                disabled={!selectedAgentId || isMutating}
                onClick={() =>
                  selectedAgentId &&
                  assignAgent.mutate({
                    orderId: String(o.id),
                    agentId: selectedAgentId,
                  })
                }
              >
                Assign
              </Button>
            </Col>
          </Row>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <Row gutter={8} align="middle">
        {/* ✅ Only show action buttons if user has permission */}
        {canMutateStatus && nextStatus && nextLabel && (
          <Col>
            <Button
              type="primary"
              loading={updateStatus.isPending}
              disabled={isMutating}
              onClick={() =>
                updateStatus.mutate({ id: String(o.id), status: nextStatus })
              }
            >
              {nextLabel}
            </Button>
          </Col>
        )}
        {canCancel_ && (
          <Col>
            <Button
              danger
              loading={cancelOrder.isPending}
              disabled={isMutating}
              onClick={() => cancelOrder.mutate(String(o.id))}
            >
              Cancel Order
            </Button>
          </Col>
        )}
        {/* ✅ Waiters see read-only message */}
        {!canMutateStatus && !canCancel_ && userRoleKey === "waiter" && (
          <Col>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              👁️ View-only mode — contact manager to update order status
            </Typography.Text>
          </Col>
        )}
        {/* ✅ Settle Bill for DineIn/Takeaway */}
        {canMutateStatus &&
          (o.orderType === "dinein" || o.orderType === "takeaway") &&
          o.status === "completed" &&
          o.paymentStatus !== "paid" && (
            <Col span={24} style={{ marginTop: 8 }}>
              <div
                style={{
                  background: "#fffbe6",
                  border: "1px dashed #faad14",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <Typography.Text
                  strong
                  style={{ display: "block", marginBottom: 8, fontSize: 13 }}
                >
                  💰 Collect Payment
                </Typography.Text>
                <Row gutter={8}>
                  <Col span={12}>
                    <Button
                      block
                      loading={settleBill.isPending}
                      disabled={isMutating}
                      onClick={() =>
                        settleBill.mutate({
                          orderId: String(o.id),
                          paymentMethod: "COD",
                        })
                      }
                    >
                      💵 Cash
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      block
                      type="primary"
                      loading={settleBill.isPending}
                      disabled={isMutating}
                      onClick={() =>
                        settleBill.mutate({
                          orderId: String(o.id),
                          paymentMethod: "Online",
                        })
                      }
                    >
                      💳 Online
                    </Button>
                  </Col>
                </Row>
              </div>
            </Col>
          )}

        {!nextStatus &&
          !canCancel_ &&
          userRoleKey !== "waiter" &&
          o.paymentStatus === "paid" && (
            <Col>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Order complete — no further actions available
              </Typography.Text>
            </Col>
          )}
      </Row>
    </>
  );
};
