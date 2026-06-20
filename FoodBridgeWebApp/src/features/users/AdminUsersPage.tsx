import React, { useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Drawer,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
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

  const [detailDrawer, setDetailDrawer] = useState<ApiUser | null>(null);

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: ColumnsType<ApiUser> = [
    {
      title: "Name",
      dataIndex: "full_name",
      render: (v: string | null, r: ApiUser) =>
        v ? (
          <Button type="link" style={{ padding: 0 }} onClick={() => setDetailDrawer(r)}>
            {v}
          </Button>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
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
          <Space size="small">
            <Tooltip title="View details">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setDetailDrawer(record)}
              />
            </Tooltip>
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
          </Space>
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

      {/* ── Detail Drawer ── */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              icon={<UserOutlined />}
              size={36}
              style={{ background: "#722ed1", color: "#fff" }}
            />
            <span>{detailDrawer?.full_name || "User Details"}</span>
          </div>
        }
        open={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
        width={420}
        footer={
          detailDrawer && (
            <Space>
              {detailDrawer.status === "Active" ? (
                <Popconfirm
                  title="Suspend this user?"
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => {
                    toggleStatus.mutate({ id: detailDrawer.id, makeActive: false });
                    setDetailDrawer(null);
                  }}
                >
                  <Button danger loading={toggleStatus.isPending}>
                    Suspend
                  </Button>
                </Popconfirm>
              ) : (
                <Popconfirm
                  title="Reactivate this user?"
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => {
                    toggleStatus.mutate({ id: detailDrawer.id, makeActive: true });
                    setDetailDrawer(null);
                  }}
                >
                  <Button loading={toggleStatus.isPending}>
                    Reactivate
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )
        }
      >
        {detailDrawer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status badges */}
            <div>
              <Tag
                color={detailDrawer.status === "Active" ? "green" : detailDrawer.status === "Banned" ? "orange" : "red"}
                style={{ fontSize: 13, padding: "2px 10px" }}
              >
                {detailDrawer.status}
              </Tag>
              <Tag
                color={ROLE_COLOR[detailDrawer.role] ?? "default"}
                style={{ fontSize: 13, padding: "2px 10px", marginLeft: 6 }}
              >
                {ROLE_LABEL[detailDrawer.role] ?? detailDrawer.role}
              </Tag>
            </div>

            <Card size="small" style={{ borderRadius: 8 }}>
              <table
                style={{
                  width: "100%",
                  fontSize: 13,
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  {(
                    [
                      ["Full Name", detailDrawer.full_name || "—"],
                      ["Mobile", detailDrawer.mobile_number],
                      ["Email", detailDrawer.email ?? "—"],
                      ["Role", detailDrawer.role],
                      ["Status", detailDrawer.status],
                      [
                        "Last Login",
                        detailDrawer.last_login_at
                          ? new Date(detailDrawer.last_login_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "Never",
                      ],
                      [
                        "Joined",
                        new Date(detailDrawer.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        }),
                      ],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <tr
                      key={label}
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                    >
                      <td
                        style={{
                          padding: "8px 0",
                          color: "#888",
                          width: 120,
                          verticalAlign: "top",
                        }}
                      >
                        {label}
                      </td>
                      <td style={{ padding: "8px 0", fontWeight: 500 }}>
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {detailDrawer.avatar_url && (
              <Card size="small" style={{ borderRadius: 8 }} title="Avatar">
                <a
                  href={detailDrawer.avatar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13 }}
                >
                  {detailDrawer.avatar_url}
                </a>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
