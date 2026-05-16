import React, { useState } from "react";
import { Badge, Button, Dropdown, List, Typography, Empty, Spin } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../../services/notification.service";
import type { Notification } from "types";

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await notificationService.getNotifications({ limit: 20 });
      return res.data.data;
    },
    refetchInterval: 30_000,
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount =
    data?.data?.filter((n: Notification) => !n.isRead).length ?? 0;

  const dropdownContent = (
    <div
      style={{
        width: 340,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Typography.Text strong>Notifications</Typography.Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        )}
      </div>
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : !data?.data?.length ? (
        <Empty description="No notifications" style={{ padding: 24 }} />
      ) : (
        <List
          style={{ maxHeight: 360, overflowY: "auto" }}
          dataSource={data.data as Notification[]}
          renderItem={(n: Notification) => (
            <List.Item
              style={{
                padding: "10px 16px",
                background: n.isRead ? "#fff" : "#f0f7ff",
                cursor: "pointer",
              }}
              onClick={() => !n.isRead && markOne.mutate(n.id)}
            >
              <List.Item.Meta
                title={
                  <Typography.Text strong={!n.isRead}>
                    {n.title}
                  </Typography.Text>
                }
                description={
                  <div>
                    <div style={{ fontSize: 12 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
      </Badge>
    </Dropdown>
  );
};
