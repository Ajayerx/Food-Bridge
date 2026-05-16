import React from "react";
import {
  Avatar,
  Badge,
  Dropdown,
  Layout,
  Menu,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  BarsOutlined,
  GiftOutlined,
  LogoutOutlined,
  ShopOutlined,
  TeamOutlined,
  BarChartOutlined,
  CarOutlined,
  UserOutlined,
  PlusOutlined,
  SwapOutlined,
  StarOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "../common/NotificationBell";
import { useRestaurant } from "../../hooks/useRestaurant";
import { useLogout } from "../../hooks/useLogout";
import { useAppSelector } from "../../hooks/useAppSelector";

const { Header, Sider, Content } = Layout;
const { Option } = Select;

export const VendorLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant, restaurants, switchRestaurant } = useRestaurant();
  const logout = useLogout();
  const user = useAppSelector((s) => s.auth.user);

  const menuItems = [
    {
      key: "/vendor/dashboard",
      icon: <AppstoreOutlined />,
      label: <Link to="/vendor/dashboard">Dashboard</Link>,
    },
    {
      key: "/vendor/orders",
      icon: <BarsOutlined />,
      label: <Link to="/vendor/orders">Orders Board</Link>,
    },
    {
      key: "/vendor/menu",
      icon: <ShopOutlined />,
      label: <Link to="/vendor/menu">Menu</Link>,
    },
    {
      key: "/vendor/tables",
      icon: <TableOutlined />,
      label: <Link to="/vendor/tables">Tables</Link>,
    },
    {
      key: "/vendor/staff",
      icon: <TeamOutlined />,
      label: <Link to="/vendor/staff">Staff</Link>,
    },
    {
      key: "/vendor/agents",
      icon: <CarOutlined />,
      label: <Link to="/vendor/agents">Delivery Agents</Link>,
    },
    {
      key: "/vendor/coupons",
      icon: <GiftOutlined />,
      label: <Link to="/vendor/coupons">Coupons</Link>,
    },
    {
      key: "/vendor/reviews",
      icon: <StarOutlined />,
      label: <Link to="/vendor/reviews">Reviews</Link>,
    },
    {
      key: "/vendor/reports",
      icon: <BarChartOutlined />,
      label: <Link to="/vendor/reports">Reports</Link>,
    },
  ];

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
          {restaurants.length > 1 ? (
            <>
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
                Active Restaurant
              </Typography.Text>
              <Select
                value={restaurant?.id}
                onChange={(id) => switchRestaurant(id)}
                size="small"
                style={{ width: "100%" }}
                dropdownStyle={{ minWidth: 220 }}
                suffixIcon={<SwapOutlined style={{ color: "#888" }} />}
              >
                {restaurants.map((r) => (
                  <Option key={r.id} value={r.id}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Badge
                        color={
                          r.status === "approved"
                            ? "green"
                            : r.status === "pending"
                              ? "gold"
                              : "red"
                        }
                        style={{ flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.name}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </>
          ) : restaurant ? (
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
          ) : null}

          <div
            onClick={() => navigate("/register")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              cursor: "pointer",
              color: "#4ade80",
              fontSize: 12,
              opacity: 0.8,
            }}
          >
            <PlusOutlined style={{ fontSize: 10 }} />
            <span>Add new restaurant</span>
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
          {restaurants.length > 1 && restaurant && (
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
