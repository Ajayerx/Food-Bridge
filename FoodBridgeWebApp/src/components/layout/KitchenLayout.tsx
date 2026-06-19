import React from "react";
import { Avatar, Dropdown, Layout, Menu, Space, Tag, Typography } from "antd";
import { BarsOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useRestaurant } from "../../hooks/useRestaurant";
import { useLogout } from "../../hooks/useLogout";
import { useAppSelector } from "../../hooks/useAppSelector";

const { Header, Content } = Layout;

// Kitchen staff can only see the orders board
const menuItems = [
  {
    key: "/kitchen/orders",
    icon: <BarsOutlined />,
    label: <Link to="/kitchen/orders">Orders Board</Link>,
  },
];

export const KitchenLayout: React.FC = () => {
  const location = useLocation();
  const { restaurant } = useRestaurant();
  const logout = useLogout();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          paddingInline: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        {/* Brand */}
        <Typography.Text strong style={{ fontSize: 15, marginRight: 8 }}>
          🍽 FoodBridge
        </Typography.Text>

        {/* Role badge */}
        <Tag color="volcano" style={{ fontSize: 11 }}>
          Kitchen
        </Tag>

        {/* Restaurant name */}
        {restaurant && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {restaurant.name}
          </Typography.Text>
        )}

        {/* Nav */}
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, border: "none", background: "transparent" }}
        />

        {/* User + logout */}
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
  );
};
