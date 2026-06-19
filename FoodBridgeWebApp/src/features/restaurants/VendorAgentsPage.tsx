// VendorAgentsPage.tsx
import React, { useState, useEffect } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAgents } from "../../hooks/useAgents";
import { useAppSelector } from "../../hooks/useAppSelector";
import type { AgentApiRow } from "../../services/agent.service";
import type { ColumnsType } from "antd/es/table";

// ─── Vehicle options ──────────────────────────────────────────────────────────
const VEHICLE_OPTIONS = [
  { label: "Bike", value: "Bike" },
  { label: "Bicycle", value: "Bicycle" },
  { label: "Scooter", value: "Scooter" },
  { label: "On Foot", value: "OnFoot" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Pending: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  Approved: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  Suspended: { bg: "#fff5f5", text: "#dc2626", border: "#fecaca" },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = STATUS_COLORS[status] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    border: "#e5e7eb",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {status}
    </span>
  );
};

// ─── Summary cards ────────────────────────────────────────────────────────────
const SummaryCards: React.FC<{ agents: AgentApiRow[]; loading: boolean }> = ({
  agents,
  loading,
}) => {
  const total = agents.length;
  const approved = agents.filter((a) => a.status === "Approved").length;
  const online = agents.filter((a) => a.is_available).length;
  const pending = agents.filter((a) => a.status === "Pending").length;

  const stats = [
    {
      title: "Total Agents",
      value: total,
      icon: <TeamOutlined />,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      title: "Approved",
      value: approved,
      icon: <CheckCircleOutlined />,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      title: "Online Now",
      value: online,
      icon: <CarOutlined />,
      color: "#7c3aed",
      bg: "#faf5ff",
    },
    {
      title: "Pending",
      value: pending,
      icon: <CloseCircleOutlined />,
      color: "#b45309",
      bg: "#fffbeb",
    },
  ];

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      {stats.map((s) => (
        <Col xs={12} sm={6} key={s.title}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ padding: "12px 16px" }}
          >
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: s.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.color,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#111827",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
                    {s.title}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
const AVATAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Main page ────────────────────────────────────────────────────────────────
export const VendorAgentsPage: React.FC = () => {
  const { agents, isLoading, addAgent, updateAgent, deleteAgent } = useAgents();
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.roleType === "Admin";

  const [modal, setModal] = useState<{ open: boolean; editing?: AgentApiRow }>({
    open: false,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    if (modal.open && modal.editing) {
      form.setFieldsValue({
        fullName: modal.editing.full_name,
        mobileNumber: modal.editing.mobile_number,
        email: modal.editing.email ?? "",
        vehicleType: modal.editing.vehicle_type,
        vehicleNumber: modal.editing.vehicle_number,
        licenseNumber: modal.editing.license_number,
      });
    } else if (modal.open) {
      form.resetFields();
    }
  }, [modal.open, modal.editing, form]);

  const closeModal = () => {
    setModal({ open: false });
    form.resetFields();
  };

  const handleFinish = (vals: any) => {
    if (modal.editing) {
      updateAgent.mutate(
        {
          id: modal.editing.id,
          data: {
            fullName: vals.fullName,
            email: vals.email || undefined,
            vehicleType: vals.vehicleType,
            vehicleNumber: vals.vehicleNumber,
            licenseNumber: vals.licenseNumber,
          },
        },
        { onSuccess: closeModal },
      );
    } else {
      addAgent.mutate(
        {
          mobileNumber: vals.mobileNumber,
          fullName: vals.fullName,
          email: vals.email || undefined,
          vehicleType: vals.vehicleType,
          vehicleNumber: vals.vehicleNumber,
          licenseNumber: vals.licenseNumber,
        },
        { onSuccess: closeModal },
      );
    }
  };

  const isMutating = addAgent.isPending || updateAgent.isPending;

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<AgentApiRow> = [
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Name / Mobile
        </span>
      ),
      key: "name",
      render: (_: any, r: AgentApiRow) => {
        const name = r.full_name || "—";
        const color = avatarColor(name);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {r.avatar_url ? (
              <Avatar src={r.avatar_url} size={36} style={{ flexShrink: 0 }} />
            ) : (
              <Avatar
                size={36}
                style={{
                  background: color,
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {getInitials(name)}
              </Avatar>
            )}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#111827",
                  fontSize: 14,
                  lineHeight: 1.3,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 1,
                }}
              >
                <PhoneOutlined style={{ fontSize: 10 }} />
                {r.mobile_number}
              </div>
              {r.email && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <MailOutlined style={{ fontSize: 10 }} />
                  {r.email}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Vehicle
        </span>
      ),
      key: "vehicle",
      width: 160,
      render: (_: any, r: AgentApiRow) => (
        <div>
          <div style={{ fontWeight: 500, color: "#374151" }}>
            {r.vehicle_type || "—"}
          </div>
          {r.vehicle_number && (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {r.vehicle_number}
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Status
        </span>
      ),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (v: string) => <StatusBadge status={v} />,
      filters: [
        { text: "Pending", value: "Pending" },
        { text: "Approved", value: "Approved" },
        { text: "Suspended", value: "Suspended" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Online
        </span>
      ),
      dataIndex: "is_available",
      key: "is_available",
      width: 110,
      render: (v: boolean) => (
        <Tag
          icon={v ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{
            borderRadius: 20,
            fontWeight: 600,
            fontSize: 12,
            padding: "3px 10px",
            border: `1px solid ${v ? "#bbf7d0" : "#e5e7eb"}`,
            background: v ? "#f0fdf4" : "#f9fafb",
            color: v ? "#15803d" : "#6b7280",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {v ? "Online" : "Offline"}
        </Tag>
      ),
      filters: [
        { text: "Online", value: true },
        { text: "Offline", value: false },
      ],
      onFilter: (value, record) => record.is_available === value,
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Deliveries
        </span>
      ),
      dataIndex: "total_deliveries",
      key: "total_deliveries",
      width: 110,
      render: (v: number) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          {v}
        </span>
      ),
      sorter: (a, b) => a.total_deliveries - b.total_deliveries,
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Earnings
        </span>
      ),
      dataIndex: "total_earnings",
      key: "total_earnings",
      width: 120,
      render: (v: number) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          ₹{Number(v).toLocaleString("en-IN")}
        </span>
      ),
      sorter: (a, b) => a.total_earnings - b.total_earnings,
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Joined
        </span>
      ),
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (v: string) => (
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {v
            ? new Date(v).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    ...(isAdmin
      ? [
          {
            title: (
              <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
                Actions
              </span>
            ),
            key: "actions",
            width: 100,
            render: (_: any, r: AgentApiRow) => (
              <Space size={6}>
                <Tooltip title="Edit agent">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setModal({ open: true, editing: r })}
                    style={{
                      borderRadius: 7,
                      border: "1px solid #d1d5db",
                      color: "#374151",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title="Remove this agent?"
                  description="This will permanently remove the agent."
                  onConfirm={() => deleteAgent.mutate(r.id)}
                  okText="Remove"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  placement="topRight"
                >
                  <Tooltip title="Remove agent">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleteAgent.isPending}
                      style={{
                        borderRadius: 7,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          } as any,
        ]
      : []),
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1100 }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <Typography.Title
            level={4}
            style={{ margin: 0, color: "#111827", fontWeight: 700 }}
          >
            Delivery Agents
          </Typography.Title>
          <Typography.Text style={{ color: "#6b7280", fontSize: 13 }}>
            Manage your platform's delivery agents
          </Typography.Text>
        </div>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, editing: undefined })}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              height: 36,
              paddingInline: 16,
              boxShadow: "0 1px 3px rgba(59,130,246,0.3)",
            }}
          >
            Add Agent
          </Button>
        )}
      </div>

      {/* ── Summary ── */}
      <SummaryCards agents={agents} loading={isLoading} />

      {/* ── Table ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <Table<AgentApiRow>
          dataSource={agents}
          columns={columns}
          rowKey="id"
          size="middle"
          loading={isLoading}
          pagination={
            agents.length > 10
              ? {
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `${total} agents`,
                  style: { padding: "12px 16px" },
                }
              : false
          }
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "#6b7280" }}>
                    No delivery agents yet.
                  </span>
                }
              />
            ),
          }}
          rowClassName={(_, idx) =>
            idx % 2 === 0 ? "agent-row-even" : "agent-row-odd"
          }
          style={{ borderRadius: 0 }}
        />
      </div>

      {/* ── Modal ── */}
      <Modal
        open={modal.open}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3b82f6",
                fontSize: 14,
              }}
            >
              <UserOutlined />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
              {modal.editing ? "Edit Delivery Agent" : "Add Delivery Agent"}
            </span>
          </div>
        }
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={isMutating}
        okText={modal.editing ? "Save Changes" : "Add Agent"}
        cancelText="Cancel"
        width={460}
        destroyOnClose
        okButtonProps={{ style: { borderRadius: 7, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 7 } }}
        styles={{
          header: { borderBottom: "1px solid #f3f4f6", paddingBottom: 12 },
          body: { paddingTop: 16 },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <Form.Item
            name="fullName"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                Full Name
              </span>
            }
            rules={[
              { required: true, message: "Please enter full name" },
              { max: 100, message: "Max 100 characters" },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
              placeholder="e.g. Suresh Patel"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="mobileNumber"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                Mobile Number
              </span>
            }
            rules={[
              {
                required: !modal.editing,
                message: "Please enter mobile number",
              },
              {
                pattern: /^[6-9]\d{9}$/,
                message: "Enter a valid 10-digit mobile number",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: "#9ca3af" }} />}
              placeholder="e.g. 9876543210"
              maxLength={10}
              style={{ borderRadius: 8 }}
              disabled={!!modal.editing}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                Email{" "}
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  (optional)
                </span>
              </span>
            }
            rules={[{ type: "email", message: "Enter a valid email address" }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "#9ca3af" }} />}
              placeholder="e.g. suresh@example.com"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="vehicleType"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                Vehicle Type{" "}
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  (optional)
                </span>
              </span>
            }
          >
            <Select
              placeholder="Select vehicle type"
              style={{ borderRadius: 8 }}
              options={VEHICLE_OPTIONS}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="vehicleNumber"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                Vehicle Number{" "}
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  (optional)
                </span>
              </span>
            }
          >
            <Input placeholder="e.g. MH12AB1234" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="licenseNumber"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                License Number{" "}
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  (optional)
                </span>
              </span>
            }
          >
            <Input
              placeholder="e.g. DL-1420110012345"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Zebra striping ── */}
      <style>{`
        .agent-row-even td { background: #fff !important; }
        .agent-row-odd  td { background: #fafafa !important; }
        .ant-table-thead > tr > th { background: #f8fafc !important; border-bottom: 2px solid #e5e7eb !important; padding: 12px 16px !important; }
        .ant-table-tbody > tr:hover > td { background: #eff6ff !important; }
        .ant-table-tbody > tr > td { padding: 12px 16px !important; border-bottom: 1px solid #f3f4f6 !important; }
      `}</style>
    </div>
  );
};

export default VendorAgentsPage;
