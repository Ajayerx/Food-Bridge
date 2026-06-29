import React, { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Row,
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
  EyeOutlined,
  MailOutlined,
  PauseCircleOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAgents } from "../../hooks/useAgents";
import type { AgentApiRow } from "../../services/agent.service";
import type { ColumnsType } from "antd/es/table";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Pending: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  Approved: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  Active: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  Suspended: { bg: "#fff5f5", text: "#dc2626", border: "#fecaca" },
  Inactive: { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" },
  Banned: { bg: "#fff5f5", text: "#dc2626", border: "#fecaca" },
  Rejected: { bg: "#fff5f5", text: "#dc2626", border: "#fecaca" },
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

const SummaryCards: React.FC<{ agents: AgentApiRow[]; loading: boolean }> = ({
  agents,
  loading,
}) => {
  const total = agents.length;
  const approved = agents.filter(
    (a) => a.status === "Active" || a.status === "Approved"
  ).length;
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
      title: "Pending Review",
      value: pending,
      icon: <CloseCircleOutlined />,
      color: "#b45309",
      bg: "#fffbeb",
    },
    {
      title: "Online Now",
      value: agents.filter((a) => a.is_available).length,
      icon: <CarOutlined />,
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
            styles={{ body: { padding: "12px 16px" } }}
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

const AVATAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const AdminAgentsPage: React.FC = () => {
  const { agents, isLoading, updateAgent, deleteAgent, approveAgent, rejectAgent, suspendAgent, unsuspendAgent } =
    useAgents();

  const [drawerAgent, setDrawerAgent] = useState<AgentApiRow | null>(null);

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    agent?: AgentApiRow;
  }>({ open: false });
  const [rejectReason, setRejectReason] = useState("");

  const [suspendModal, setSuspendModal] = useState<{
    open: boolean;
    agent?: AgentApiRow;
  }>({ open: false });
  const [suspendReason, setSuspendReason] = useState("");

  const isMutating =
    updateAgent.isPending ||
    deleteAgent.isPending ||
    approveAgent.isPending ||
    rejectAgent.isPending ||
    suspendAgent.isPending ||
    unsuspendAgent.isPending;

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
        { text: "Active", value: "Active" },
        { text: "Rejected", value: "Rejected" },
        { text: "Banned", value: "Banned" },
        { text: "Inactive", value: "Inactive" },
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
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Actions
        </span>
      ),
      key: "actions",
      width: 300,
      render: (_: any, r: AgentApiRow) => (
        <Space size={6}>
          {r.status === "Pending" && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => approveAgent.mutate(r.id)}
                loading={approveAgent.isPending}
                style={{
                  borderRadius: 7,
                  fontWeight: 600,
                  background: "#16a34a",
                  borderColor: "#16a34a",
                  boxShadow: "0 1px 2px rgba(22,163,74,0.3)",
                }}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setRejectReason("");
                  setRejectModal({ open: true, agent: r });
                }}
                style={{ borderRadius: 7, fontWeight: 600 }}
              >
                Reject
              </Button>
            </>
          )}
          <Tooltip title="View details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDrawerAgent(r)}
              style={{
                borderRadius: 7,
                border: "1px solid #d1d5db",
                color: "#374151",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            />
          </Tooltip>
          {r.status === "Active" && (
            <Tooltip title="Suspend agent">
              <Button
                size="small"
                danger
                icon={<PauseCircleOutlined />}
                onClick={() => {
                  setSuspendReason("");
                  setSuspendModal({ open: true, agent: r });
                }}
                loading={suspendAgent.isPending}
                style={{
                  borderRadius: 7,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                Suspend
              </Button>
            </Tooltip>
          )}
          {r.status === "Inactive" && (
            <Tooltip title="Unsuspend agent">
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => unsuspendAgent.mutate(r.id)}
                loading={unsuspendAgent.isPending}
                style={{
                  borderRadius: 7,
                  border: "1px solid #16a34a",
                  color: "#16a34a",
                  boxShadow: "0 1px 2px rgba(22,163,74,0.3)",
                }}
              >
                Unsuspend
              </Button>
            </Tooltip>
          )}
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
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1100 }}>
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
            Review, approve, and manage platform delivery agents
          </Typography.Text>
        </div>
      </div>

      <SummaryCards agents={agents} loading={isLoading} />

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

      {/* ── Reject Reason Modal ── */}
      <Modal
        open={rejectModal.open}
        title={
          <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
            Reject Delivery Agent
          </span>
        }
        onCancel={() => setRejectModal({ open: false })}
        onOk={() => {
          if (rejectModal.agent) {
            rejectAgent.mutate({
              id: rejectModal.agent.id,
              reason: rejectReason || undefined,
            });
          }
          setRejectModal({ open: false });
        }}
        confirmLoading={rejectAgent.isPending}
        okText="Reject Agent"
        okButtonProps={{ danger: true, style: { borderRadius: 7, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 7 } }}
        width={420}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          <Typography.Text style={{ color: "#6b7280", fontSize: 13 }}>
            Provide a reason for rejection (optional). The agent will be notified.
          </Typography.Text>
          <Input.TextArea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Incomplete documents provided"
            style={{ marginTop: 12, borderRadius: 8 }}
          />
        </div>
      </Modal>

      {/* ── Agent Detail Drawer ── */}
      <Drawer
        open={!!drawerAgent}
        onClose={() => setDrawerAgent(null)}
        title={
          <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
            Agent Details
          </span>
        }
        width={480}
        destroyOnClose
      >
        {drawerAgent && (
          <Descriptions column={1} size="small" bordered
            styles={{
              label: { fontWeight: 600, color: "#374151", whiteSpace: "nowrap" },
            }}
          >
            <Descriptions.Item label="Full Name">{drawerAgent.full_name || "—"}</Descriptions.Item>
            <Descriptions.Item label="Mobile">{drawerAgent.mobile_number}</Descriptions.Item>
            <Descriptions.Item label="Email">{drawerAgent.email || "—"}</Descriptions.Item>
            <Descriptions.Item label="Status"><StatusBadge status={drawerAgent.status} /></Descriptions.Item>
            <Descriptions.Item label="Online">
              <Tag color={drawerAgent.is_available ? "green" : "default"}>{drawerAgent.is_available ? "Online" : "Offline"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Vehicle Type">{drawerAgent.vehicle_type || "—"}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Number">{drawerAgent.vehicle_number || "—"}</Descriptions.Item>
            <Descriptions.Item label="License Number">{drawerAgent.license_number || "—"}</Descriptions.Item>
            <Descriptions.Item label="Total Deliveries">{drawerAgent.total_deliveries}</Descriptions.Item>
            <Descriptions.Item label="Total Earnings">₹{Number(drawerAgent.total_earnings).toLocaleString("en-IN")}</Descriptions.Item>
            <Descriptions.Item label="Joined">
              {drawerAgent.created_at
                ? new Date(drawerAgent.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* ── Suspend Reason Modal ── */}
      <Modal
        open={suspendModal.open}
        title={
          <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
            Suspend Delivery Agent
          </span>
        }
        onCancel={() => setSuspendModal({ open: false })}
        onOk={() => {
          if (suspendModal.agent) {
            suspendAgent.mutate({
              id: suspendModal.agent.id,
              reason: suspendReason || undefined,
            });
          }
          setSuspendModal({ open: false });
        }}
        confirmLoading={suspendAgent.isPending}
        okText="Suspend Agent"
        okButtonProps={{ danger: true, style: { borderRadius: 7, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 7 } }}
        width={420}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          <Typography.Text style={{ color: "#6b7280", fontSize: 13 }}>
            Provide a reason for suspension. The agent will be notified and their account will be
            deactivated until an admin reinstates them.
          </Typography.Text>
          <Input.TextArea
            rows={3}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="e.g. Violation of platform terms"
            style={{ marginTop: 12, borderRadius: 8 }}
          />
        </div>
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

export default AdminAgentsPage;
