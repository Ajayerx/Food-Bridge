import React, { useState } from "react";
import {
  Button,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  Tooltip,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  FireOutlined,
  AppstoreOutlined,
  InboxOutlined,
  SaveOutlined,
  CloseOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import { useMenu } from "../../hooks/useMenu";
import {
  normalizeCategory,
  normalizeMenuItem,
} from "../../services/menu.service";

const DIETARY_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  Veg: { color: "#16a34a", bg: "#f0fdf4", label: "VEG" },
  Vegan: { color: "#0891b2", bg: "#ecfeff", label: "VEGAN" },
  "Non-Veg": { color: "#dc2626", bg: "#fef2f2", label: "NON-VEG" },
};

const DIETARY_OPTIONS = [
  { label: "🥦 Vegetarian", value: "Veg" },
  { label: "🌱 Vegan", value: "Vegan" },
  { label: "🍗 Non-Vegetarian", value: "Non-Veg" },
];

interface VariantRow {
  id?: string;
  name: string;
  price: number;
  isEditing: boolean;
  draftName: string;
  draftPrice: number;
}

const DietaryDot: React.FC<{ tag: string }> = ({ tag }) => {
  const cfg = DIETARY_CONFIG[tag] ?? DIETARY_CONFIG["Veg"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 4,
        border: `1px solid ${cfg.color}`,
        background: cfg.bg,
        fontSize: 10,
        fontWeight: 700,
        color: cfg.color,
        letterSpacing: "0.04em",
        marginRight: 6,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: cfg.color,
          display: "inline-block",
        }}
      />
      {cfg.label}
    </span>
  );
};

const AvailabilityToggle: React.FC<{
  item: ReturnType<typeof normalizeMenuItem>;
  onToggle: (id: string, isAvailable: boolean) => Promise<void>;
}> = ({ item, onToggle }) => {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const current = optimistic !== null ? optimistic : item.isAvailable;

  const handleToggle = async (checked: boolean) => {
    setOptimistic(checked);
    setLoading(true);
    try {
      await onToggle(item.id, checked);
      setOptimistic(null);
    } catch {
      setOptimistic(!checked);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip
      title={current ? "Click to mark unavailable" : "Click to mark available"}
      placement="left"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          borderRadius: 20,
          border: `1px solid ${current ? "#d1fae5" : "#fee2e2"}`,
          background: current ? "#f0fdf4" : "#fef2f2",
          cursor: loading ? "wait" : "pointer",
          transition: "all 0.2s ease",
          userSelect: "none",
          minWidth: 110,
          justifyContent: "center",
        }}
      >
        <Switch
          size="small"
          checked={current}
          loading={loading}
          onChange={handleToggle}
          style={{ backgroundColor: current ? "#16a34a" : "#d1d5db" }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: current ? "#15803d" : "#dc2626",
            lineHeight: 1,
          }}
        >
          {loading
            ? current
              ? "Enabling…"
              : "Disabling…"
            : current
              ? "Available"
              : "Unavailable"}
        </span>
      </div>
    </Tooltip>
  );
};

// Inline variants panel — expands below the item row, all mutations fire immediately
const InlineVariantsPanel: React.FC<{
  item: ReturnType<typeof normalizeMenuItem>;
  createVariant: (
    itemId: string,
    data: { name: string; price: number },
  ) => Promise<void>;
  updateVariant: (
    itemId: string,
    variantId: string,
    data: { name: string; price: number },
  ) => Promise<void>;
  deleteVariant: (itemId: string, variantId: string) => Promise<void>;
}> = ({ item, createVariant, updateVariant, deleteVariant }) => {
  const initial: VariantRow[] = (item.variants ?? []).map((v: any) => ({
    id: v.id,
    name: v.name,
    price: v.price,
    isEditing: false,
    draftName: v.name,
    draftPrice: v.price,
  }));

  const [rows, setRows] = useState<VariantRow[]>(initial);
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const addRow = () =>
    setRows((r) => [
      ...r,
      { name: "", price: 0, isEditing: true, draftName: "", draftPrice: 0 },
    ]);

  const startEdit = (idx: number) =>
    setRows((r) =>
      r.map((row, i) =>
        i === idx
          ? {
              ...row,
              isEditing: true,
              draftName: row.name,
              draftPrice: row.price,
            }
          : row,
      ),
    );

  const cancelEdit = (idx: number) => {
    if (!rows[idx].id) {
      setRows((r) => r.filter((_, i) => i !== idx));
    } else {
      setRows((r) =>
        r.map((row, i) => (i === idx ? { ...row, isEditing: false } : row)),
      );
    }
  };

  const saveRow = async (idx: number) => {
    const row = rows[idx];
    if (!row.draftName.trim()) return;
    setSaving((s) => ({ ...s, [idx]: true }));
    try {
      if (row.id) {
        await updateVariant(item.id, row.id, {
          name: row.draftName.trim(),
          price: row.draftPrice,
        });
      } else {
        await createVariant(item.id, {
          name: row.draftName.trim(),
          price: row.draftPrice,
        });
      }
      setRows((r) =>
        r.map((row, i) =>
          i === idx
            ? {
                ...row,
                name: row.draftName.trim(),
                price: row.draftPrice,
                isEditing: false,
              }
            : row,
        ),
      );
    } finally {
      setSaving((s) => ({ ...s, [idx]: false }));
    }
  };

  const removeRow = async (idx: number) => {
    const row = rows[idx];
    if (row.id) await deleteVariant(item.id, row.id);
    setRows((r) => r.filter((_, i) => i !== idx));
  };

  const setDraft = (idx: number, field: "draftName" | "draftPrice", val: any) =>
    setRows((r) =>
      r.map((row, i) => (i === idx ? { ...row, [field]: val } : row)),
    );

  return (
    <div
      style={{
        background: "#f8fafc",
        borderTop: "1px dashed #e2e8f0",
        padding: "10px 12px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: rows.length > 0 ? 8 : 4,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#64748b",
            letterSpacing: "0.04em",
          }}
        >
          VARIANTS
        </span>
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addRow}
          style={{ borderRadius: 6, fontSize: 12, height: 26 }}
        >
          Add variant
        </Button>
      </div>

      {rows.length === 0 && (
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          No variants yet — add sizes, portions, or options.
        </span>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map((row, idx) =>
          row.isEditing ? (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "7px 10px",
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #c7d2fe",
              }}
            >
              <Input
                size="small"
                placeholder="e.g. Half, Full, Large"
                value={row.draftName}
                onChange={(e) => setDraft(idx, "draftName", e.target.value)}
                onPressEnter={() => saveRow(idx)}
                style={{ flex: 2 }}
                autoFocus
              />
              <InputNumber
                size="small"
                min={0}
                prefix="₹"
                placeholder="Price"
                value={row.draftPrice}
                onChange={(v) => setDraft(idx, "draftPrice", v ?? 0)}
                onPressEnter={() => saveRow(idx)}
                style={{ flex: 1 }}
              />
              <Tooltip title="Save">
                <Button
                  size="small"
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving[idx]}
                  onClick={() => saveRow(idx)}
                  style={{ borderRadius: 6 }}
                  disabled={!row.draftName.trim()}
                />
              </Tooltip>
              <Tooltip title="Cancel">
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => cancelEdit(idx)}
                  style={{ borderRadius: 6 }}
                />
              </Tooltip>
            </div>
          ) : (
            <div
              key={row.id ?? idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #f1f5f9",
              }}
            >
              <span style={{ fontSize: 13, color: "#1e293b", flex: 2 }}>
                {row.name}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1e293b",
                  flex: 1,
                  textAlign: "right",
                  marginRight: 12,
                }}
              >
                ₹{row.price}
              </span>
              <Space size={4}>
                <Tooltip title="Edit">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => startEdit(idx)}
                    style={{ borderRadius: 6 }}
                  />
                </Tooltip>
                <Popconfirm
                  title="Delete this variant?"
                  onConfirm={() => removeRow(idx)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Delete">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            </div>
          ),
        )}
      </div>
    </div>
  );
};

// Main Component
export const VendorMenuPage: React.FC = () => {
  const {
    categories,
    items,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
    createVariant,
    updateVariant,
    deleteVariant,
  } = useMenu();

  const [openVariantsFor, setOpenVariantsFor] = useState<string | null>(null);

  const [catModal, setCatModal] = useState<{
    open: boolean;
    editing?: ReturnType<typeof normalizeCategory>;
  }>({ open: false });

  const [itemModal, setItemModal] = useState<{
    open: boolean;
    catId?: string;
    editing?: ReturnType<typeof normalizeMenuItem>;
  }>({ open: false });

  const [catForm] = Form.useForm();
  const [itemForm] = Form.useForm();

  const openCat = (cat?: ReturnType<typeof normalizeCategory>) => {
    setCatModal({ open: true, editing: cat });
    catForm.setFieldsValue(
      cat
        ? {
            name: cat.name,
            sortOrder: cat.sortOrder,
            imageUrl: cat.imageUrl,
            isActive: cat.isActive,
          }
        : { name: "", sortOrder: 0, imageUrl: null, isActive: true },
    );
  };

  const openItem = (
    catId: string,
    item?: ReturnType<typeof normalizeMenuItem>,
  ) => {
    setItemModal({ open: true, catId, editing: item });
    itemForm.setFieldsValue(
      item
        ? {
            name: item.name,
            description: item.description,
            price: item.price,
            dietary_tag: item.dietaryTag,
            is_featured: item.isFeatured,
            prep_time_minutes: item.prepTimeMinutes,
            image_url: item.imageUrl,
          }
        : {
            name: "",
            price: 0,
            dietary_tag: "Veg",
            is_featured: false,
            prep_time_minutes: null,
            image_url: null,
          },
    );
  };

  const handleSaveCat = (vals: any) => {
    const data = {
      name: vals.name,
      sortOrder: vals.sortOrder ?? 0,
      imageUrl: vals.imageUrl ?? null,
    };
    if (catModal.editing) {
      updateCategory.mutate(
        {
          id: catModal.editing.id,
          data: { ...data, isActive: vals.isActive ?? true },
        },
        { onSuccess: () => setCatModal({ open: false }) },
      );
    } else {
      createCategory.mutate(data, {
        onSuccess: () => setCatModal({ open: false }),
      });
    }
  };

  const handleSaveItem = (vals: any) => {
    const data = {
      name: vals.name,
      description: vals.description ?? null,
      price: vals.price,
      dietaryTag: vals.dietary_tag,
      isFeatured: vals.is_featured ?? false,
      prepTimeMinutes: vals.prep_time_minutes ?? null,
      imageUrl: vals.image_url ?? null,
    };
    if (itemModal.editing) {
      updateMenuItem.mutate(
        { id: itemModal.editing.id, data },
        { onSuccess: () => setItemModal({ open: false }) },
      );
    } else {
      createMenuItem.mutate(
        { ...data, categoryId: itemModal.catId! },
        { onSuccess: () => setItemModal({ open: false }) },
      );
    }
  };

  const handleToggleAvailability = (
    id: string,
    isAvailable: boolean,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      toggleItemAvailability.mutate(
        { id, isAvailable },
        { onSuccess: () => resolve(), onError: (e) => reject(e) },
      );
    });

  const handleCreateVariant = (
    itemId: string,
    data: { name: string; price: number },
  ) =>
    new Promise<void>((resolve, reject) =>
      createVariant.mutate(
        { itemId, data },
        { onSuccess: () => resolve(), onError: (e) => reject(e) },
      ),
    );

  const handleUpdateVariant = (
    itemId: string,
    variantId: string,
    data: { name: string; price: number },
  ) =>
    new Promise<void>((resolve, reject) =>
      updateVariant.mutate(
        { itemId, variantId, data },
        { onSuccess: () => resolve(), onError: (e) => reject(e) },
      ),
    );

  const handleDeleteVariant = (itemId: string, variantId: string) =>
    new Promise<void>((resolve, reject) =>
      deleteVariant.mutate(
        { itemId, variantId },
        { onSuccess: () => resolve(), onError: (e) => reject(e) },
      ),
    );

  const isCatSaving = createCategory.isPending || updateCategory.isPending;
  const isItemSaving = createMenuItem.isPending || updateMenuItem.isPending;

  if (!isLoading && categories.length === 0) {
    return (
      <div>
        <PageHeader onAddCategory={() => openCat()} />
        <div
          style={{
            marginTop: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Empty
            image={
              <AppstoreOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
            }
            imageStyle={{ height: 72 }}
            description={
              <span style={{ color: "#8c8c8c", fontSize: 15 }}>
                No menu categories yet
              </span>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => openCat()}
            >
              Add your first category
            </Button>
          </Empty>
        </div>
        <CategoryModal
          open={catModal.open}
          editing={catModal.editing}
          form={catForm}
          isSaving={isCatSaving}
          onCancel={() => setCatModal({ open: false })}
          onFinish={handleSaveCat}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader onAddCategory={() => openCat()} />

      <Collapse
        accordion
        style={{ background: "transparent", border: "none" }}
        className="menu-collapse"
      >
        {categories.map((cat: ReturnType<typeof normalizeCategory>) => {
          const catItems = items.filter(
            (i: ReturnType<typeof normalizeMenuItem>) =>
              i.categoryId === cat.id,
          );
          const availableCount = catItems.filter(
            (i: ReturnType<typeof normalizeMenuItem>) => i.isAvailable,
          ).length;

          return (
            <Collapse.Panel
              key={cat.id}
              style={{
                marginBottom: 10,
                border: "1px solid #f0f0f0",
                borderRadius: 10,
                background: "#fff",
                overflow: "hidden",
              }}
              header={
                <Space size={10} align="center">
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {cat.name}
                  </span>
                  <Tag
                    style={{
                      borderRadius: 20,
                      fontWeight: 500,
                      fontSize: 12,
                      padding: "0 8px",
                    }}
                  >
                    {catItems.length} item{catItems.length !== 1 ? "s" : ""}
                  </Tag>
                  {catItems.length > 0 && availableCount < catItems.length && (
                    <Tag
                      color="orange"
                      style={{ borderRadius: 20, fontSize: 12 }}
                    >
                      {catItems.length - availableCount} unavailable
                    </Tag>
                  )}
                  {!cat.isActive && (
                    <Tag color="red" style={{ borderRadius: 20, fontSize: 12 }}>
                      Inactive
                    </Tag>
                  )}
                </Space>
              }
              extra={
                <Space onClick={(e) => e.stopPropagation()} size={4}>
                  <Tooltip title="Add item">
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => openItem(cat.id)}
                      style={{ borderRadius: 6 }}
                    >
                      Item
                    </Button>
                  </Tooltip>
                  <Tooltip title="Edit category">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openCat(cat)}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete category?"
                    description="All items inside will also be deleted."
                    onConfirm={() => deleteCategory.mutate(cat.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="Delete category">
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        style={{ borderRadius: 6 }}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              }
            >
              {catItems.length === 0 ? (
                <div
                  style={{
                    padding: "28px 0",
                    textAlign: "center",
                    color: "#bfbfbf",
                  }}
                >
                  <InboxOutlined
                    style={{ fontSize: 28, marginBottom: 6, display: "block" }}
                  />
                  <span style={{ fontSize: 13 }}>No items yet</span>
                  <br />
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openItem(cat.id)}
                    style={{ marginTop: 4 }}
                  >
                    Add first item
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {catItems.map(
                    (
                      item: ReturnType<typeof normalizeMenuItem>,
                      idx: number,
                    ) => (
                      <div
                        key={item.id}
                        style={{
                          borderBottom:
                            idx < catItems.length - 1
                              ? "1px solid #f5f5f5"
                              : "none",
                        }}
                      >
                        {/* Item row */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 4px",
                            background: item.isAvailable
                              ? "transparent"
                              : "#fafafa",
                            transition: "background 0.2s ease",
                          }}
                        >
                          {/* Left: info */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                              flex: 1,
                              minWidth: 0,
                              opacity: item.isAvailable ? 1 : 0.5,
                              transition: "opacity 0.2s ease",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 4,
                              }}
                            >
                              <DietaryDot tag={item.dietaryTag} />
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: 14,
                                  color: "#1a1a1a",
                                  textDecoration: item.isAvailable
                                    ? "none"
                                    : "line-through",
                                }}
                              >
                                {item.name}
                              </span>
                              {item.isFeatured && (
                                <Tooltip title="Featured item">
                                  <Tag
                                    icon={<FireOutlined />}
                                    color="gold"
                                    style={{
                                      fontSize: 11,
                                      borderRadius: 20,
                                      padding: "0 6px",
                                    }}
                                  >
                                    Featured
                                  </Tag>
                                </Tooltip>
                              )}
                              {/* Variants toggle badge */}
                              <Tooltip
                                title={
                                  openVariantsFor === item.id
                                    ? "Hide variants"
                                    : "Manage variants"
                                }
                              >
                                <Tag
                                  icon={
                                    <AppstoreAddOutlined
                                      style={{ fontSize: 11 }}
                                    />
                                  }
                                  onClick={() =>
                                    setOpenVariantsFor((prev) =>
                                      prev === item.id ? null : item.id,
                                    )
                                  }
                                  style={{
                                    fontSize: 11,
                                    borderRadius: 20,
                                    padding: "0 7px",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    color:
                                      openVariantsFor === item.id
                                        ? "#4f46e5"
                                        : "#6366f1",
                                    borderColor:
                                      openVariantsFor === item.id
                                        ? "#818cf8"
                                        : "#c7d2fe",
                                    background:
                                      openVariantsFor === item.id
                                        ? "#e0e7ff"
                                        : "#eef2ff",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  {item.variants && item.variants.length > 0
                                    ? `${item.variants.length} variant${item.variants.length !== 1 ? "s" : ""}`
                                    : "+ variants"}
                                </Tag>
                              </Tooltip>
                            </div>

                            {item.description && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#8c8c8c",
                                  paddingLeft: 2,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: 400,
                                }}
                              >
                                {item.description}
                              </span>
                            )}

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                paddingLeft: 2,
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: 15,
                                  color: "#1a1a1a",
                                }}
                              >
                                ₹{item.price}
                              </span>
                              {item.prepTimeMinutes && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#8c8c8c",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <ClockCircleOutlined />
                                  {item.prepTimeMinutes} min
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: actions */}
                          <Space
                            size={8}
                            style={{ flexShrink: 0, marginLeft: 16 }}
                          >
                            <AvailabilityToggle
                              item={item}
                              onToggle={handleToggleAvailability}
                            />
                            <Tooltip title="Edit item">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openItem(item.categoryId, item)}
                                style={{ borderRadius: 6 }}
                              />
                            </Tooltip>
                            <Popconfirm
                              title="Delete this item?"
                              onConfirm={() => deleteMenuItem.mutate(item.id)}
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                            >
                              <Tooltip title="Delete item">
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  style={{ borderRadius: 6 }}
                                />
                              </Tooltip>
                            </Popconfirm>
                          </Space>
                        </div>

                        {/* Inline variants panel */}
                        {openVariantsFor === item.id && (
                          <InlineVariantsPanel
                            item={item}
                            createVariant={handleCreateVariant}
                            updateVariant={handleUpdateVariant}
                            deleteVariant={handleDeleteVariant}
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </Collapse.Panel>
          );
        })}
      </Collapse>

      {/* Category Modal */}
      <CategoryModal
        open={catModal.open}
        editing={catModal.editing}
        form={catForm}
        isSaving={isCatSaving}
        onCancel={() => setCatModal({ open: false })}
        onFinish={handleSaveCat}
      />

      {/* Item Modal — variants removed, managed inline on the row */}
      <Modal
        open={itemModal.open}
        title={
          <span style={{ fontWeight: 600 }}>
            {itemModal.editing ? "Edit Item" : "New Item"}
          </span>
        }
        onCancel={() => setItemModal({ open: false })}
        onOk={() => itemForm.submit()}
        confirmLoading={isItemSaving}
        okText={itemModal.editing ? "Save Changes" : "Add Item"}
        width={480}
        destroyOnClose
      >
        <Form
          form={itemForm}
          layout="vertical"
          onFinish={handleSaveItem}
          style={{ paddingTop: 8 }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Paneer Tikka" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={2}
              placeholder="Short description (optional)"
            />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item
              name="price"
              label="Price (₹)"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} prefix="₹" />
            </Form.Item>
            <Form.Item
              name="prep_time_minutes"
              label="Prep Time (min)"
              style={{ flex: 1 }}
            >
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                placeholder="e.g. 15"
              />
            </Form.Item>
          </div>
          <Form.Item
            name="dietary_tag"
            label="Dietary Type"
            initialValue="Veg"
            rules={[{ required: true }]}
          >
            <Select options={DIETARY_OPTIONS} />
          </Form.Item>
          <Form.Item name="image_url" label="Image URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            name="is_featured"
            label="Mark as Featured"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          {!itemModal.editing && (
            <div
              style={{
                marginTop: 4,
                padding: "8px 12px",
                background: "#f0f9ff",
                borderRadius: 8,
                border: "1px solid #bae6fd",
                fontSize: 12,
                color: "#0369a1",
              }}
            >
              After adding, click the <strong>+ variants</strong> badge on the
              item row to add sizes or options.
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

const PageHeader: React.FC<{ onAddCategory: () => void }> = ({
  onAddCategory,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    }}
  >
    <Typography.Title level={4} style={{ margin: 0 }}>
      Menu
    </Typography.Title>
    <Button type="primary" icon={<PlusOutlined />} onClick={onAddCategory}>
      Add Category
    </Button>
  </div>
);

const CategoryModal: React.FC<{
  open: boolean;
  editing?: ReturnType<typeof normalizeCategory>;
  form: any;
  isSaving: boolean;
  onCancel: () => void;
  onFinish: (vals: any) => void;
}> = ({ open, editing, form, isSaving, onCancel, onFinish }) => (
  <Modal
    open={open}
    title={
      <span style={{ fontWeight: 600 }}>
        {editing ? "Edit Category" : "New Category"}
      </span>
    }
    onCancel={onCancel}
    onOk={() => form.submit()}
    confirmLoading={isSaving}
    okText={editing ? "Save Changes" : "Create Category"}
    width={440}
    destroyOnClose
  >
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      style={{ paddingTop: 8 }}
    >
      <Form.Item name="name" label="Category Name" rules={[{ required: true }]}>
        <Input placeholder="e.g. Starters, Main Course" />
      </Form.Item>
      <Form.Item name="imageUrl" label="Image URL">
        <Input placeholder="https://..." />
      </Form.Item>
      <Form.Item name="sortOrder" label="Display Order" initialValue={0}>
        <InputNumber
          min={0}
          style={{ width: "100%" }}
          placeholder="Lower = appears first"
        />
      </Form.Item>
      {editing && (
        <Form.Item
          name="isActive"
          label="Active"
          valuePropName="checked"
          extra="Inactive categories are hidden from customers"
        >
          <Switch />
        </Form.Item>
      )}
    </Form>
  </Modal>
);
