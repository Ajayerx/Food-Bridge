import React, { useState } from "react";
import { Button, Card, Form, Input, message, Typography } from "antd";
import { MobileOutlined, LockOutlined } from "@ant-design/icons";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import {
  authStart,
  authSuccess,
  authFailure,
} from "../../store/slices/authSlice";
import { authService } from "../../services/auth.service";
import { useNavigate, useLocation, Link } from "react-router-dom";
import type { ApiLoginResponse } from "types";

export const AuthPage: React.FC = () => {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const onRequestOtp = async (values: { mobile: string }) => {
    setLoading(true);
    try {
      await authService.requestOtp(values.mobile);
      setMobile(values.mobile);
      setStep("otp");
      message.success("OTP sent to " + values.mobile);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (values: { otp: string }) => {
    dispatch(authStart());
    setLoading(true);

    try {
      const res = await authService.verifyOtp(mobile, values.otp);

      console.log("res", res);
      const apiUser = res.data.data;
      console.log("apiUser", apiUser);

      const user = {
        id: apiUser.user_id,
        name: apiUser.full_name ?? null, // ✅ fixed: was apiUser.fullname
        mobileNumber: apiUser.mobile_number,
        roleType: apiUser.role,
        staffRole: apiUser.staff_role ?? null,
      };

      console.log("mapped user", user);

      dispatch(
        authSuccess({
          user,
          accessToken: apiUser.access_token,
          refreshToken: apiUser.refresh_token,
        }),
      );

      message.success("Welcome back!");

      // ✅ Navigate based on role directly — don't rely on `from`
      const role = apiUser.role;
      const staffRole = apiUser.staff_role;

      if (role === "Admin") {
        navigate("/#how", { replace: true });
      } else if (role === "Vendor") {
        navigate("/#how", { replace: true });
      } else if (role === "Staff") {
        navigate("/#how", { replace: true });
      } else {
        navigate("/#how", { replace: true });
      }
    } catch (e: any) {
      dispatch(authFailure());
      message.error(e?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <Card
        style={{ width: 380, borderRadius: 12 }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Button 
            type="text" 
            icon={<span>←</span>}
            onClick={() => navigate('/')}
            style={{ padding: '4px 8px' }}
          >
            Back to Home
          </Button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36 }}>🍽</div>
          <Typography.Title level={3} style={{ margin: "8px 0 4px" }}>
            FoodBridge
          </Typography.Title>
          <Typography.Text type="secondary">
            Restaurant Management
          </Typography.Text>
        </div>

        {step === "mobile" ? (
          <Form layout="vertical" onFinish={onRequestOtp}>
            <Form.Item
              name="mobile"
              label="Mobile Number"
              rules={[
                { required: true, message: "Enter your mobile number" },
                { min: 8, message: "Enter a valid number" },
              ]}
            >
              <Input
                prefix={<MobileOutlined />}
                placeholder="e.g. 9876543210"
                size="large"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              Send OTP
            </Button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                New restaurant owner?{" "}
                <Link to="/register" style={{ fontWeight: 600 }}>
                  Register here
                </Link>
              </Typography.Text>
            </div>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={onVerifyOtp}>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              OTP sent to <strong>{mobile}</strong>.{" "}
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => setStep("mobile")}
              >
                Change
              </Button>
            </Typography.Paragraph>
            <Form.Item
              name="otp"
              label="Enter OTP"
              rules={[
                { required: true, message: "Enter the 6-digit OTP" },
                { len: 6, message: "OTP must be 6 digits" },
              ]}
            >
              <Input
                prefix={<LockOutlined />}
                placeholder="6-digit OTP"
                size="large"
                maxLength={6}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              Sign In to Dashboard
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
};
