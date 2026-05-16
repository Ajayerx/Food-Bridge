import React from "react";
import {
  Alert,
  Button,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { useUsers } from "../../hooks/useUsers";
import type { ApiUser, RoleType, UserStatus } from "../../types";

// ── Role → tag colour ─────────────────────────────────────────────────────────
const ROLE_COLOR: Record<RoleType, string> = {
  Admin: "red",
  Vendor: "blue",
  Staff: "cyan",
  DeliveryAgent: "orange",
  Customer: "default",
};

const ROLE_LABEL: Record<RoleType, string> = {
  Admin: "Admin",
  Vendor: "Vendor",
  Staff: "Staff",
  DeliveryAgent: "Delivery Agent",
  Customer: "Customer",
};

// ── Role filter options ───────────────────────────────────────────────────────
const ROLE_OPTIONS: { label: string; value: RoleType | "all" }[] = [
  { label: "All roles", value: "all" },
  { label: "Admin", value: "Admin" },
  { label: "Vendor", value: "Vendor" },
  { label: "Staff", value: "Staff" },
  { label: "Delivery Agent", value: "DeliveryAgent" },
  { label: "Customer", value: "Customer" },
];

// ─────────────────────────────────────────────────────────────────────────────
export const AdminUsersPage: React.FC = () => {
  const {
    rows,
    total,
    isLoading,
    isFetching,
    isError,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    page,
    setPage,
    pageSize,
    toggleStatus,
  } = useUsers();

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: ColumnsType<ApiUser> = [
    {
      title: "Name",
      dataIndex: "full_name",
      render: (v: string | null) =>
        v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "Mobile",
      dataIndex: "mobile_number",
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (v: string | null) =>
        v ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (v: RoleType) => (
        <Tag color={ROLE_COLOR[v] ?? "default"}>{ROLE_LABEL[v] ?? v}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v: UserStatus) => (
        <Tag color={v === "Active" ? "green" : "red"}>{v}</Tag>
      ),
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      render: (v: string) => new Date(v).toLocaleDateString(),
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Action",
      align: "center",
      render: (_: unknown, record: ApiUser) => {
        const isActive = record.status === "Active";
        return (
          <Popconfirm
            title={isActive ? "Suspend this user?" : "Reactivate this user?"}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: isActive }}
            onConfirm={() =>
              toggleStatus.mutate({ id: record.id, makeActive: !isActive })
            }
          >
            <Button
              size="small"
              danger={isActive}
              loading={toggleStatus.isPending}
            >
              {isActive ? "Suspend" : "Reactivate"}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* ── Header ── */}
      <Typography.Title level={4} style={{ marginBottom: 20 }}>
        Users
      </Typography.Title>

      {/* ── Error ── */}
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load users"
          description="The server returned an error. Please try again or contact support."
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ── Filters ── */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Search name, mobile or email…"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
          options={ROLE_OPTIONS}
          style={{ width: 160 }}
        />
      </Space>

      {/* ── Table ── */}
      <Table<ApiUser>
        dataSource={rows}
        columns={columns}
        rowKey="id"
        loading={isLoading || isFetching}
        size="small"
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
          showTotal: (t) => `${t} users`,
        }}
      />
    </div>
  );
};
