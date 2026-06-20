import React, { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Typography,
  message,
  Steps,
  Divider,
  Row,
  Col,
  Tag,
  Upload,
  Checkbox,
  Descriptions,
} from "antd";
import {
  ShopOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  BankOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { vendorService } from "../../services/vendor.service";
import type { UploadFile } from "antd";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ── Types ─────────────────────────────────────────────────────────────────────
interface OperatingHours {
  open: string;
  close: string;
  closed: boolean;
}
type OperatingHoursMap = Record<string, OperatingHours>;

interface RegistrationPayload {
  mobile_number: string;
  name: string;
  email?: string;
  company_name: string;
  gstin?: string;
  pan_number?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_holder_name?: string;
  restaurant_name: string;
  description?: string;
  cuisines: string[];
  address: string;
  city: string;
  state: string;
  pin_code: string;
  latitude?: number;
  longitude?: number;
  is_pure_veg: boolean;
  fssai_license?: string;
  contact_phone: string;
  delivery_fee: number;
  min_order_value: number;
  avg_prep_time_minutes: number;
  is_dine_in_enabled: boolean;
  is_takeaway_enabled: boolean;
  is_delivery_enabled: boolean;
  operating_hours: OperatingHoursMap;
  terms_accepted: boolean;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const CUISINE_OPTIONS = [
  "North Indian",
  "South Indian",
  "Chinese",
  "Italian",
  "Mexican",
  "Thai",
  "Japanese",
  "Continental",
  "Fast Food",
  "Biryani",
  "Street Food",
  "Desserts",
  "Beverages",
  "Healthy",
  "Bakery",
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const defaultHours = (): OperatingHoursMap =>
  Object.fromEntries(
    DAYS.map((d) => [d, { open: "09:00", close: "22:00", closed: false }]),
  );

const STEPS = [
  { title: "Account", icon: <UserOutlined /> },
  { title: "Business", icon: <BankOutlined /> },
  { title: "Restaurant", icon: <ShopOutlined /> },
  { title: "Services", icon: <ClockCircleOutlined /> },
  { title: "Review", icon: <CheckCircleOutlined /> },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const validateHours = (hours: OperatingHoursMap): string | null => {
  for (const day of DAYS) {
    const h = hours[day];
    if (!h) return `${day}: missing schedule`;
    if (h.closed) continue;
    if (!h.open || !h.close)
      return `${DAY_LABELS[day]}: set open and close times`;
    if (h.open >= h.close)
      return `${DAY_LABELS[day]}: open time must be before close time`;
  }
  return null;
};

// ── Main Component ────────────────────────────────────────────────────────────
export const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();
  const [form4] = Form.useForm();

  const [hours, setHours] = useState<OperatingHoursMap>(defaultHours());
  const [logoFile, setLogoFile] = useState<UploadFile | null>(null);

  const [stepData, setStepData] = useState<Partial<RegistrationPayload>>({
    delivery_fee: 30,
    min_order_value: 100,
    avg_prep_time_minutes: 30,
    is_dine_in_enabled: true,
    is_takeaway_enabled: true,
    is_delivery_enabled: true,
    is_pure_veg: false,
    terms_accepted: false,
  });

  const forms = [form1, form2, form3, form4];

  const next = async () => {
    try {
      const values = await forms[currentStep].validateFields();
      // Validate operating hours when leaving step 3 (Services)
      if (currentStep === 3) {
        const hoursErr = validateHours(hours);
        if (hoursErr) {
          message.warning(hoursErr);
          return;
        }
      }
      setStepData((prev) => ({ ...prev, ...values }));
      setCurrentStep((s) => s + 1);
    } catch {
      // validation failed — antd shows inline errors
    }
  };

  const prev = () => setCurrentStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      // Final validation of all collected data
      const allData = {
        ...stepData,
        ...form4.getFieldsValue(),
        operating_hours: hours,
      };
      const hoursErr = validateHours(hours);
      if (hoursErr) {
        message.warning(hoursErr);
        setCurrentStep(3);
        return;
      }
      if (!allData.terms_accepted) {
        message.warning("Please accept the Terms & Conditions to proceed.");
        setCurrentStep(3);
        return;
      }

      const finalData: RegistrationPayload = allData as RegistrationPayload;

      setLoading(true);
      await vendorService.registerVendor(finalData);
      setSubmitted(true);
    } catch (e: any) {
      if (e?.response?.data?.error?.message) {
        message.error(e.response.data.error.message);
      } else if (e?.response?.data?.errors) {
        // field-level validation errors
        const msgs = Object.values(e.response.data.errors).join("; ");
        message.error(msgs);
      } else if (e?.errorFields) {
        // form validation error — already shown inline
      } else {
        message.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateHour = (
    day: string,
    field: "open" | "close" | "closed",
    value: string | boolean,
  ) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  // ── Review data ─────────────────────────────────────────────────────────────
  const allFormData = {
    ...stepData,
    ...form4.getFieldsValue(),
    operating_hours: hours,
  } as RegistrationPayload;

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <Card
            style={cardStyle}
            styles={{ body: { padding: "56px 48px", textAlign: "center" } }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: 36,
              }}
            >
              <CheckCircleOutlined style={{ color: "#fff" }} />
            </div>
            <Title level={2} style={{ marginBottom: 12, color: "#111" }}>
              Application Submitted!
            </Title>
            <Paragraph
              style={{
                color: "#666",
                fontSize: 16,
                maxWidth: 420,
                margin: "0 auto 32px",
              }}
            >
              Your vendor registration has been sent to our admin team for
              review. You'll receive a confirmation once your restaurant is
              approved — usually within 24–48 hours.
            </Paragraph>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 32,
                textAlign: "left",
              }}
            >
              <Text
                strong
                style={{ display: "block", marginBottom: 8, color: "#166534" }}
              >
                What happens next?
              </Text>
              {[
                "Admin reviews your restaurant details",
                "You receive an approval notification",
                "Login to your vendor dashboard to set up your menu",
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#16a34a",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <Text style={{ color: "#374151" }}>{step}</Text>
                </div>
              ))}
            </div>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/auth")}
              style={{ borderRadius: 8, height: 44, paddingInline: 32 }}
            >
              Back to Login
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
          <Title level={2} style={{ margin: 0, color: "#fff" }}>
            Register Your Restaurant
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
            Join FoodBridge and grow your business
          </Text>
        </div>

        <Card style={cardStyle} styles={{ body: { padding: "36px 40px" } }}>
          {/* Steps */}
          <Steps
            current={currentStep}
            items={STEPS.map((s) => ({ title: s.title, icon: s.icon }))}
            style={{ marginBottom: 36 }}
            size="small"
          />

          {/* ── Step 0: Account ───────────────────────────────────────────── */}
          <div style={{ display: currentStep === 0 ? "block" : "none" }}>
            <SectionHeader
              title="Your Account Details"
              subtitle="This will be used for login and communication"
            />
            <Form
              form={form1}
              layout="vertical"
              initialValues={stepData}
              requiredMark={false}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="mobile_number"
                    label="Mobile Number"
                    rules={[
                      { required: true, message: "Mobile number is required" },
                      {
                        pattern: /^[6-9]\d{9}$/,
                        message: "Enter a valid 10-digit Indian mobile number",
                      },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined style={{ color: "#9ca3af" }} />}
                      placeholder="9876543210"
                      size="large"
                      maxLength={10}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: "Name is required" }]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
                      placeholder="Your full name"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="email"
                label="Email Address (optional)"
                rules={[{ type: "email", message: "Enter a valid email" }]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="you@example.com"
                  size="large"
                />
              </Form.Item>
            </Form>
          </div>

          {/* ── Step 1: Business ──────────────────────────────────────────── */}
          <div style={{ display: currentStep === 1 ? "block" : "none" }}>
            <SectionHeader
              title="Business Information"
              subtitle="Legal details for your vendor account"
            />
            <Form
              form={form2}
              layout="vertical"
              initialValues={stepData}
              requiredMark={false}
            >
              <Form.Item
                name="company_name"
                label="Company / Brand Name"
                rules={[
                  {
                    required: true,
                    message: "Company / Brand name is required",
                  },
                  { max: 200, message: "Must not exceed 200 characters" },
                ]}
              >
                <Input
                  prefix={<BankOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="e.g. Sharma Foods Pvt Ltd"
                  size="large"
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gstin"
                    label="GSTIN (optional)"
                    rules={[
                      {
                        pattern:
                          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                        message: "Enter a valid 15-character GSTIN",
                      },
                    ]}
                  >
                    <Input
                      placeholder="e.g. 29AABCU9603R1ZX"
                      size="large"
                      style={{ textTransform: "uppercase" }}
                      onChange={(e) =>
                        form2.setFieldValue(
                          "gstin",
                          e.target.value.toUpperCase(),
                        )
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="pan_number"
                    label="PAN Number (optional)"
                    rules={[
                      {
                        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: "Enter a valid 10-character PAN",
                      },
                    ]}
                  >
                    <Input
                      placeholder="e.g. ABCDE1234F"
                      size="large"
                      style={{ textTransform: "uppercase" }}
                      maxLength={10}
                      onChange={(e) =>
                        form2.setFieldValue(
                          "pan_number",
                          e.target.value.toUpperCase(),
                        )
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider plain style={{ fontSize: 12, color: "#9ca3af" }}>
                Bank Details (optional — required for payouts)
              </Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="bank_holder_name"
                    label="Account Holder Name"
                  >
                    <Input
                      placeholder="Name as on bank account"
                      size="large"
                      maxLength={200}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="bank_account_number"
                    label="Account Number"
                    dependencies={["bank_ifsc_code", "bank_holder_name"]}
                    rules={[
                      {
                        pattern: /^\d{9,18}$/,
                        message: "Enter a valid account number (9–18 digits)",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const ifsc = getFieldValue("bank_ifsc_code");
                          const holder = getFieldValue("bank_holder_name");
                          if ((ifsc || holder) && !value) {
                            return Promise.reject(
                              new Error(
                                "Account number required when IFSC or holder name is provided",
                              ),
                            );
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <Input
                      placeholder="Bank account number"
                      size="large"
                      maxLength={18}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="bank_ifsc_code"
                    label="IFSC Code"
                    rules={[
                      {
                        pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                        message: "Enter a valid IFSC code (e.g. SBIN0001234)",
                      },
                    ]}
                  >
                    <Input
                      placeholder="e.g. SBIN0001234"
                      size="large"
                      style={{ textTransform: "uppercase" }}
                      maxLength={11}
                      onChange={(e) =>
                        form2.setFieldValue(
                          "bank_ifsc_code",
                          e.target.value.toUpperCase(),
                        )
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>

          {/* ── Step 2: Restaurant ────────────────────────────────────────── */}
          <div style={{ display: currentStep === 2 ? "block" : "none" }}>
            <SectionHeader
              title="Restaurant Details"
              subtitle="Core information about your restaurant"
            />
            <Form
              form={form3}
              layout="vertical"
              initialValues={stepData}
              requiredMark={false}
            >
              <Form.Item
                name="restaurant_name"
                label="Restaurant Name"
                rules={[
                  { required: true, message: "Restaurant name is required" },
                ]}
              >
                <Input
                  prefix={<ShopOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="e.g. Sharma's Kitchen"
                  size="large"
                />
              </Form.Item>
              <Form.Item name="description" label="Description (optional)">
                <TextArea
                  rows={3}
                  placeholder="Tell customers what makes your restaurant special..."
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="cuisines"
                    label="Cuisines"
                    rules={[
                      {
                        required: true,
                        message: "Select at least one cuisine",
                      },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      size="large"
                      placeholder="Select cuisines you serve"
                      optionFilterProp="children"
                      maxTagCount={4}
                    >
                      {CUISINE_OPTIONS.map((c) => (
                        <Option key={c} value={c}>
                          {c}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="is_pure_veg"
                    label="Pure Vegetarian"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Veg" unCheckedChildren="All" />
                  </Form.Item>
                  <Form.Item
                    name="fssai_license"
                    label="FSSAI License (optional)"
                  >
                    <Input
                      placeholder="e.g. 12345678901234"
                      size="large"
                      maxLength={20}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider plain style={{ fontSize: 12, color: "#9ca3af" }}>
                Address
              </Divider>
              <Form.Item
                name="address"
                label="Street / Building / Area"
                rules={[{ required: true, message: "Address is required" }]}
              >
                <TextArea
                  rows={2}
                  placeholder="Shop no, building, street, area"
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="city"
                    label="City"
                    rules={[{ required: true, message: "City is required" }]}
                  >
                    <Input placeholder="City" size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="state"
                    label="State"
                    rules={[{ required: true, message: "State is required" }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select state"
                      showSearch
                      optionFilterProp="children"
                    >
                      {INDIAN_STATES.map((s) => (
                        <Option key={s} value={s}>
                          {s}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="pin_code"
                    label="PIN Code"
                    rules={[
                      { required: true, message: "PIN code is required" },
                      {
                        pattern: /^[1-9][0-9]{5}$/,
                        message: "Enter a valid 6-digit PIN code",
                      },
                    ]}
                  >
                    <Input
                      placeholder="6-digit PIN"
                      size="large"
                      maxLength={6}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Location coordinates (optional)">
                <Row gutter={8} align="middle">
                  <Col span={10}>
                    <Form.Item name="latitude" noStyle>
                      <InputNumber
                        placeholder="Latitude"
                        style={{ width: "100%" }}
                        step={0.000001}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item name="longitude" noStyle>
                      <InputNumber
                        placeholder="Longitude"
                        style={{ width: "100%" }}
                        step={0.000001}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Button
                      icon={<EnvironmentOutlined />}
                      onClick={() => {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            form3.setFieldsValue({
                              latitude: parseFloat(
                                pos.coords.latitude.toFixed(6),
                              ),
                              longitude: parseFloat(
                                pos.coords.longitude.toFixed(6),
                              ),
                            });
                            message.success("Location detected");
                          },
                          () => message.error("Could not get location"),
                        );
                      }}
                    >
                      Detect
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
              <Form.Item
                name="contact_phone"
                label="Restaurant Contact Phone"
                rules={[
                  { required: true, message: "Contact phone is required" },
                  {
                    pattern: /^[6-9]\d{9}$/,
                    message: "Enter a valid 10-digit number",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="Customer-facing phone number"
                  size="large"
                  maxLength={10}
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="delivery_fee"
                    label="Delivery Fee (₹)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0}
                      max={500}
                      size="large"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="min_order_value"
                    label="Min. Order Value (₹)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0}
                      max={5000}
                      size="large"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="avg_prep_time_minutes"
                    label="Avg Prep Time (min)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={5}
                      max={120}
                      size="large"
                      style={{ width: "100%" }}
                      addonAfter="min"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>

          {/* ── Step 3: Services & Operating Hours ───────────────────────── */}
          <div style={{ display: currentStep === 3 ? "block" : "none" }}>
            <SectionHeader
              title="Services & Operating Hours"
              subtitle="Configure how and when you serve customers"
            />
            <Form
              form={form4}
              layout="vertical"
              initialValues={stepData}
              requiredMark={false}
            >
              {/* Service toggles */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    key: "is_delivery_enabled",
                    label: "Delivery",
                    emoji: "🛵",
                  },
                  {
                    key: "is_takeaway_enabled",
                    label: "Takeaway",
                    emoji: "🛍️",
                  },
                  { key: "is_dine_in_enabled", label: "Dine-in", emoji: "🪑" },
                ].map(({ key, label, emoji }) => (
                  <Form.Item
                    key={key}
                    name={key}
                    valuePropName="checked"
                    style={{ margin: 0 }}
                  >
                    <ServiceToggleCard label={label} emoji={emoji} />
                  </Form.Item>
                ))}
              </div>

              {/* Operating hours */}
              <Text
                strong
                style={{ display: "block", marginBottom: 12, color: "#374151" }}
              >
                Operating Hours
              </Text>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {DAYS.map((day, i) => (
                  <div
                    key={day}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      background: i % 2 === 0 ? "#fafafa" : "#fff",
                      borderBottom:
                        i < DAYS.length - 1 ? "1px solid #f0f0f0" : "none",
                    }}
                  >
                    <div style={{ width: 36, flexShrink: 0 }}>
                      <Tag
                        style={{
                          background: hours[day]?.closed
                            ? "#f3f4f6"
                            : "#eff6ff",
                          border: "none",
                          color: hours[day]?.closed ? "#9ca3af" : "#1d4ed8",
                          fontWeight: 600,
                          fontSize: 11,
                          borderRadius: 4,
                        }}
                      >
                        {DAY_LABELS[day]}
                      </Tag>
                    </div>
                    <Switch
                      checked={!hours[day]?.closed}
                      onChange={(v) => updateHour(day, "closed", !v)}
                      size="small"
                    />
                    {hours[day]?.closed ? (
                      <Text style={{ color: "#9ca3af", fontSize: 13, flex: 1 }}>
                        Closed
                      </Text>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                        }}
                      >
                        <Input
                          type="time"
                          value={hours[day]?.open}
                          onChange={(e) =>
                            updateHour(day, "open", e.target.value)
                          }
                          style={{ width: 110, borderRadius: 6, fontSize: 13 }}
                        />
                        <Text style={{ color: "#9ca3af" }}>to</Text>
                        <Input
                          type="time"
                          value={hours[day]?.close}
                          onChange={(e) =>
                            updateHour(day, "close", e.target.value)
                          }
                          style={{ width: 110, borderRadius: 6, fontSize: 13 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Divider />
              <Form.Item
                name="terms_accepted"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error("You must accept the Terms & Conditions"),
                          ),
                  },
                ]}
              >
                <Checkbox>
                  I accept the{" "}
                  <Button type="link" style={{ padding: 0, fontSize: 14 }}>
                    Terms & Conditions
                  </Button>{" "}
                  and{" "}
                  <Button type="link" style={{ padding: 0, fontSize: 14 }}>
                    Privacy Policy
                  </Button>
                </Checkbox>
              </Form.Item>
            </Form>
          </div>

          {/* ── Step 4: Review & Confirm ──────────────────────────────────── */}
          <div style={{ display: currentStep === 4 ? "block" : "none" }}>
            <SectionHeader
              title="Review Your Information"
              subtitle="Please verify all details before submitting"
            />
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <Descriptions
                title="Account"
                column={2}
                size="small"
                bordered
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label="Mobile">
                  {allFormData.mobile_number}
                </Descriptions.Item>
                <Descriptions.Item label="Name">
                  {allFormData.name}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {allFormData.email || "—"}
                </Descriptions.Item>
              </Descriptions>
              <Descriptions
                title="Business"
                column={2}
                size="small"
                bordered
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label="Company">
                  {allFormData.company_name}
                </Descriptions.Item>
                <Descriptions.Item label="GSTIN">
                  {allFormData.gstin || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="PAN">
                  {allFormData.pan_number || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Bank Account">
                  {allFormData.bank_account_number
                    ? `****${allFormData.bank_account_number.slice(-4)}`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="IFSC">
                  {allFormData.bank_ifsc_code || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Account Holder">
                  {allFormData.bank_holder_name || "—"}
                </Descriptions.Item>
              </Descriptions>
              <Descriptions
                title="Restaurant"
                column={2}
                size="small"
                bordered
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label="Name" span={2}>
                  {allFormData.restaurant_name}
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {allFormData.description || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Cuisines" span={2}>
                  {allFormData.cuisines?.join(", ")}
                </Descriptions.Item>
                <Descriptions.Item label="Pure Veg">
                  {allFormData.is_pure_veg ? "Yes" : "No"}
                </Descriptions.Item>
                <Descriptions.Item label="FSSAI">
                  {allFormData.fssai_license || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>
                  {allFormData.address}, {allFormData.city}, {allFormData.state}{" "}
                  — {allFormData.pin_code}
                </Descriptions.Item>
                <Descriptions.Item label="Contact Phone">
                  {allFormData.contact_phone}
                </Descriptions.Item>
                <Descriptions.Item label="Delivery Fee">
                  ₹{allFormData.delivery_fee}
                </Descriptions.Item>
                <Descriptions.Item label="Min Order">
                  ₹{allFormData.min_order_value}
                </Descriptions.Item>
                <Descriptions.Item label="Prep Time">
                  {allFormData.avg_prep_time_minutes} min
                </Descriptions.Item>
              </Descriptions>
              <Descriptions title="Services" column={3} size="small" bordered>
                <Descriptions.Item label="Delivery">
                  {allFormData.is_delivery_enabled ? "✅" : "❌"}
                </Descriptions.Item>
                <Descriptions.Item label="Takeaway">
                  {allFormData.is_takeaway_enabled ? "✅" : "❌"}
                </Descriptions.Item>
                <Descriptions.Item label="Dine-in">
                  {allFormData.is_dine_in_enabled ? "✅" : "❌"}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 32,
              gap: 12,
            }}
          >
            <div>
              {currentStep > 0 && (
                <Button
                  size="large"
                  onClick={prev}
                  icon={<ArrowLeftOutlined />}
                  style={{ borderRadius: 8 }}
                >
                  Back
                </Button>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                Step {currentStep + 1} of {STEPS.length}
              </Text>
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={next}
                  iconPosition="end"
                  icon={<ArrowRightOutlined />}
                  style={{ borderRadius: 8, paddingInline: 28 }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                  style={{
                    borderRadius: 8,
                    paddingInline: 28,
                    background: "#16a34a",
                    borderColor: "#16a34a",
                  }}
                >
                  Submit for Approval
                </Button>
              )}
            </div>
          </div>

          {/* Login link */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Text style={{ color: "#9ca3af", fontSize: 13 }}>
              Already have an account?{" "}
              <Button
                type="link"
                style={{ padding: 0, fontSize: 13 }}
                onClick={() => navigate("/auth")}
              >
                Sign in
              </Button>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div style={{ marginBottom: 24 }}>
    <Title level={4} style={{ margin: 0, color: "#111" }}>
      {title}
    </Title>
    <Text style={{ color: "#9ca3af", fontSize: 13 }}>{subtitle}</Text>
  </div>
);

const ServiceToggleCard: React.FC<{
  label: string;
  emoji: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}> = ({ label, emoji, checked, onChange }) => (
  <div
    onClick={() => onChange?.(!checked)}
    style={{
      border: `2px solid ${checked ? "#3b82f6" : "#e5e7eb"}`,
      borderRadius: 10,
      padding: "16px 12px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.2s",
      background: checked ? "#eff6ff" : "#fafafa",
    }}
  >
    <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
    <Text
      strong
      style={{
        display: "block",
        fontSize: 13,
        color: checked ? "#1d4ed8" : "#374151",
      }}
    >
      {label}
    </Text>
    <Text style={{ fontSize: 11, color: checked ? "#3b82f6" : "#9ca3af" }}>
      {checked ? "Enabled" : "Disabled"}
    </Text>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)",
  padding: "40px 16px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "none",
  boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
};

export default VendorRegisterPage;
