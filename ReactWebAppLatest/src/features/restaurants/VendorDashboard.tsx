import React, { useMemo, useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Typography,
  Skeleton,
  Empty,
  Switch,
  Tooltip,
  Alert,
} from "antd";
import {
  ShoppingOutlined,
  RiseOutlined,
  FireOutlined,
  StarFilled,
  TrophyOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltipPrimitive,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { reportService } from "../../services/report.service";
import { useRestaurant } from "../../hooks/useRestaurant";
import { socket } from "../../services/socket.service"; // adjust path to your socket instance

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRevenueByDay(
  totalRevenue: number,
  existingData: { date: string; revenue: number }[],
): { date: string; revenue: number }[] {
  const days: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    const existing = existingData.find((r) => r.date === key);
    days.push({ date: label, revenue: existing?.revenue ?? 0 });
  }
  const hasAnyRevenue = days.some((d) => d.revenue > 0);
  if (!hasAnyRevenue && totalRevenue > 0) {
    days[days.length - 1].revenue = totalRevenue;
  }
  return days;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    value,
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: 10,
        padding: "10px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        fontSize: 13,
      }}
    >
      <div style={{ color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: "#1677ff", fontSize: 15 }}>
        ₹{formatINR(payload[0].value)}
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  bg: string;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  bg,
  loading,
}) => (
  <Card
    style={{
      borderRadius: 16,
      border: "1px solid #f0f0f0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}
    styles={{ body: { padding: "20px 24px" } }}
  >
    {loading ? (
      <Skeleton active paragraph={{ rows: 1 }} title={false} />
    ) : (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              color: "#8c8c8c",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 22,
              color: "#1a1a1a",
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
        </div>
      </div>
    )}
  </Card>
);

// ─── Rating Display ───────────────────────────────────────────────────────────

const RatingValue: React.FC<{ rating?: number; total?: number }> = ({
  rating,
  total,
}) => {
  // avgRating may be 0 (no reviews) or undefined/null (field missing from API)
  if (rating == null || isNaN(Number(rating))) {
    return (
      <span style={{ color: "#bbb", fontSize: 15, fontWeight: 400 }}>
        No ratings yet
      </span>
    );
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span>{Number(rating).toFixed(1)}</span>
      <StarFilled style={{ color: "#faad14", fontSize: 16 }} />
      {total != null && total > 0 && (
        <span style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400 }}>
          ({total})
        </span>
      )}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const VendorDashboard: React.FC = () => {
  const { restaurant, togglingOpen, toggleOpen } = useRestaurant();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86_400_000)
    .toISOString()
    .split("T")[0];

  // VendorDashboard.tsx — in the useQuery block
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor-report", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const res = await reportService.getVendorReport(restaurant!.id, {
        from: weekAgo,
        to: today,
      });
      return res.data.data;
    },
  });

  // ── Real-time order updates ───────────────────────────────────────────────
  useEffect(() => {
    if (!restaurant?.id) return;

    socket.emit("joinRestaurantRoom", restaurant.id);

    const handleNewOrder = (data: any) => {
      console.log("🆕 New order:", data);
      queryClient.invalidateQueries({
        queryKey: ["vendor-report", restaurant.id],
      });
      // If you have an orders query, invalidate that too:
      // queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    socket.on("newOrder", handleNewOrder);

    return () => {
      socket.off("newOrder", handleNewOrder);
    };
  }, [restaurant?.id]);

  const chartData = useMemo(
    () => buildRevenueByDay(data?.totalRevenue ?? 0, data?.revenueByDay ?? []),
    [data],
  );

  const maxRevenue = useMemo(
    () => Math.max(...chartData.map((d) => d.revenue), 1),
    [chartData],
  );

  if (!restaurant) {
    return (
      <Alert
        type="warning"
        showIcon
        message="No restaurant linked"
        description="No restaurant is linked to your account. Please contact support."
        style={{ borderRadius: 12 }}
      />
    );
  }

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load dashboard"
        description="Could not fetch report data. Please try refreshing."
        style={{ borderRadius: 12 }}
      />
    );
  }

  const stats: StatCardProps[] = [
    {
      title: "Total Orders (7d)",
      value: data?.totalOrders ?? 0,
      icon: <ShoppingOutlined />,
      color: "#1677ff",
      bg: "#e8f0fe",
      loading: isLoading,
    },
    {
      title: "Revenue (7d)",
      value: `₹${formatINR(data?.totalRevenue ?? 0)}`,
      icon: <RiseOutlined />,
      color: "#52c41a",
      bg: "#f6ffed",
      loading: isLoading,
    },
    {
      title: "Avg Order Value",
      value: `₹${formatINR(data?.avgOrderValue ?? 0)}`,
      icon: <FireOutlined />,
      color: "#fa8c16",
      bg: "#fff7e6",
      loading: isLoading,
    },
    {
      title: "Rating",
      value: (
        <RatingValue
          rating={restaurant.avgRating}
          total={restaurant.totalRatings}
        />
      ),
      icon: <StarFilled />,
      color: "#faad14",
      bg: "#fffbe6",
      // Rating comes from the restaurant object (not the report query), so never shows skeleton
      loading: false,
    },
  ];

  return (
    <div style={{ padding: "4px 0" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Dashboard
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {new Date(weekAgo).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
            {" — "}
            {new Date(today).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Typography.Text>
        </div>

        {/* ── Open / Close Toggle ── */}
        {/* ── Open / Close Toggle ── */}
        <Tooltip
          title={
            restaurant.isOpen
              ? "Click to deactivate your restaurant"
              : "Click to activate your restaurant"
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: restaurant.isOpen ? "#f6ffed" : "#fff1f0",
              border: `1px solid ${restaurant.isOpen ? "#b7eb8f" : "#ffa39e"}`,
              borderRadius: 12,
              padding: "10px 16px",
              cursor: togglingOpen ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onClick={!togglingOpen ? toggleOpen : undefined}
          >
            <PoweroffOutlined
              style={{
                color: restaurant.isOpen ? "#52c41a" : "#ff4d4f",
                fontSize: 16,
              }}
            />
            <span
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: restaurant.isOpen ? "#389e0d" : "#cf1322",
                minWidth: 44,
                userSelect: "none",
              }}
            >
              {restaurant.isOpen ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={restaurant.isOpen}
              loading={togglingOpen}
              onChange={!togglingOpen ? toggleOpen : undefined}
              onClick={(_, e) => e.stopPropagation()}
              style={{
                background: restaurant.isOpen ? "#52c41a" : "#d9d9d9",
              }}
            />
          </div>
        </Tooltip>
      </div>

      {/* ── Stat Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((s) => (
          <Col key={s.title} xs={24} sm={12} xl={6}>
            <StatCard {...s} />
          </Col>
        ))}
      </Row>

      {/* ── Revenue Chart ── */}
      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            Revenue — Last 7 Days
          </span>
        }
        style={{
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: "16px 20px 20px" } }}
      >
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1677ff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f5f5f5"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#8c8c8c" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#8c8c8c" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                }
                domain={[0, maxRevenue * 1.2]}
                width={55}
              />
              <ChartTooltipPrimitive content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1677ff"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ r: 4, fill: "#1677ff", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{
                  r: 6,
                  fill: "#1677ff",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Top Menu Items ── */}
      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            <TrophyOutlined style={{ color: "#faad14", marginRight: 8 }} />
            Top Menu Items
          </span>
        }
        style={{
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
        styles={{ body: { padding: "12px 20px 20px" } }}
      >
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : !data?.topItems?.length ? (
          <Empty
            description="No item data for this period"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[12, 12]}>
            {data.topItems.slice(0, 5).map((item: any, i: number) => {
              const medals = ["🥇", "🥈", "🥉"];
              const medal = medals[i] ?? `#${i + 1}`;
              const barWidth = Math.round(
                (item.revenue / (data.topItems[0]?.revenue || 1)) * 100,
              );
              return (
                <Col key={item.menuItemId} xs={24} sm={12} xl={8}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: 12,
                      border: "1px solid #f0f0f0",
                      background: i === 0 ? "#fffbe6" : "#fafafa",
                    }}
                    styles={{ body: { padding: "14px 16px" } }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span style={{ fontSize: 22, lineHeight: 1 }}>
                        {medal}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#1a1a1a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                          <span style={{ color: "#8c8c8c", fontSize: 12 }}>
                            {item.totalOrders} orders
                          </span>
                          <span
                            style={{
                              color: "#52c41a",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            ₹{formatINR(item.revenue)}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            height: 4,
                            borderRadius: 4,
                            background: "#f0f0f0",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${barWidth}%`,
                              height: "100%",
                              background:
                                i === 0
                                  ? "linear-gradient(90deg,#faad14,#fa8c16)"
                                  : "linear-gradient(90deg,#1677ff,#69b1ff)",
                              borderRadius: 4,
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </div>
  );
};
