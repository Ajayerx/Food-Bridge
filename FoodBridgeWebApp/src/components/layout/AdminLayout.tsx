import React from "react";
import { Avatar, Dropdown, Layout, Menu, Space, Typography } from "antd";
import {
  AppstoreOutlined,
  ShopOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  TeamOutlined,
  BankOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";
import { NotificationBell } from "../common/NotificationBell";
import { useLogout } from "../../hooks/useLogout";
import { useAppSelector } from "../../hooks/useAppSelector";

const { Header, Sider, Content } = Layout;

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const logout = useLogout();
  const user = useAppSelector((s) => s.auth.user);

  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <AppstoreOutlined />,
      label: <Link to="/admin/dashboard">Dashboard</Link>,
    },
    {
      key: "/admin/restaurants",
      icon: <ShopOutlined />,
      label: <Link to="/admin/restaurants">Restaurants</Link>,
    },
    {
      key: "/admin/vendors",
      icon: <BankOutlined />,
      label: <Link to="/admin/vendors">Vendors</Link>,
    },
    {
      key: "/admin/users",
      icon: <TeamOutlined />,
      label: <Link to="/admin/users">Users</Link>,
    },
    {
      key: "/admin/reports",
      icon: <BarChartOutlined />,
      label: <Link to="/admin/reports">Reports</Link>,
    },
    {
      key: "/admin/support",
      icon: <CustomerServiceOutlined />,
      label: <Link to="/admin/support">Support</Link>,
    },
    {
      key: "/admin/settings",
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">Settings</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="dark">
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Typography.Text strong style={{ color: "#fff", fontSize: 15 }}>
            🍽 FoodBridge
          </Typography.Text>
          <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>
            Admin Panel
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            paddingInline: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <NotificationBell />
          <Dropdown
            menu={{
              items: [
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "Logout",
                  onClick: logout,
                },
              ],
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: "pointer" }}>
              <Avatar
                icon={<UserOutlined />}
                size="small"
                style={{ background: "#722ed1" }}
              />
              <Typography.Text>
                {user?.name || user?.mobileNumber}
              </Typography.Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
