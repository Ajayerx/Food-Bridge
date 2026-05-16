import React, { useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponService, normalizeCoupon } from "../../services/coupon.service";
import { useRestaurant } from "../../hooks/useRestaurant";
import dayjs from "dayjs";

export const VendorCouponsPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const qc = useQueryClient();
  const rid = restaurant?.id;
  const [modal, setModal] = useState(false);
  const [form] = Form.useForm();

  const { data } = useQuery({
    queryKey: ["coupons", rid],
    enabled: !!rid,
    queryFn: async () => {
      const res = await couponService.getRestaurantCoupons(rid!);
      // Backend returns: { success, data: RawCoupon[] }  (array directly)
      const raw: any[] = Array.isArray(res.data.data) ? res.data.data : [];
      return raw.map(normalizeCoupon);
    },
  });

  const create = useMutation({
    mutationFn: (v: any) =>
      couponService.createCoupon({
        code: v.code,
        discountType: v.discountType,
        discountValue: v.discountValue,
        minOrderAmount: v.minOrderAmount,
        usageLimit: v.usageLimit,
        restaurantId: rid,
        // DatePicker returns a dayjs object
        endDate: v.endDate ? v.endDate.toISOString() : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      setModal(false);
      form.resetFields();
      message.success("Coupon created");
    },
    onError: (e: any) =>
      message.error(
        e?.response?.data?.error?.message ?? "Failed to create coupon",
      ),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      couponService.toggleCoupon(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
    onError: (e: any) =>
      message.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  const cols = [
    {
      title: "Code",
      dataIndex: "code",
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "discountType",
      render: (v: string) => v,
    },
    {
      title: "Value",
      render: (_: any, r: ReturnType<typeof normalizeCoupon>) =>
        r.discountType === "percentage"
          ? `${r.discountValue}%`
          : `₹${r.discountValue}`,
    },
    {
      title: "Min Order",
      dataIndex: "minOrderAmount",
      render: (v: any) => (v ? `₹${v}` : "—"),
    },
    {
      title: "Used / Limit",
      render: (_: any, r: ReturnType<typeof normalizeCoupon>) =>
        `${r.usedCount} / ${r.usageLimit ?? "∞"}`,
    },
    {
      title: "Expires",
      dataIndex: "endDate",
      render: (v: string) => (v ? dayjs(v).format("DD MMM YY") : "—"),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v: boolean, r: ReturnType<typeof normalizeCoupon>) => (
        <Tag
          color={v ? "green" : "default"}
          style={{ cursor: "pointer" }}
          onClick={() => toggle.mutate({ id: r.id, active: !v })}
        >
          {v ? "Active" : "Paused"}
        </Tag>
      ),
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
          Coupons
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setModal(true);
          }}
        >
          Create Coupon
        </Button>
      </div>

      <Table dataSource={data ?? []} columns={cols} rowKey="id" size="small" />

      <Modal
        open={modal}
        title="Create Coupon"
        onCancel={() => setModal(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v)}>
          <Form.Item
            name="code"
            label="Coupon Code"
            rules={[{ required: true, message: "Code is required" }]}
          >
            <Input
              style={{ textTransform: "uppercase" }}
              placeholder="e.g. SAVE20"
            />
          </Form.Item>
          <Form.Item
            name="discountType"
            label="Discount Type"
            rules={[{ required: true, message: "Select a type" }]}
          >
            <Select
              options={[
                { label: "Percentage (%)", value: "percentage" },
                { label: "Flat Amount (₹)", value: "flat" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="discountValue"
            label="Value"
            rules={[{ required: true, message: "Value is required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="minOrderAmount" label="Minimum Order (₹)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="usageLimit"
            label="Usage Limit (leave blank for unlimited)"
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endDate" label="Expiry Date">
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
