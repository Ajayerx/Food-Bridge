import React from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Rate,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowUpOutlined,
  ReloadOutlined,
  ShopOutlined,
  ShoppingOutlined,
  StarOutlined,
  TeamOutlined,
  CarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDashboard } from "../../hooks/useDashboard";
import type { TopRestaurant, DashboardChartPoint } from "../../types";

const { Title, Text } = Typography;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const num = (n: number) => new Intl.NumberFormat("en-IN").format(n);

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  color: string;
  icon: React.ReactNode;
  sub?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  color,
  icon,
  sub,
  loading,
  suffix,
}) => (
  <Card
    size="small"
    style={{
      borderRadius: 12,
      borderTop: `3px solid ${color}`,
      height: "100%",
    }}
  >
    <Skeleton loading={loading} active paragraph={{ rows: 2 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {title}
          </Text>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color,
              lineHeight: 1.2,
              marginTop: 4,
            }}
          >
            {value}
            {suffix && (
              <span style={{ fontSize: 14, marginLeft: 2 }}>{suffix}</span>
            )}
          </div>
          {sub && (
            <Text
              type="secondary"
              style={{ fontSize: 12, marginTop: 4, display: "block" }}
            >
              {sub}
            </Text>
          )}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color,
          }}
        >
          {icon}
        </div>
      </div>
    </Skeleton>
  </Card>
);

// ── Top restaurants columns ───────────────────────────────────────────────────
const topRestaurantCols = [
  {
    title: "Restaurant",
    dataIndex: "name",
    render: (name: string, r: TopRestaurant) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar
          src={r.logoUrl}
          icon={<ShopOutlined />}
          style={{ background: "#f0f0f0", color: "#666" }}
        />
        <Text strong>{name}</Text>
      </div>
    ),
  },
  {
    title: "Orders",
    dataIndex: "totalOrders",
    render: (v: number) => num(v),
    sorter: (a: TopRestaurant, b: TopRestaurant) =>
      a.totalOrders - b.totalOrders,
  },
  {
    title: "Revenue",
    dataIndex: "totalRevenue",
    render: (v: number) => fmt(v),
    sorter: (a: TopRestaurant, b: TopRestaurant) =>
      a.totalRevenue - b.totalRevenue,
  },
  {
    title: "Rating",
    dataIndex: "avgRating",
    render: (v: number) => (
      <span>
        <StarOutlined style={{ color: "#faad14", marginRight: 4 }} />
        {v.toFixed(1)}
      </span>
    ),
    sorter: (a: TopRestaurant, b: TopRestaurant) => a.avgRating - b.avgRating,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export const AdminDashboardPage: React.FC = () => {
  const { stats: s, isLoading, isError, refetch } = useDashboard();

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load dashboard"
        description="Could not fetch dashboard stats. Please try again."
        action={
          <Button size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
        style={{ margin: 24 }}
      />
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Platform Dashboard
        </Title>
        <Tooltip title="Refresh">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Tooltip>
      </div>

      {/* ── Revenue KPIs ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Revenue"
            value={fmt(s?.totalRevenue ?? 0)}
            color="#52c41a"
            icon={<DollarOutlined />}
            sub={`Platform commission: ${fmt(s?.platformCommission ?? 0)}`}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Today's Revenue"
            value={fmt(s?.todayRevenue ?? 0)}
            color="#1677ff"
            icon={<ArrowUpOutlined />}
            sub={`This month: ${fmt(s?.monthRevenue ?? 0)}`}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Orders"
            value={num(s?.totalOrders ?? 0)}
            color="#722ed1"
            icon={<ShoppingOutlined />}
            sub={`Today: ${num(s?.todayOrders ?? 0)}`}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Avg. Platform Rating"
            value={(s?.avgPlatformRating ?? 0).toFixed(1)}
            suffix="/ 5"
            color="#faad14"
            icon={<StarOutlined />}
            sub={`From ${num(s?.totalReviews ?? 0)} reviews`}
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* ── Order status KPIs ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Pending Orders"
            value={num(s?.pendingOrders ?? 0)}
            color="#fa8c16"
            icon={<ClockCircleOutlined />}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Active Orders"
            value={num(s?.activeOrders ?? 0)}
            color="#1677ff"
            icon={<CarOutlined />}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Cancelled Orders"
            value={num(s?.cancelledOrders ?? 0)}
            color="#ff4d4f"
            icon={<CloseCircleOutlined />}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Total Deliveries"
            value={num(s?.totalDeliveries ?? 0)}
            color="#13c2c2"
            icon={<CheckCircleOutlined />}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Active Agents"
            value={num(s?.activeAgents ?? 0)}
            color="#52c41a"
            icon={<CarOutlined />}
            sub={`Available: ${num(s?.availableAgents ?? 0)}`}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Pending Approvals"
            value={num(s?.pendingRestaurants ?? 0)}
            color="#eb2f96"
            icon={<ShopOutlined />}
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* ── User & Restaurant KPIs ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Total Users"
            value={num(s?.totalUsers ?? 0)}
            color="#1677ff"
            icon={<TeamOutlined />}
            sub={`New today: ${num(s?.newUsersToday ?? 0)}`}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Customers"
            value={num(s?.totalCustomers ?? 0)}
            color="#722ed1"
            icon={<UserOutlined />}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Vendors"
            value={num(s?.totalVendors ?? 0)}
            color="#13c2c2"
            icon={<ShopOutlined />}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Delivery Agents"
            value={num(s?.totalAgents ?? 0)}
            color="#fa8c16"
            icon={<CarOutlined />}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="Total Restaurants"
            value={num(s?.totalRestaurants ?? 0)}
            color="#52c41a"
            icon={<ShopOutlined />}
            sub={`Active: ${num(s?.activeRestaurants ?? 0)}`}
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatCard
            title="New Users (Month)"
            value={num(s?.newUsersThisMonth ?? 0)}
            color="#eb2f96"
            icon={<ArrowUpOutlined />}
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* ── Charts ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Revenue Chart */}
        <Col xs={24} lg={12}>
          <Card
            title="Revenue Trend (Last 7 Days)"
            size="small"
            style={{ borderRadius: 12 }}
          >
            <Skeleton loading={isLoading} active paragraph={{ rows: 5 }}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={s?.revenueChart ?? []}>
                  <defs>
                    <linearGradient
                      id="revenueGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <ReTooltip formatter={(v: number) => fmt(v)} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Revenue"
                    stroke="#52c41a"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Skeleton>
          </Card>
        </Col>

        {/* Orders Chart */}
        <Col xs={24} lg={12}>
          <Card
            title="Orders Trend (Last 7 Days)"
            size="small"
            style={{ borderRadius: 12 }}
          >
            <Skeleton loading={isLoading} active paragraph={{ rows: 5 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={s?.ordersChart ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <ReTooltip />
                  <Bar
                    dataKey="count"
                    name="Orders"
                    fill="#1677ff"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Skeleton>
          </Card>
        </Col>
      </Row>

      {/* ── Top Restaurants ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title="Top Restaurants"
            size="small"
            style={{ borderRadius: 12 }}
          >
            <Skeleton loading={isLoading} active paragraph={{ rows: 5 }}>
              <Table<TopRestaurant>
                dataSource={s?.topRestaurants ?? []}
                columns={topRestaurantCols}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
