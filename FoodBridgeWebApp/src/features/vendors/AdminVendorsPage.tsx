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
    ReloadOutlined,
    SearchOutlined,
    ShopOutlined,
    BankOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService, type VendorListData } from "../../services/vendor.service";
import type { AdminVendor, AdminVendorRestaurant, VendorStatus } from "../../services/vendor.service";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<VendorStatus, string> = {
    Approved: "success",
    Pending: "warning",
    Rejected: "error",
    Suspended: "default",
};

const STATUS_LABEL: Record<VendorStatus, string> = {
    Approved: "Approved",
    Pending: "Pending",
    Rejected: "Rejected",
    Suspended: "Suspended",
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
}

// ── Main component ────────────────────────────────────────────────────────────
export const AdminVendorsPage: React.FC = () => {
    const qc = useQueryClient();

    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [reasonModal, setReasonModal] = useState<ReasonModalState | null>(null);
    const [detailDrawer, setDetailDrawer] = useState<AdminVendor | null>(null);
    const [form] = Form.useForm();

    // ── Query ──────────────────────────────────────────────────────────────────
    const {
        data: result,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin-vendors", search],
        queryFn: async () => {
            const res = await vendorService.getVendors({
                pageSize: 500,
                search: search || undefined,
            });
            return res.data.data as VendorListData;
        },
        staleTime: 30_000,
    });

    const allData = result?.items ?? [];
    const totalCount = result?.totalCount ?? 0;

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = {
        total: totalCount,
        approved: allData.filter((v) => v.status === "Approved").length,
        pending: allData.filter((v) => v.status === "Pending").length,
        suspended: allData.filter((v) => v.status === "Suspended").length,
    };

    // ── Client-side filter (within fetched batch) ──────────────────────────────
    const filtered = allData.filter((v) => {
        const matchStatus = statusFilter === "all" || v.status === statusFilter;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            v.businessName.toLowerCase().includes(q) ||
            (v.userName ?? "").toLowerCase().includes(q) ||
            v.mobileNumber.toLowerCase().includes(q) ||
            (v.email ?? "").toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    // ── Mutations ──────────────────────────────────────────────────────────────
    const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-vendors"] });

    const approve = useMutation({
        mutationFn: (id: string) => vendorService.approveVendor(id),
        onSuccess: () => {
            invalidate();
            message.success("Vendor approved");
        },
        onError: (e: any) =>
            message.error(e?.response?.data?.error?.message ?? "Approval failed"),
    });

    const reject = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            vendorService.rejectVendor(id, reason),
        onSuccess: () => {
            invalidate();
            setReasonModal(null);
            form.resetFields();
            message.success("Vendor rejected");
        },
        onError: (e: any) =>
            message.error(e?.response?.data?.error?.message ?? "Rejection failed"),
    });

    const openReasonModal = useCallback(
        (id: string, name: string) => {
            form.resetFields();
            setReasonModal({ open: true, id, name });
        },
        [form],
    );

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns: ColumnsType<AdminVendor> = [
        {
            title: "Business",
            dataIndex: "businessName",
            width: 220,
            sorter: (a, b) => a.businessName.localeCompare(b.businessName),
            render: (name: string, v) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar
                        icon={<BankOutlined />}
                        size={38}
                        style={{ background: "#722ed1", color: "#fff", flexShrink: 0 }}
                    />
                    <div>
                        <Text strong style={{ display: "block", fontSize: 13 }}>
                            {name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {v.userName ?? "—"}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Contact",
            width: 200,
            render: (_: any, v) => (
                <div>
                    <Text style={{ fontSize: 13 }}>{v.mobileNumber}</Text>
                    {v.email && (
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                            {v.email}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: "Restaurants",
            dataIndex: "restaurantCount",
            width: 110,
            align: "center",
            render: (count: number) => (
                <Text style={{ fontSize: 13 }}>{count}</Text>
            ),
        },
        {
            title: "GST",
            dataIndex: "gstNumber",
            width: 140,
            render: (v: string | null) =>
                v ? (
                    <Text style={{ fontSize: 12 }}>{v}</Text>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 120,
            align: "center",
            filters: [
                { text: "Approved", value: "Approved" },
                { text: "Pending", value: "Pending" },
                { text: "Rejected", value: "Rejected" },
                { text: "Suspended", value: "Suspended" },
            ],
            onFilter: (value, v) => v.status === value,
            render: (v: VendorStatus) => (
                <Tag
                    color={STATUS_COLOR[v]}
                    style={{ fontSize: 12, borderRadius: 6 }}
                >
                    {STATUS_LABEL[v]}
                </Tag>
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
            width: 200,
            render: (_: any, v) => (
                <Space size={4} wrap onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View details">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => setDetailDrawer(v)}
                        />
                    </Tooltip>

                    {v.status === "Pending" && (
                        <>
                            <Tooltip title="Approve vendor">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    loading={approve.isPending}
                                    onClick={() => approve.mutate(v.id)}
                                >
                                    Approve
                                </Button>
                            </Tooltip>
                            <Tooltip title="Reject vendor">
                                <Button
                                    size="small"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => openReasonModal(v.id, v.businessName)}
                                >
                                    Reject
                                </Button>
                            </Tooltip>
                        </>
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
                message="Failed to load vendors"
                description="Could not fetch vendor list. Check your API connection and try again."
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
                    Vendors
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
                        placeholder="Search by business, owner, mobile or email..."
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
                            { label: "Approved", value: "Approved" },
                            { label: "Pending", value: "Pending" },
                            { label: "Rejected", value: "Rejected" },
                            { label: "Suspended", value: "Suspended" },
                        ]}
                    />
                    <Text type="secondary" style={{ lineHeight: "32px", fontSize: 13 }}>
                        {filtered.length} vendor{filtered.length !== 1 ? "s" : ""}
                    </Text>
                </div>
            </Card>

            {/* Table */}
            <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
                <Table<AdminVendor>
                    dataSource={filtered}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    size="middle"
                    locale={{
                        emptyText: (
                            <Empty
                                description="No vendors found"
                                style={{ padding: "40px 0" }}
                            />
                        ),
                    }}
                    pagination={{
                        pageSize: 15,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} vendors`,
                        pageSizeOptions: ["10", "15", "30", "50"],
                    }}
                    onRow={(v) => ({
                        style: { cursor: "pointer" },
                        onClick: () => setDetailDrawer(v),
                    })}
                />
            </Card>

            {/* ── Detail Drawer ── */}
            <Drawer
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar
                            icon={<BankOutlined />}
                            size={36}
                            style={{ background: "#722ed1", color: "#fff" }}
                        />
                        <span>{detailDrawer?.businessName}</span>
                    </div>
                }
                open={!!detailDrawer}
                onClose={() => setDetailDrawer(null)}
                width={420}
                footer={
                    detailDrawer?.status === "Pending" && (
                        <Space>
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
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => {
                                    setDetailDrawer(null);
                                    openReasonModal(detailDrawer.id, detailDrawer.businessName);
                                }}
                            >
                                Reject
                            </Button>
                        </Space>
                    )
                }
            >
                {detailDrawer && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Status badge */}
                        <div>
                            <Tag
                                color={STATUS_COLOR[detailDrawer.status]}
                                style={{ fontSize: 13, padding: "2px 10px" }}
                            >
                                {STATUS_LABEL[detailDrawer.status]}
                            </Tag>
                            {detailDrawer.approvedAt && (
                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                    Approved{" "}
                                    {new Date(detailDrawer.approvedAt).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </Text>
                            )}
                        </div>

                        <Card size="small" style={{ borderRadius: 8 }} title="Business Info">
                            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                                <tbody>
                                    {([
                                        ["Business Name", detailDrawer.businessName],
                                        ["Owner", detailDrawer.userName ?? "—"],
                                        ["Mobile", detailDrawer.mobileNumber],
                                        ["Email", detailDrawer.email ?? "—"],
                                        ["GST Number", detailDrawer.gstNumber ?? "—"],
                                        ["PAN Number", detailDrawer.panNumber ?? "—"],
                                        ["Restaurants", `${detailDrawer.restaurantCount}`],
                                        ["Joined",
                                            new Date(detailDrawer.createdAt).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            }),
                                        ],
                                    ] as [string, string][]).map(([label, value]) => (
                                        <tr key={label} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td style={{ padding: "8px 0", color: "#888", width: 130, verticalAlign: "top" }}>
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

                        <Card size="small" style={{ borderRadius: 8 }} title="Bank Details">
                            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                                <tbody>
                                    {([
                                        ["Account Holder", detailDrawer.bankHolderName ?? "—"],
                                        ["Account Number", detailDrawer.bankAccountNumber ?? "—"],
                                        ["IFSC Code", detailDrawer.bankIfscCode ?? "—"],
                                    ] as [string, string][]).map(([label, value]) => (
                                        <tr key={label} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td style={{ padding: "8px 0", color: "#888", width: 130, verticalAlign: "top" }}>
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

                        {detailDrawer.vendorRestaurants?.map((r: AdminVendorRestaurant, i) => (
                            <Card
                                key={i}
                                size="small"
                                style={{ borderRadius: 8 }}
                                title={
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span>{r.name}</span>
                                        <Tag
                                            color={r.status === "Active" ? "success" : r.status === "Pending" ? "warning" : r.status === "Rejected" ? "error" : "default"}
                                            style={{ fontSize: 11, margin: 0 }}
                                        >
                                            {r.status}
                                        </Tag>
                                        {r.isPureVeg && <Tag color="green" style={{ fontSize: 11, margin: 0 }}>Pure Veg</Tag>}
                                    </div>
                                }
                            >
                                {/* Info table */}
                                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                                    <tbody>
                                        {([
                                            ["Description", r.description ?? "—"],
                                            ["Address", r.addressLine],
                                            ["City", r.city],
                                            ["State", r.state],
                                            ["Pin Code", r.pinCode],
                                            ["Phone", r.phoneNumber ?? "—"],
                                            ["FSSAI License", r.fssaiLicense ?? "—"],
                                            ["Delivery Fee", `₹${r.deliveryFee}`],
                                            ["Min Order", `₹${r.minOrderAmount}`],
                                            ["Avg Prep Time", `${r.avgPrepMinutes} min`],
                                            ["Dine-in", r.isDineInEnabled ? "Yes" : "No"],
                                            ["Takeaway", r.isTakeawayEnabled ? "Yes" : "No"],
                                            ["Delivery", r.isDeliveryEnabled ? "Yes" : "No"],
                                        ] as [string, string][]).map(([label, value]) => (
                                            <tr key={label} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                                <td style={{ padding: "6px 0", color: "#888", width: 120, verticalAlign: "top" }}>
                                                    {label}
                                                </td>
                                                <td style={{ padding: "6px 0", fontWeight: 500 }}>
                                                    {value}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Cuisines */}
                                {r.cuisines.length > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Cuisines</Text>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                            {r.cuisines.map((c) => (
                                                <Tag key={c} style={{ fontSize: 11, borderRadius: 4 }}>{c}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Operating Hours */}
                                {r.operatingHours.length > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Operating Hours</Text>
                                        <div style={{ border: "1px solid #f0f0f0", borderRadius: 6, overflow: "hidden" }}>
                                            {r.operatingHours.map((h, idx) => (
                                                <div
                                                    key={h.day}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        padding: "4px 10px",
                                                        background: idx % 2 === 0 ? "#fafafa" : "#fff",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    <span style={{ width: 36, fontWeight: 600, textTransform: "capitalize", color: "#555" }}>
                                                        {h.day.slice(0, 3)}
                                                    </span>
                                                    <span style={{ color: h.closed ? "#999" : "#333", marginLeft: 8 }}>
                                                        {h.closed ? "Closed" : `${h.open} – ${h.close}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </Drawer>

            {/* ── Reason Modal (Reject) ── */}
            <Modal
                open={!!reasonModal?.open}
                title={`Reject "${reasonModal?.name}"`}
                onCancel={() => {
                    setReasonModal(null);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                confirmLoading={reject.isPending}
                okButtonProps={{ danger: true }}
                okText="Reject"
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(values) => {
                        if (!reasonModal) return;
                        reject.mutate({ id: reasonModal.id, reason: values.reason });
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
                            placeholder="Explain why this vendor is being rejected..."
                            showCount
                            maxLength={500}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
