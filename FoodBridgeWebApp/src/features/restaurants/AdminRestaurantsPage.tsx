import React, { useState, useCallback } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  message,
  Modal,
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  StarOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantService } from "../../services/restaurant.service";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

// ── Types ─────────────────────────────────────────────────────────────────────

// Maps all possible C# RestaurantStatus enum values that can come from backend.
// C# enum: Pending=0, Active=1, Inactive=2, Suspended=3
// Admin approval flow also produces "Approved" / "Rejected" if you have a
// separate approval status column — we handle all variants below.
type BackendStatus =
  | "pending"
  | "active"
  | "inactive"
  | "suspended"
  | "approved"
  | "rejected"
  // numeric variants (in case serialised as int)
  | 0
  | 1
  | 2
  | 3;

// Canonical frontend status — what the UI cares about
type UIStatus = "pending" | "approved" | "rejected" | "suspended" | "inactive";

interface OperatingHoursEntry {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface NormalizedRestaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string | null;
  logoUrl: string | null;
  fssaiLicense: string | null;
  deliveryFee: number;
  minOrderAmount: number;
  avgDeliveryMinutes: number;
  status: UIStatus;
  isOpen: boolean;
  avgRating: number | null;
  totalRatings: number;
  vendorId: string;
  vendorName: string | null;
  vendorMobile: string | null;
  vendorEmail: string | null;
  isPureVeg: boolean;
  cuisines: string[];
  operatingHours: OperatingHoursEntry[];
  createdAt: string;
  description: string | null;
  rejectionReason: string | null;
}

// ── Status normaliser ───────────────────────────────────────────────────────────
function normalizeStatus(raw: any): UIStatus {
  if (!raw) return "pending";

  switch (String(raw).toLowerCase()) {
    case "active":
    case "approved":
      return "approved";
    case "pending":
      return "pending";
    case "rejected":
      return "rejected";
    case "suspended":
      return "suspended";
    case "inactive":
      return "inactive";
    default:
      return "pending";
  }
}
// ── Status display config ─────────────────────────────────────────────────────
const STATUS_COLOR: Record<UIStatus, string> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
  suspended: "default",
  inactive: "default",
};

const STATUS_LABEL: Record<UIStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  suspended: "Suspended",
  inactive: "Inactive",
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: number;
  color: string;
  loading: boolean;
}> = ({ label, value, color, loading }) => (
  <Card
    size="small"
    style={{ borderRadius: 10, borderTop: `3px solid ${color}` }}
  >
    <Skeleton loading={loading} active paragraph={false}>
      <Text
        type="secondary"
        style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}
      >
        {label}
      </Text>
      <div style={{ fontSize: 26, fontWeight: 600, color, marginTop: 2 }}>
        {value}
      </div>
    </Skeleton>
  </Card>
);

// ── Reason modal state ────────────────────────────────────────────────────────
interface ReasonModalState {
  open: boolean;
  id: string;
  name: string;
  action: "reject" | "suspend";
}

// ── Main component ────────────────────────────────────────────────────────────
export const AdminRestaurantsPage: React.FC = () => {
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [reasonModal, setReasonModal] = useState<ReasonModalState | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<NormalizedRestaurant | null>(
    null,
  );
  const [form] = Form.useForm();

  // ── Query ──────────────────────────────────────────────────────────────────
  const {
    data: result,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-restaurants", search],
    queryFn: async () => {
      const res = await restaurantService.getAllRestaurants({
        pageSize: 500,
        search: search || undefined,
      });
      // res.data.data is { items, totalCount } with camelCase-mapped items
      const body = res.data.data as {
        items: any[];
        totalCount: number;
      };
      return {
        items: (body.items ?? []).map((r: any) => ({
          ...r,
          status: normalizeStatus(r.status),
        })),
        totalCount: body.totalCount ?? 0,
      };
    },
    staleTime: 30_000,
  });

  const allData = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: totalCount,
    approved: allData.filter((r) => r.status === "approved").length,
    pending: allData.filter((r) => r.status === "pending").length,
    suspended: allData.filter((r) => r.status === "suspended").length,
  };

  // ── Client-side filter (within fetched batch) ──────────────────────────────
  const filtered = allData.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      (r.vendorName ?? "").toLowerCase().includes(q) ||
      (r.vendorMobile ?? "").toLowerCase().includes(q) ||
      (r.phone ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-restaurants"] });

  const approve = useMutation({
    mutationFn: (id: string) => restaurantService.approveRestaurant(id),
    onSuccess: () => {
      invalidate();
      message.success("Restaurant approved");
    },
        onError: (e: any) =>
            message.error(e?.response?.data?.error?.message ?? "Approval failed"),
    });

    const reject = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            restaurantService.rejectRestaurant(id, reason),
        onSuccess: () => {
            invalidate();
            setReasonModal(null);
            form.resetFields();
            message.success("Restaurant rejected");
        },
        onError: (e: any) =>
            message.error(e?.response?.data?.error?.message ?? "Rejection failed"),
    });

    const suspend = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            restaurantService.suspendRestaurant(id, reason),
        onSuccess: () => {
            invalidate();
            setReasonModal(null);
            form.resetFields();
            message.success("Restaurant suspended");
        },
        onError: (e: any) =>
            message.error(e?.response?.data?.error?.message ?? "Suspension failed"),
    });

    // Re-approve a suspended/rejected restaurant (calls the same approve endpoint)
    const unsuspend = useMutation({
        mutationFn: (id: string) => restaurantService.unsuspendRestaurant(id),
        onSuccess: () => {
            invalidate();
            message.success("Restaurant unsuspended");
        },
        onError: (e: any) =>
            message.error(e?.response?.data?.error?.message ?? "Unsuspend failed"),
    });

    const reapprove = useMutation({
        mutationFn: (id: string) => restaurantService.approveRestaurant(id),
        onSuccess: () => {
            invalidate();
            message.success("Restaurant re-approved");
        },
        onError: (e: any) =>
            message.error(e?.response?.data?.error?.message ?? "Re-approval failed"),
  });

  const openReasonModal = useCallback(
    (id: string, name: string, action: "reject" | "suspend") => {
      form.resetFields();
      setReasonModal({ open: true, id, name, action });
    },
    [form],
  );

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: ColumnsType<NormalizedRestaurant> = [
    {
      title: "Restaurant",
      dataIndex: "name",
      width: 240,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            src={r.logoUrl ?? undefined}
            icon={<ShopOutlined />}
            size={38}
            style={{ background: "#f0f0f0", color: "#888", flexShrink: 0 }}
          />
          <div>
            <Text strong style={{ display: "block", fontSize: 13 }}>
              {name}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {[r.city, r.state].filter(Boolean).join(", ")}
              {r.city || r.state ? " · " : ""}
              {r.address !== "—" ? r.address : ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Owner",
      width: 170,
      render: (_: any, r) => (
        <div>
          <Text style={{ fontSize: 13 }}>
            {r.vendorName ?? <Text type="secondary">—</Text>}
          </Text>
          {r.vendorMobile && (
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              {r.vendorMobile}
            </Text>
          )}
          {r.vendorEmail && (
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              {r.vendorEmail}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Rating",
      dataIndex: "avgRating",
      width: 110,
      align: "center",
      sorter: (a, b) => (a.avgRating ?? 0) - (b.avgRating ?? 0),
      render: (v: number | null, r) =>
        v ? (
          <span>
            <StarOutlined
              style={{ color: "#faad14", marginRight: 3, fontSize: 12 }}
            />
            <Text style={{ fontSize: 13 }}>{v.toFixed(1)}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {" "}
              ({r.totalRatings})
            </Text>
          </span>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            No ratings
          </Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      align: "center",
      filters: [
        { text: "Approved", value: "approved" },
        { text: "Pending", value: "pending" },
        { text: "Rejected", value: "rejected" },
        { text: "Suspended", value: "suspended" },
        { text: "Inactive", value: "inactive" },
      ],
      onFilter: (value, r) => r.status === value,
      render: (v: UIStatus) => (
        <Space direction="vertical" size={2}>
          <Tag
            color={STATUS_COLOR[v]}
            style={{ fontSize: 12, borderRadius: 6 }}
          >
            {STATUS_LABEL[v]}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      width: 110,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (v: string) =>
        v
          ? new Date(v).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    {
      title: "Actions",
      width: 230,
      render: (_: any, r) => (
        <Space size={4} wrap onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailDrawer(r)}
            />
          </Tooltip>

          {/* Approve — for pending restaurants */}
          {r.status === "pending" && (
            <Tooltip title="Approve">
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approve.isPending}
                onClick={() => approve.mutate(r.id)}
              >
                Approve
              </Button>
            </Tooltip>
          )}

          {/* Re-approve — for suspended or rejected */}
          {r.status === "suspended" && (
            <Tooltip title="Unsuspend restaurant">
              <Button
                size="small"
                type="primary"
                ghost
                icon={<PlayCircleOutlined />}
                loading={unsuspend.isPending}
                onClick={() => unsuspend.mutate(r.id)}
              >
                Unsuspend
              </Button>
            </Tooltip>
          )}

          {r.status === "rejected" && (
            <Tooltip title="Re-approve restaurant">
              <Button
                size="small"
                type="primary"
                ghost
                icon={<CheckCircleOutlined />}
                loading={reapprove.isPending}
                onClick={() => reapprove.mutate(r.id)}
              >
                Re-approve
              </Button>
            </Tooltip>
          )}
          {/* Reject — for pending or approved (not already rejected) */}
          {r.status === "pending" && (
            <Tooltip title="Reject restaurant">
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => openReasonModal(r.id, r.name, "reject")}
              >
                Reject
              </Button>
            </Tooltip>
          )}
          {/* Suspend — only for approved */}
          {(r.status === "approved" || r.status === "inactive") && (
            <Tooltip title="Suspend restaurant">
              <Button
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => openReasonModal(r.id, r.name, "suspend")}
              >
                Suspend
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load restaurants"
        description="Could not fetch restaurant list. Check your API connection and try again."
        action={
          <Button size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
        style={{ margin: 24 }}
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Restaurants
        </Title>
        <Tooltip title="Refresh">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Tooltip>
      </div>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <StatCard
            label="Total"
            value={stats.total}
            color="#1677ff"
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            label="Approved"
            value={stats.approved}
            color="#52c41a"
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            label="Pending"
            value={stats.pending}
            color="#faad14"
            loading={isLoading}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            label="Suspended"
            value={stats.suspended}
            color="#ff7875"
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 10 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#bbb" }} />}
            placeholder="Search by name, city, owner or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { label: "All statuses", value: "all" },
              { label: "Approved", value: "approved" },
              { label: "Pending", value: "pending" },
              { label: "Rejected", value: "rejected" },
              { label: "Suspended", value: "suspended" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
          <Text type="secondary" style={{ lineHeight: "32px", fontSize: 13 }}>
            {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}
          </Text>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table<NormalizedRestaurant>
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                description="No restaurants found"
                style={{ padding: "40px 0" }}
              />
            ),
          }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `${total} restaurants`,
            pageSizeOptions: ["10", "15", "30", "50"],
          }}
          onRow={(r) => ({
            style: { cursor: "pointer" },
            onClick: () => setDetailDrawer(r),
          })}
        />
      </Card>

      {/* ── Detail Drawer ── */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              src={detailDrawer?.logoUrl ?? undefined}
              icon={<ShopOutlined />}
              size={36}
              style={{ background: "#f0f0f0", color: "#888" }}
            />
            <span>{detailDrawer?.name}</span>
          </div>
        }
        open={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
        width={420}
        footer={
          detailDrawer && (
            <Space wrap>
              {detailDrawer.status === "pending" && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={approve.isPending}
                  onClick={() => {
                    approve.mutate(detailDrawer.id);
                    setDetailDrawer(null);
                  }}
                >
                  Approve
                </Button>
              )}
              {detailDrawer.status === "suspended" && (
                <Button
                  type="primary"
                  ghost
                  icon={<PlayCircleOutlined />}
                  loading={unsuspend.isPending}
                  onClick={() => {
                    unsuspend.mutate(detailDrawer.id);
                    setDetailDrawer(null);
                  }}
                >
                  Unsuspend
                </Button>
              )}

              {detailDrawer.status === "rejected" && (
                <Button
                  type="primary"
                  ghost
                  icon={<CheckCircleOutlined />}
                  loading={reapprove.isPending}
                  onClick={() => {
                    reapprove.mutate(detailDrawer.id);
                    setDetailDrawer(null);
                  }}
                >
                  Re-approve
                </Button>
              )}
              {detailDrawer.status === "pending" && (
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setDetailDrawer(null);
                    openReasonModal(
                      detailDrawer.id,
                      detailDrawer.name,
                      "reject",
                    );
                  }}
                >
                  Reject
                </Button>
              )}
              {detailDrawer.status === "approved" && (
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={() => {
                    setDetailDrawer(null);
                    openReasonModal(
                      detailDrawer.id,
                      detailDrawer.name,
                      "suspend",
                    );
                  }}
                >
                  Suspend
                </Button>
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
                color={STATUS_COLOR[detailDrawer.status]}
                style={{ fontSize: 13, padding: "2px 10px" }}
              >
                {STATUS_LABEL[detailDrawer.status]}
              </Tag>
              {detailDrawer.isOpen && (
                <Tag
                  color="green"
                  style={{ fontSize: 13, padding: "2px 10px", marginLeft: 6 }}
                >
                  Open Now
                </Tag>
              )}
              {detailDrawer.isPureVeg && (
                <Tag
                  color="green"
                  style={{ fontSize: 13, padding: "2px 10px", marginLeft: 6 }}
                >
                  Pure Veg
                </Tag>
              )}
              {detailDrawer.cuisines?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>
                    Cuisines
                  </Text>
                  {detailDrawer.cuisines.map((c) => (
                    <Tag key={c} style={{ fontSize: 12, marginBottom: 4 }}>
                      {c}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {detailDrawer.description && (
              <>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>
                  Description
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {detailDrawer.description}
                </Text>
              </>
            )}

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
                      ["City", detailDrawer.city || "—"],
                      ["State", detailDrawer.state || "—"],
                      ["Pin Code", detailDrawer.pinCode || "—"],
                      ["Address", detailDrawer.address],
                      ["Phone", detailDrawer.phone],
                      ["FSSAI", detailDrawer.fssaiLicense ?? "—"],
                      [
                        "Delivery Fee",
                        detailDrawer.deliveryFee != null
                          ? `₹${detailDrawer.deliveryFee}`
                          : "—",
                      ],
                      [
                        "Min Order",
                        detailDrawer.minOrderAmount != null
                          ? `₹${detailDrawer.minOrderAmount}`
                          : "—",
                      ],
                      [
                        "Avg Delivery",
                        `${detailDrawer.avgDeliveryMinutes} min`,
                      ],
                      ["Owner", detailDrawer.vendorName ?? "—"],
                      ["Owner Mobile", detailDrawer.vendorMobile ?? "—"],
                      ["Owner Email", detailDrawer.vendorEmail ?? "—"],
                      [
                        "Rating",
                        detailDrawer.avgRating
                          ? `${detailDrawer.avgRating.toFixed(1)} / 5 (${detailDrawer.totalRatings} reviews)`
                          : "No ratings",
                      ],
                      [
                        "Joined",
                        detailDrawer.createdAt
                          ? new Date(detailDrawer.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "—",
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
                          width: 130,
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

            {detailDrawer.operatingHours?.length > 0 && (
              <Card
                title="Operating Hours"
                size="small"
                style={{ borderRadius: 8 }}
              >
                <table
                  style={{
                    width: "100%",
                    fontSize: 13,
                    borderCollapse: "collapse",
                  }}
                >
                  <tbody>
                    {detailDrawer.operatingHours.map((h) => (
                      <tr
                        key={h.day}
                        style={{ borderBottom: "1px solid #f0f0f0" }}
                      >
                        <td
                          style={{
                            padding: "8px 0",
                            color: "#888",
                            width: 130,
                            verticalAlign: "top",
                          }}
                        >
                          {h.day.charAt(0).toUpperCase() + h.day.slice(1)}
                        </td>
                        <td style={{ padding: "8px 0", fontWeight: 500 }}>
                          {h.closed ? (
                            <Tag color="red">Closed</Tag>
                          ) : (
                            `${h.open} - ${h.close}`
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {(detailDrawer.status === "suspended" || detailDrawer.status === "rejected") && detailDrawer.rejectionReason && (
              <Alert
                type={detailDrawer.status === "suspended" ? "warning" : "error"}
                showIcon
                message={
                  detailDrawer.status === "suspended"
                    ? "Suspension reason"
                    : "Rejection reason"
                }
                description={detailDrawer.rejectionReason}
              />
            )}
          </div>
        )}
      </Drawer>

      {/* ── Reason Modal (Reject / Suspend) ── */}
      <Modal
        open={!!reasonModal?.open}
        title={
          reasonModal?.action === "reject"
            ? `Reject "${reasonModal?.name}"`
            : `Suspend "${reasonModal?.name}"`
        }
        onCancel={() => {
          setReasonModal(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={reject.isPending || suspend.isPending}
        okButtonProps={{ danger: true }}
        okText={reasonModal?.action === "reject" ? "Reject" : "Suspend"}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (!reasonModal) return;
            if (reasonModal.action === "reject") {
              reject.mutate({ id: reasonModal.id, reason: values.reason });
            } else {
              suspend.mutate({ id: reasonModal.id, reason: values.reason });
            }
          }}
        >
          <Form.Item
            name="reason"
            label="Reason"
            rules={[
              { required: true, message: "Please provide a reason" },
              { min: 10, message: "Reason must be at least 10 characters" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder={
                reasonModal?.action === "reject"
                  ? "Explain why this restaurant is being rejected..."
                  : "Explain why this restaurant is being suspended..."
              }
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
