import React, { useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantService } from "../../services/restaurant.service";
import { useRestaurant } from "../../hooks/useRestaurant";

function normalizeStaff(s: any) {
  return {
    id: s.id,
    role: s.staff_role,
    isActive: s.status === "active",
    name: s.name ?? null,
    mobileNumber: s.mobile_number ?? null,
  };
}

export const VendorStaffPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const qc = useQueryClient();
  const rid = restaurant?.id;
  const [modal, setModal] = useState(false);
  const [form] = Form.useForm();

  const { data: staff } = useQuery({
    queryKey: ["staff", rid],
    enabled: !!rid,
    queryFn: async () => {
      const res = await restaurantService.getStaff(rid!);
      const raw: any[] = Array.isArray(res.data.data) ? res.data.data : [];
      return raw.map(normalizeStaff);
    },
  });

  const addStaff = useMutation({
    mutationFn: (v: any) =>
      restaurantService.addStaff(rid!, {
        name: v.name,
        mobileNumber: v.mobileNumber,
        role: v.role,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setModal(false);
      form.resetFields();
      message.success("Staff added");
    },
    onError: (e: any) =>
      message.error(e?.response?.data?.error?.message ?? "Failed to add staff"),
  });

  const toggleStaff = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      restaurantService.updateStaffStatus(rid!, id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
    onError: (e: any) =>
      message.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  const cols = [
    {
      title: "Name / Mobile",
      render: (_: any, r: ReturnType<typeof normalizeStaff>) => (
        <div>
          <div>{r.name ?? "—"}</div>
          <div style={{ fontSize: 12, color: "#999" }}>{r.mobileNumber}</div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v: boolean) => (
        <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Action",
      render: (_: any, r: ReturnType<typeof normalizeStaff>) => (
        <Button
          size="small"
          onClick={() => toggleStaff.mutate({ id: r.id, active: !r.isActive })}
          loading={toggleStaff.isPending}
        >
          {r.isActive ? "Deactivate" : "Activate"}
        </Button>
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
          marginBottom: 16,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Staff
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setModal(true);
          }}
        >
          Add Staff
        </Button>
      </div>

      <Table
        dataSource={staff ?? []}
        columns={cols}
        rowKey="id"
        size="small"
        pagination={false}
      />

      <Modal
        open={modal}
        title="Add Staff"
        onCancel={() => setModal(false)}
        onOk={() => form.submit()}
        confirmLoading={addStaff.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => addStaff.mutate(v)}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. Ravi Kumar" />
          </Form.Item>
          <Form.Item
            name="mobileNumber"
            label="Mobile Number"
            rules={[{ required: true, message: "Mobile is required" }]}
          >
            <Input placeholder="e.g. 9876543210" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select
              options={["manager", "waiter", "kitchen", "cashier"].map((r) => ({
                label: r.charAt(0).toUpperCase() + r.slice(1),
                value: r,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
