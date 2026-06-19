import React, { useState } from "react";
import { Card, Col, DatePicker, Row, Statistic, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { reportService } from "../../services/report.service";
import { useRestaurant } from "../../hooks/useRestaurant";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export const VendorReportsPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "vendor-report-full",
      restaurant?.id,
      range[0].format("YYYY-MM-DD"),
      range[1].format("YYYY-MM-DD"),
    ],
    enabled: !!restaurant?.id,
    queryFn: async () =>
      (
        await reportService.getVendorReport(restaurant!.id, {
          from: range[0].format("YYYY-MM-DD"),
          to: range[1].format("YYYY-MM-DD"),
        })
      ).data.data,
  });

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
          Reports
        </Typography.Title>
        <RangePicker value={range} onChange={(v: any) => v && setRange(v)} />
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: "Total Revenue", value: data?.totalRevenue, prefix: "₹" },
          { title: "Total Orders", value: data?.totalOrders },
          { title: "Avg Order Value", value: data?.avgOrderValue, prefix: "₹" },
        ].map((s) => (
          <Col xs={24} sm={8} key={s.title}>
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

      <Card title="Revenue by Day" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data?.revenueByDay ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => `₹${v}`} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#1677ff"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Top Items by Revenue">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={(data?.topItems ?? []).slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => `₹${v}`} />
            <Bar dataKey="revenue" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
