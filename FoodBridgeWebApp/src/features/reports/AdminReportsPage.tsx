import React, { useState } from "react";
import { Card, Col, DatePicker, Row, Statistic, Table, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { reportService } from "../../services/report.service";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const COLORS = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
];

export const AdminReportsPage: React.FC = () => {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-report",
      range[0].format("YYYY-MM-DD"),
      range[1].format("YYYY-MM-DD"),
    ],
    queryFn: async () =>
      (
        await reportService.getPlatformReport({
          from: range[0].format("YYYY-MM-DD"),
          to: range[1].format("YYYY-MM-DD"),
        })
      ).data.data,
  });

  const payoutCols = [
    { title: "Restaurant", dataIndex: "name" },
    {
      title: "Gross Revenue",
      dataIndex: "grossRevenue",
      render: (v: number) => `₹${v}`,
    },
    {
      title: "Platform Fee",
      dataIndex: "platformFee",
      render: (v: number) => `₹${v}`,
    },
    {
      title: "Net Payout",
      dataIndex: "netPayout",
      render: (v: number) => <strong>₹{v}</strong>,
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
          Platform Reports
        </Typography.Title>
        <RangePicker value={range} onChange={(v: any) => v && setRange(v)} />
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: "Total Revenue", value: data?.totalRevenue, prefix: "₹" },
          { title: "Total Orders", value: data?.totalOrders },
          { title: "Total Restaurants", value: data?.totalRestaurants },
          { title: "Total Users", value: data?.totalUsers },
          { title: "New Users Today", value: data?.newUsersToday },
        ].map((s) => (
          <Col
            xs={24}
            sm={12}
            lg={5}
            key={s.title}
            style={{ marginBottom: 12 }}
          >
            <Card>
              <Statistic
                title={s.title}
                value={s.value ?? 0}
                prefix={s.prefix}
                loading={isLoading}
                precision={0}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Revenue by Restaurant">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data?.revenueByRestaurant ?? []}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(data?.revenueByRestaurant ?? []).map(
                    (_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ),
                  )}
                </Pie>
                <Tooltip formatter={(v: any) => `₹${v}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Daily Revenue">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.revenueByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `₹${v}`} />
                <Bar dataKey="revenue" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="Payout Summary">
        <Table
          dataSource={data?.payoutSummary ?? []}
          columns={payoutCols}
          rowKey="restaurantId"
          size="small"
        />
      </Card>
    </div>
  );
};
