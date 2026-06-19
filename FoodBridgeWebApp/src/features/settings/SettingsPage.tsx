import React from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Switch,
  Typography,
} from "antd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminService } from "../../services/admin.service";

export const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();

  const { isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const res = await adminService.getSettings();
      form.setFieldsValue(res.data.data);
      return res.data.data;
    },
  });

  const save = useMutation({
    mutationFn: (v: any) => adminService.updateSettings(v),
    onSuccess: () => message.success("Settings saved"),
    onError: () => message.error("Failed to save settings"),
  });

  const fields = [
    { name: "deliveryFeeBase", label: "Base Delivery Fee (₹)", type: "number" },
    {
      name: "deliveryFeePerKm",
      label: "Delivery Fee per KM (₹)",
      type: "number",
    },
    { name: "platformFeePercent", label: "Platform Fee (%)", type: "number" },
    {
      name: "maxDeliveryRadiusKm",
      label: "Max Delivery Radius (KM)",
      type: "number",
    },
    { name: "supportEmail", label: "Support Email", type: "text" },
    { name: "supportPhone", label: "Support Phone", type: "text" },
    { name: "maintenanceMode", label: "Maintenance Mode", type: "switch" },
  ];

  return (
    <div style={{ maxWidth: 640 }}>
      <Typography.Title level={4} style={{ marginBottom: 20 }}>
        Platform Settings
      </Typography.Title>
      <Card loading={isLoading}>
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          {fields.map((f) => (
            <Form.Item
              key={f.name}
              name={f.name}
              label={f.label}
              valuePropName={f.type === "switch" ? "checked" : "value"}
            >
              {f.type === "number" ? (
                <InputNumber style={{ width: "100%" }} min={0} />
              ) : f.type === "switch" ? (
                <Switch />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
