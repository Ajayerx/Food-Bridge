import React from "react";
import {
  Avatar,
  Badge,
  Dropdown,
  Layout,
  Menu,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  BarsOutlined,
  ShopOutlined,
  TeamOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  StarOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";
import { NotificationBell } from "../common/NotificationBell";
import { useRestaurant } from "../../hooks/useRestaurant";
import { useLogout } from "../../hooks/useLogout";
import { useAppSelector } from "../../hooks/useAppSelector";

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: "/manager/dashboard",
    icon: <AppstoreOutlined />,
    label: <Link to="/manager/dashboard">Dashboard</Link>,
  },
  {
    key: "/manager/orders",
    icon: <BarsOutlined />,
    label: <Link to="/manager/orders">Orders Board</Link>,
  },
  {
    key: "/manager/menu",
    icon: <ShopOutlined />,
    label: <Link to="/manager/menu">Menu</Link>,
  },
  {
    key: "/manager/tables",
    icon: <TableOutlined />,
    label: <Link to="/manager/tables">Tables</Link>,
  },
  {
    key: "/manager/staff",
    icon: <TeamOutlined />,
    label: <Link to="/manager/staff">Staff</Link>,
  },

  {
    key: "/manager/reviews",
    icon: <StarOutlined />,
    label: <Link to="/manager/reviews">Reviews</Link>,
  },
  {
    key: "/manager/reports",
    icon: <BarChartOutlined />,
    label: <Link to="/manager/reports">Reports</Link>,
  },
];

export const ManagerLayout: React.FC = () => {
  const location = useLocation();
  const { restaurant } = useRestaurant();
  const logout = useLogout();
  const user = useAppSelector((s) => s.auth.user);

  const statusColor =
    restaurant?.status === "approved"
      ? restaurant.isOpen
        ? "green"
        : "orange"
      : "red";

  const statusLabel =
    restaurant?.status === "approved"
      ? restaurant?.isOpen
        ? "Open"
        : "Closed"
      : (restaurant?.status ?? "Pending");

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
        </div>

        <div
          style={{
            padding: "12px 12px 8px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography.Text
            style={{
              color: "#888",
              fontSize: 10,
              display: "block",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Your Restaurant
          </Typography.Text>
          {restaurant ? (
            <>
              <Typography.Text
                style={{
                  color: "#ccc",
                  fontSize: 13,
                  display: "block",
                  fontWeight: 600,
                }}
              >
                {restaurant.name}
              </Typography.Text>
              <Badge
                color={statusColor}
                text={
                  <span style={{ color: "#aaa", fontSize: 11 }}>
                    {statusLabel}
                  </span>
                }
              />
            </>
          ) : (
            <Typography.Text style={{ color: "#666", fontSize: 12 }}>
              Loading…
            </Typography.Text>
          )}
          <Tag
            color="blue"
            style={{ marginTop: 8, fontSize: 10, borderRadius: 4 }}
          >
            Manager
          </Tag>
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
          {restaurant && (
            <Tag
              color={
                restaurant.status === "approved"
                  ? "success"
                  : restaurant.status === "pending"
                    ? "warning"
                    : "error"
              }
            >
              {restaurant.name} · {statusLabel}
            </Tag>
          )}
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
              <Avatar icon={<UserOutlined />} size="small" />
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
