import React, { useState } from "react";
import { Card, Col, DatePicker, Row, Statistic, Table, Tabs, Typography, Spin, Alert, Skeleton, Empty } from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { reportService } from "../../services/report.service";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const COLORS = ["#1677ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#13c2c2", "#eb2f96", "#fa8c16"];

function formatCurrency(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

const fmt = (n: number | undefined | null) =>
  `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(n ?? 0)}`;

export const AdminReportsPage: React.FC = () => {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [activeTab, setActiveTab] = useState("platform");

  const from = range[0].format("YYYY-MM-DD");
  const to = range[1].format("YYYY-MM-DD");

  const platformQuery = useQuery({
    queryKey: ["admin-report-platform", from, to],
    queryFn: () => reportService.getPlatformReport({ from, to }).then((r) => r.data.data),
    enabled: activeTab === "platform",
  });

  const vendorsQuery = useQuery({
    queryKey: ["admin-report-vendors", from, to],
    queryFn: () => reportService.getAdminVendorsReport({ from, to }).then((r) => r.data.data),
    enabled: activeTab === "vendors",
  });

  const financialsQuery = useQuery({
    queryKey: ["admin-report-financials", from, to],
    queryFn: () => reportService.getAdminFinancialsReport({ from, to, groupBy: "day" }).then((r) => r.data.data),
    enabled: activeTab === "financials",
  });

  const platformData = platformQuery.data;
  const vendorsData = vendorsQuery.data;
  const financialsData = financialsQuery.data;

  const payoutCols = [
    { title: "Restaurant", dataIndex: "name", key: "name" },
    {
      title: "Gross Revenue",
      dataIndex: "grossRevenue",
      key: "grossRevenue",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Platform Fee",
      dataIndex: "platformFee",
      key: "platformFee",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Net Payout",
      dataIndex: "netPayout",
      key: "netPayout",
      render: (v: number) => <strong>{formatCurrency(v)}</strong>,
    },
  ];

  const vendorCols = [
    { title: "Vendor", dataIndex: "vendorName", key: "vendorName" },
    {
      title: "Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      sorter: (a: any, b: any) => a.totalOrders - b.totalOrders,
    },
    {
      title: "Revenue",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      render: (v: number) => formatCurrency(v),
      sorter: (a: any, b: any) => a.totalRevenue - b.totalRevenue,
    },
    {
      title: "Commission",
      dataIndex: "commission",
      key: "commission",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Active Restaurants",
      dataIndex: "activeRestaurants",
      key: "activeRestaurants",
    },
    {
      title: "Avg Rating",
      dataIndex: "avgRating",
      key: "avgRating",
      render: (v: number) => (v ? v.toFixed(1) : "-"),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Admin Reports
        </Typography.Title>
        <RangePicker value={range} onChange={(v: any) => v && setRange(v)} />
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" style={{ marginBottom: 24 }}>
        {/* ── Tab 1: Platform Overview ─────────────────────────────── */}
        <Tabs.TabPane tab="Platform Overview" key="platform">
          {platformQuery.isLoading ? (
            <Spin size="large" style={{ display: "block", margin: "40px auto" }} />
          ) : platformQuery.error ? (
            <Alert message="Failed to load platform report" type="error" showIcon />
          ) : (
            <>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                {[
                  { title: "Total Revenue", value: fmt(platformData?.totalRevenue) },
                  { title: "Total Orders", value: platformData?.totalOrders, precision: 0 },
                  { title: "Avg Order Value", value: platformData?.avgOrderValue, prefix: "₹", precision: 2 },
                  { title: "Platform Commission", value: fmt(platformData?.platformCommission) },
                  { title: "Active Restaurants", value: platformData?.totalRestaurants, precision: 0 },
                  { title: "Total Users", value: platformData?.totalUsers, precision: 0 },
                  { title: "New Users", value: platformData?.newUsersToday, precision: 0 },
                ].map((s) => {
                  const isFormatted = typeof s.value === "string";
                  return (
                    <Col xs={24} sm={12} lg={6} key={s.title} style={{ marginBottom: 12 }}>
                      <Card>
                        <Statistic
                          title={s.title}
                          value={isFormatted ? s.value : (s.value ?? 0)}
                          prefix={isFormatted ? undefined : (s as any).prefix}
                          loading={platformQuery.isLoading}
                          precision={isFormatted ? undefined : (s as any).precision}
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                  <Card title="Revenue Over Time">
                    <Skeleton loading={platformQuery.isLoading} active paragraph={{ rows: 5 }}>
                      {(platformData?.revenueByDay?.length ?? 0) > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={platformData?.revenueByDay ?? []}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="revChartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1677ff" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }}
                              tickFormatter={(v: number) => `₹${v}`} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Area type="monotone" dataKey="revenue"
                              stroke="#1677ff" strokeWidth={2} fill="url(#revChartGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <Empty description="No revenue data for this period" />
                      )}
                    </Skeleton>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Revenue by Restaurant">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={platformData?.revenueByRestaurant ?? []}
                          dataKey="revenue"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }: any) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {(platformData?.revenueByRestaurant ?? []).map(
                            (_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            )
                          )}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>

              <Card title="Payout Summary">
                <Table
                  dataSource={platformData?.payoutSummary ?? []}
                  columns={payoutCols}
                  rowKey="restaurantId"
                  size="small"
                />
              </Card>
            </>
          )}
        </Tabs.TabPane>

        {/* ── Tab 2: Vendor Performance ───────────────────────────── */}
        <Tabs.TabPane tab="Vendor Performance" key="vendors">
          {vendorsQuery.isLoading ? (
            <Spin size="large" style={{ display: "block", margin: "40px auto" }} />
          ) : vendorsQuery.error ? (
            <Alert message="Failed to load vendor report" type="error" showIcon />
          ) : (
            <Card title="Top Vendors">
              <Table
                dataSource={vendorsData?.vendors ?? []}
                columns={vendorCols}
                rowKey="vendorId"
                size="small"
                pagination={{ pageSize: 10, showTotal: (t: number) => `Total: ${vendorsData?.totalCount ?? t} vendors` }}
              />
            </Card>
          )}
        </Tabs.TabPane>

        {/* ── Tab 3: Financials ──────────────────────────────────── */}
        <Tabs.TabPane tab="Financials" key="financials">
          {financialsQuery.isLoading ? (
            <Spin size="large" style={{ display: "block", margin: "40px auto" }} />
          ) : financialsQuery.error ? (
            <Alert message="Failed to load financial report" type="error" showIcon />
          ) : (
            <>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                {[
                  { title: "Total GMV", value: fmt(financialsData?.totalGmv) },
                  { title: "Total Commission", value: fmt(financialsData?.totalCommission) },
                  { title: "Total Payouts", value: fmt(financialsData?.totalPayouts) },
                  { title: "Total Refunds", value: fmt(financialsData?.totalRefunds) },
                  { title: "Net Revenue", value: fmt(financialsData?.netRevenue) },
                ].map((s) => (
                  <Col xs={24} sm={12} lg={6} key={s.title} style={{ marginBottom: 12 }}>
                    <Card>
                      <Statistic
                        title={s.title}
                        value={s.value}
                        loading={financialsQuery.isLoading}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>

              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                  <Card title="Financial Trend">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financialsData?.data ?? []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="gmv" fill="#1677ff" name="GMV" />
                        <Bar dataKey="commission" fill="#52c41a" name="Commission" />
                        <Bar dataKey="payouts" fill="#faad14" name="Payouts" />
                        <Bar dataKey="refunds" fill="#f5222d" name="Refunds" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Payout Summary">
                    <Table
                      dataSource={platformData?.payoutSummary ?? []}
                      columns={payoutCols}
                      rowKey="restaurantId"
                      size="small"
                    />
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};