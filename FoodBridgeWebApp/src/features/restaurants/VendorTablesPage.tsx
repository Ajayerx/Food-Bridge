import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  Row,
  Col,
  Card,
  Empty,
  Skeleton,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TableOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useTable } from "../../hooks/useTable";
import { useAppSelector } from "../../hooks/useAppSelector";
import type { TableApiRow } from "../../services/table.service";
import type { ColumnsType } from "antd/es/table";

// ─── Inline Status Toggle ─────────────────────────────────────────────────────
const StatusToggle: React.FC<{
  record: TableApiRow;
  canMutate: boolean;
  onToggle: (record: TableApiRow, val: boolean) => void;
  loading: boolean;
}> = ({ record, canMutate, onToggle, loading }) => {
  // Reserved and Occupied — always read-only badges (system controlled)
  if (record.status === "Reserved" || record.status === "Occupied") {
    return (
      <Tag
        style={{
          borderRadius: 20,
          fontWeight: 600,
          fontSize: 12,
          padding: "3px 12px",
          border: `1px solid ${record.status === "Reserved" ? "#fde68a" : "#fca5a5"}`,
          background: record.status === "Reserved" ? "#fffbe6" : "#fff1f2",
          color: record.status === "Reserved" ? "#92400e" : "#be123c",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {record.status === "Reserved" ? "⏳ Reserved" : "🍽️ Occupied"}
      </Tag>
    );
  }

  // Available / OutOfService — read-only tag for non-managers
  if (!canMutate) {
    const isAvailable = record.status === "Available";
    return (
      <Tag
        icon={isAvailable ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        style={{
          borderRadius: 20,
          fontWeight: 600,
          fontSize: 12,
          padding: "3px 12px",
          border: `1px solid ${isAvailable ? "#bbf7d0" : "#fecaca"}`,
          background: isAvailable ? "#f0fdf4" : "#fff5f5",
          color: isAvailable ? "#15803d" : "#dc2626",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {isAvailable ? "Available" : "Out of Service"}
      </Tag>
    );
  }

  // Available / OutOfService — manager can toggle
  return (
    <Switch
      checked={record.status === "Available"}
      onChange={(val) => onToggle(record, val)}
      loading={loading}
      checkedChildren={
        <span style={{ fontSize: 11, fontWeight: 600 }}>Available</span>
      }
      unCheckedChildren={
        <span style={{ fontSize: 11, fontWeight: 600 }}>Out of Service</span>
      }
      style={{
        minWidth: 120,
        background: record.status === "Available" ? "#16a34a" : "#9ca3af",
      }}
    />
  );
};

// ─── Capacity Badge ───────────────────────────────────────────────────────────
const CapacityBadge: React.FC<{ capacity: number }> = ({ capacity }) => {
  const color =
    capacity <= 2
      ? { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" }
      : capacity <= 4
        ? { bg: "#fefce8", text: "#854d0e", border: "#fde68a" }
        : { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
      }}
    >
      <TeamOutlined style={{ fontSize: 11 }} />
      {capacity} {capacity === 1 ? "seat" : "seats"}
    </span>
  );
};

// ─── Summary Cards ────────────────────────────────────────────────────────────
const SummaryCards: React.FC<{ tables: TableApiRow[]; loading: boolean }> = ({
  tables,
  loading,
}) => {
  const total = tables.length;
  const available = tables.filter((t) => t.status === "Available").length;
  const occupied = tables.filter((t) => t.status === "Occupied").length;
  const reserved = tables.filter((t) => t.status === "Reserved").length;
  const outOfService = tables.filter((t) => t.status === "OutOfService").length;
  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);

  const stats = [
    {
      title: "Total Tables",
      value: total,
      icon: <AppstoreOutlined />,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      title: "Available",
      value: available,
      icon: <CheckCircleOutlined />,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      title: "Occupied",
      value: occupied,
      icon: <CloseCircleOutlined />,
      color: "#be123c",
      bg: "#fff1f2",
    },
    {
      title: "Reserved",
      value: reserved,
      icon: <TableOutlined />,
      color: "#92400e",
      bg: "#fffbe6",
    },
    {
      title: "Out of Service",
      value: outOfService,
      icon: <CloseCircleOutlined />,
      color: "#dc2626",
      bg: "#fff5f5",
    },
    {
      title: "Total Seats",
      value: totalSeats,
      icon: <TeamOutlined />,
      color: "#7c3aed",
      bg: "#faf5ff",
    },
  ];

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
      {stats.map((s) => (
        <Col xs={12} sm={4} key={s.title}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export const VendorTablesPage: React.FC = () => {
  const { tables, isLoading, createTable, updateTable, deleteTable } =
    useTable();
  const user = useAppSelector((s) => s.auth.user);

  const canMutate =
    user?.roleType === "Vendor" ||
    (user?.roleType === "Staff" && user?.staffRole === "manager");

  const [modal, setModal] = useState<{
    open: boolean;
    editing?: TableApiRow;
  }>({ open: false });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleStatusToggle = (record: TableApiRow, newVal: boolean) => {
    setTogglingId(record.id);
    updateTable.mutate(
      {
        tableId: record.id,
        data: {
          tableNumber: record.table_number,
          capacity: record.capacity,
          status: newVal ? "Available" : "OutOfService",
        },
      },
      { onSettled: () => setTogglingId(null) },
    );
  };

  useEffect(() => {
    if (modal.open) {
      if (modal.editing) {
        form.setFieldsValue({
          tableNumber: modal.editing.table_number,
          capacity: modal.editing.capacity,
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
      updateTable.mutate(
        {
          tableId: modal.editing.id,
          data: {
            tableNumber: vals.tableNumber,
            capacity: Number(vals.capacity),
            status: modal.editing.status,
          },
        },
        { onSuccess: closeModal },
      );
    } else {
      createTable.mutate(
        { tableNumber: vals.tableNumber, capacity: Number(vals.capacity) },
        { onSuccess: closeModal },
      );
    }
  };

  const isMutating = createTable.isPending || updateTable.isPending;

  const columns: ColumnsType<TableApiRow> = [
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Table Name / Number
        </span>
      ),
      dataIndex: "table_number",
      key: "table_number",
      render: (val: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            <TableOutlined />
          </div>
          <span style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>
            {val || "—"}
          </span>
        </div>
      ),
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Capacity
        </span>
      ),
      dataIndex: "capacity",
      key: "capacity",
      width: 140,
      render: (val: number) => <CapacityBadge capacity={val} />,
      sorter: (a, b) => a.capacity - b.capacity,
    },
    {
      title: (
        <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
          Status
        </span>
      ),
      key: "status",
      width: 180,
      render: (_: any, record: TableApiRow) => (
        <StatusToggle
          record={record}
          canMutate={canMutate}
          onToggle={handleStatusToggle}
          loading={togglingId === record.id}
        />
      ),
      filters: [
        { text: "Available", value: "Available" },
        { text: "Occupied", value: "Occupied" },
        { text: "Reserved", value: "Reserved" },
        { text: "Out of Service", value: "OutOfService" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    ...(canMutate
      ? [
          {
            title: (
              <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
                Actions
              </span>
            ),
            key: "actions",
            width: 110,
            render: (_: any, record: TableApiRow) => (
              <Space size={6}>
                <Tooltip title="Edit table">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setModal({ open: true, editing: record })}
                    style={{
                      borderRadius: 7,
                      border: "1px solid #d1d5db",
                      color: "#374151",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title="Delete this table?"
                  description="Only tables not currently occupied can be deleted."
                  onConfirm={() => deleteTable.mutate(record.id)}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  placement="topRight"
                >
                  <Tooltip title="Delete table">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleteTable.isPending}
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
    <div style={{ padding: "24px", maxWidth: 1200 }}>
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
            Tables
          </Typography.Title>
          <Typography.Text style={{ color: "#6b7280", fontSize: 13 }}>
            Manage your restaurant's seating layout
          </Typography.Text>
        </div>

        {canMutate && (
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
            Add Table
          </Button>
        )}
      </div>

      {/* ── Summary ── */}
      <SummaryCards tables={tables} loading={isLoading} />

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
        <Table<TableApiRow>
          dataSource={tables}
          columns={columns}
          rowKey="id"
          size="middle"
          loading={isLoading}
          pagination={
            tables.length > 10
              ? {
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `${total} tables`,
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
                    No tables yet.{" "}
                    {canMutate && "Click 'Add Table' to create one."}
                  </span>
                }
              />
            ),
          }}
          rowClassName={(_, idx) =>
            idx % 2 === 0 ? "table-row-even" : "table-row-odd"
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
              <TableOutlined />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
              {modal.editing ? "Edit Table" : "Add New Table"}
            </span>
          </div>
        }
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={isMutating}
        okText={modal.editing ? "Save Changes" : "Add Table"}
        cancelText="Cancel"
        width={440}
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
          {/* Table Number */}
          <Form.Item
            name="tableNumber"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                Table Name / Number
              </span>
            }
            rules={[
              {
                required: true,
                message: "Please enter a table name or number",
              },
              { max: 20, message: "Max 20 characters" },
              { whitespace: true, message: "Cannot be blank" },
            ]}
          >
            <Input
              placeholder="e.g. T1, Window Seat, Table 4"
              maxLength={20}
              showCount
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {/* Capacity */}
          <Form.Item
            name="capacity"
            label={
              <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                Seating Capacity
              </span>
            }
            rules={[
              { required: true, message: "Please enter seating capacity" },
              {
                type: "number",
                min: 1,
                max: 50,
                message: "Capacity must be between 1 and 50",
              },
            ]}
            extra={
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                Maximum 50 seats per table
              </span>
            }
          >
            <InputNumber
              min={1}
              max={50}
              style={{ width: "100%", borderRadius: 8 }}
              placeholder="e.g. 4"
              addonBefore={<TeamOutlined />}
            />
          </Form.Item>

          {/* Read-only status when editing */}
          {modal.editing && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                marginTop: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                Current Status
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color:
                    modal.editing.status === "Available"
                      ? "#15803d"
                      : modal.editing.status === "Reserved"
                        ? "#92400e"
                        : modal.editing.status === "Occupied"
                          ? "#be123c"
                          : "#dc2626",
                }}
              >
                {modal.editing.status === "Available"
                  ? "✓ Available"
                  : modal.editing.status === "Reserved"
                    ? "⏳ Reserved"
                    : modal.editing.status === "Occupied"
                      ? "🍽️ Occupied"
                      : "✗ Out of Service"}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                {modal.editing.status === "Reserved" ||
                modal.editing.status === "Occupied"
                  ? "Status is managed automatically by the order system"
                  : "Use the toggle in the table list to change availability"}
              </div>
            </div>
          )}
        </Form>
      </Modal>

      {/* ── Row zebra striping ── */}
      <style>{`
        .table-row-even td { background: #fff !important; }
        .table-row-odd td { background: #fafafa !important; }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          border-bottom: 2px solid #e5e7eb !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #eff6ff !important;
        }
        .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f3f4f6 !important;
        }
      `}</style>
    </div>
  );
};

export default VendorTablesPage;
