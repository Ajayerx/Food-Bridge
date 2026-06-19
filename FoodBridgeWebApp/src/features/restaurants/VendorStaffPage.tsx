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
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { useStaff } from "../../hooks/useStaff";
import { useAppSelector } from "../../hooks/useAppSelector";
import type { StaffApiRow } from "../../services/staff.service";
import type { ColumnsType } from "antd/es/table";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { label: "Manager", value: "Manager" },
  { label: "Waiter", value: "Waiter" },
  { label: "Kitchen", value: "Kitchen" },
  { label: "Cashier", value: "Cashier" },
];

const ROLE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  manager: { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff" },
  waiter: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  kitchen: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  cashier: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const c = ROLE_COLORS[role.toLowerCase()] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    border: "#e5e7eb",
  };
  const isManager = role.toLowerCase() === "manager";
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
      {isManager && <CrownOutlined style={{ fontSize: 10 }} />}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

// ─── Summary Cards ────────────────────────────────────────────────────────────
const SummaryCards: React.FC<{ staff: StaffApiRow[]; loading: boolean }> = ({
  staff,
  loading,
}) => {
  const total = staff.length;
  const active = staff.filter((s) => s.is_active).length;
  const managers = staff.filter(
    (s) => s.staff_role.toLowerCase() === "manager",
  ).length;

  const stats = [
    {
      title: "Total Staff",
      value: total,
      icon: <TeamOutlined />,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      title: "Active",
      value: active,
      icon: <CheckCircleOutlined />,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      title: "Inactive",
      value: total - active,
      icon: <CloseCircleOutlined />,
      color: "#dc2626",
      bg: "#fff5f5",
    },
    {
      title: "Managers",
      value: managers,
      icon: <CrownOutlined />,
      color: "#7c3aed",
      bg: "#faf5ff",
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

// ─── Avatar helper ────────────────────────────────────────────────────────────
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export const VendorStaffPage: React.FC = () => {
  const { staff, isLoading, addStaff, updateStaff, removeStaff } = useStaff();
  const user = useAppSelector((s) => s.auth.user);
  const isVendor = user?.roleType === "Vendor";

  const [modal, setModal] = useState<{ open: boolean; editing?: StaffApiRow }>({
    open: false,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    if (modal.open) {
      if (modal.editing) {
        form.setFieldsValue({
          fullName: modal.editing.full_name,
          email: modal.editing.email ?? "",
          staffRole: modal.editing.staff_role,
          mobileNumber: modal.editing.mobile_number,
        });
      } else {
        form.resetFields();
      }
    }
  }, [modal.open, modal.editing, form]);

  const closeModal = () => {
    setModal({ open: false });
    form.resetFields();
  };

  const handleFinish = (vals: any) => {
    if (modal.editing) {
      updateStaff.mutate(
        {
          staffId: modal.editing.id,
          data: {
            fullName: vals.fullName,
            email: vals.email || undefined,
            staffRole: vals.staffRole,
          },
        },
        { onSuccess: closeModal },
      );
    } else {
      addStaff.mutate(
        {
          mobileNumber: vals.mobileNumber,
          fullName: vals.fullName,
          email: vals.email || undefined,
          staffRole: vals.staffRole,
        },
        { onSuccess: closeModal },
      );
    }
  };

  const isMutating = addStaff.isPending || updateStaff.isPending;

  const columns: ColumnsType<StaffApiRow> = [
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Name / Mobile
        </span>
      ),
      key: "name",
      render: (_: any, r: StaffApiRow) => {
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
          Role
        </span>
      ),
      dataIndex: "staff_role",
      key: "staff_role",
      width: 140,
      render: (v: string) => <RoleBadge role={v} />,
      filters: ROLE_OPTIONS.map((r) => ({ text: r.label, value: r.value })),
      onFilter: (value, record) => record.staff_role.toLowerCase() === value,
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Status
        </span>
      ),
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (v: boolean) => (
        <Tag
          icon={v ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{
            borderRadius: 20,
            fontWeight: 600,
            fontSize: 12,
            padding: "3px 10px",
            border: `1px solid ${v ? "#bbf7d0" : "#fecaca"}`,
            background: v ? "#f0fdf4" : "#fff5f5",
            color: v ? "#15803d" : "#dc2626",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {v ? "Active" : "Inactive"}
        </Tag>
      ),
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
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
    ...(isVendor
      ? [
          {
            title: (
              <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
                Actions
              </span>
            ),
            key: "actions",
            width: 100,
            render: (_: any, r: StaffApiRow) => (
              <Space size={6}>
                <Tooltip title="Edit staff">
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
                  title="Remove this staff member?"
                  description="This will remove their access to the restaurant."
                  onConfirm={() => removeStaff.mutate(r.id)}
                  okText="Remove"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  placement="topRight"
                >
                  <Tooltip title="Remove staff">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={removeStaff.isPending}
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
            Staff
          </Typography.Title>
          <Typography.Text style={{ color: "#6b7280", fontSize: 13 }}>
            Manage your restaurant's team members
          </Typography.Text>
        </div>
        {isVendor && (
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
            Add Staff
          </Button>
        )}
      </div>

      {/* ── Summary ── */}
      <SummaryCards staff={staff} loading={isLoading} />

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
        <Table<StaffApiRow>
          dataSource={staff}
          columns={columns}
          rowKey="id"
          size="middle"
          loading={isLoading}
          pagination={
            staff.length > 10
              ? {
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `${total} staff members`,
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
                    No staff members yet.
                    {isVendor && " Click 'Add Staff' to add one."}
                  </span>
                }
              />
            ),
          }}
          rowClassName={(_, idx) =>
            idx % 2 === 0 ? "staff-row-even" : "staff-row-odd"
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
              {modal.editing ? "Edit Staff Member" : "Add New Staff"}
            </span>
          </div>
        }
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={isMutating}
        okText={modal.editing ? "Save Changes" : "Add Staff"}
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
              placeholder="e.g. Ravi Kumar"
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
              placeholder="e.g. ravi@example.com"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="staffRole"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                Role
              </span>
            }
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select
              placeholder="Select role"
              style={{ borderRadius: 8 }}
              options={ROLE_OPTIONS}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Zebra striping ── */}
      <style>{`
                .staff-row-even td { background: #fff !important; }
                .staff-row-odd  td { background: #fafafa !important; }
                .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    border-bottom: 2px solid #e5e7eb !important;
                    padding: 12px 16px !important;
                }
                .ant-table-tbody > tr:hover > td { background: #eff6ff !important; }
                .ant-table-tbody > tr > td {
                    padding: 12px 16px !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                }
            `}</style>
    </div>
  );
};

export default VendorStaffPage;
