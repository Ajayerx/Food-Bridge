import React, { useState, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Modal,
  Rate,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  notification,
  Avatar,
  Tooltip,
  Popover,
  List,
} from "antd";
import {
  MessageOutlined,
  UserOutlined,
  CheckCircleOutlined,
  BellOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRestaurant } from "../../hooks/useRestaurant";
import { socket } from "../../services/socket/socket"; // your existing socket
import api from "../../services/api/base";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
  customer_name: string;
  customer_avatar: string | null;
}

interface VendorNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function fetchRestaurantReviews(restaurantId: string): Promise<Review[]> {
  const res = await api.get(`/restaurants/${restaurantId}/reviews`);
  return res.data.data;
}

async function replyToReview(
  reviewId: string,
  reply_text: string,
): Promise<void> {
  await api.post(`/reviews/${id}/reply`, { reply });
}

async function fetchNotifications(): Promise<{
  data: VendorNotification[];
  unread_count: number;
}> {
  const res = await api.get("/notifications", { params: { limit: 30 } });
  return { data: res.data.data, unread_count: res.data.meta.unread_count };
}

async function markAllRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION BELL (vendor toolbar component)
// ─────────────────────────────────────────────────────────────────────────────

export const VendorNotificationBell: React.FC = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["vendor-notifications"],
    queryFn: fetchNotifications,
    staleTime: 30_000,
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unread_count ?? 0;

  // Real-time: listen for new notifications via socket
  React.useEffect(() => {
    const handleNotif = (payload: any) => {
      qc.invalidateQueries({ queryKey: ["vendor-notifications"] });
      // Also refresh reviews if it's a new_review event
      if (payload.type === "new_review") {
        qc.invalidateQueries({ queryKey: ["vendor-reviews"] });
      }
    };
    socket.on("notification", handleNotif);
    return () => socket.off("notification", handleNotif);
  }, [qc]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    qc.invalidateQueries({ queryKey: ["vendor-notifications"] });
  };

  const content = (
    <div style={{ width: 320 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Typography.Text strong>Notifications</Typography.Text>
        {unreadCount > 0 && (
          <Button size="small" type="link" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No notifications"
          style={{ padding: 16 }}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(n) => (
            <List.Item
              style={{
                background: n.is_read ? "transparent" : "#e6f4ff",
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 4,
              }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ fontSize: 20 }}>
                    {n.type === "new_review" ? "⭐" : "💬"}
                  </div>
                }
                title={
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {n.title}
                  </Typography.Text>
                }
                description={
                  <div>
                    <Typography.Text style={{ fontSize: 12, color: "#666" }}>
                      {n.body}
                    </Typography.Text>
                    <br />
                    <Typography.Text style={{ fontSize: 11, color: "#aaa" }}>
                      {new Date(n.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Typography.Text>
                  </div>
                }
              />
            </List.Item>
          )}
          style={{ maxHeight: 360, overflowY: "auto" }}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) refetch();
      }}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button
          icon={<BellOutlined />}
          shape="circle"
          size="middle"
          style={{
            border: unreadCount > 0 ? "1.5px solid #1677ff" : undefined,
          }}
        />
      </Badge>
    </Popover>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STAR DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <Rate disabled value={rating} style={{ fontSize: 14 }} />
);

// ─────────────────────────────────────────────────────────────────────────────
// REPLY MODAL
// ─────────────────────────────────────────────────────────────────────────────

const ReplyModal: React.FC<{
  review: Review | null;
  onClose: () => void;
}> = ({ review, onClose }) => {
  const [replyText, setReplyText] = useState("");
  const [api_notif, contextHolder] = notification.useNotification();
  const qc = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: () => replyToReview(review!.id, replyText.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-reviews"] });
      api_notif.success({
        message: "Reply sent!",
        description: "The customer has been notified.",
        placement: "topRight",
        duration: 3,
      });
      onClose();
      setReplyText("");
    },
    onError: (e: any) => {
      api_notif.error({
        message: "Failed to send reply",
        description: e?.response?.data?.error?.message ?? "Please try again.",
        placement: "topRight",
        duration: 5,
      });
    },
  });

  if (!review) return null;

  return (
    <>
      {contextHolder}
      <Modal
        open={!!review}
        onCancel={() => {
          onClose();
          setReplyText("");
        }}
        title={
          <Space>
            <MessageOutlined />
            <span>Reply to {review.customer_name}'s Review</span>
          </Space>
        }
        footer={null}
        width={500}
        destroyOnClose
      >
        {/* Customer review */}
        <Card
          size="small"
          style={{ background: "#fafafa", marginBottom: 16, borderRadius: 10 }}
        >
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Space>
              <Avatar
                icon={<UserOutlined />}
                src={review.customer_avatar}
                size={28}
              />
              <Typography.Text strong>{review.customer_name}</Typography.Text>
              <StarDisplay rating={review.rating} />
            </Space>
            {review.comment && (
              <Typography.Text style={{ fontSize: 13, color: "#555" }}>
                "{review.comment}"
              </Typography.Text>
            )}
            <Typography.Text style={{ fontSize: 11, color: "#aaa" }}>
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Typography.Text>
          </Space>
        </Card>

        <Divider style={{ margin: "8px 0" }} />

        <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
          Your Reply
        </Typography.Text>
        <Input.TextArea
          rows={4}
          placeholder="Write a thoughtful reply to the customer's review…"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          maxLength={500}
          showCount
          autoFocus
        />

        <Row justify="end" gutter={8} style={{ marginTop: 16 }}>
          <Col>
            <Button
              onClick={() => {
                onClose();
                setReplyText("");
              }}
            >
              Cancel
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              loading={replyMutation.isPending}
              disabled={!replyText.trim()}
              onClick={() => replyMutation.mutate()}
            >
              Send Reply
            </Button>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW CARD
// ─────────────────────────────────────────────────────────────────────────────

const ReviewCard: React.FC<{
  review: Review;
  onReply: (r: Review) => void;
}> = ({ review, onReply }) => {
  const ratingColor =
    review.rating >= 4
      ? "#52c41a"
      : review.rating === 3
        ? "#faad14"
        : "#ff4d4f";

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        marginBottom: 10,
        borderLeft: `3px solid ${ratingColor}`,
      }}
      styles={{ body: { padding: "14px 16px" } }}
    >
      {/* Header row */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
        <Space>
          <Avatar
            icon={<UserOutlined />}
            src={review.customer_avatar}
            size={32}
            style={{ background: "#e6f4ff" }}
          />
          <div>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {review.customer_name}
            </Typography.Text>
            <br />
            <Typography.Text style={{ fontSize: 11, color: "#aaa" }}>
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Typography.Text>
          </div>
        </Space>
        <Space>
          <StarDisplay rating={review.rating} />
          <Tag
            color={
              review.rating >= 4
                ? "success"
                : review.rating === 3
                  ? "warning"
                  : "error"
            }
            style={{ fontWeight: 700 }}
          >
            {review.rating}/5
          </Tag>
        </Space>
      </Row>

      {/* Comment */}
      {review.comment && (
        <Typography.Paragraph
          style={{
            margin: "6px 0",
            fontSize: 13,
            color: "#444",
            borderLeft: "2px solid #e0e0e0",
            paddingLeft: 10,
          }}
        >
          "{review.comment}"
        </Typography.Paragraph>
      )}

      {/* Existing reply */}
      {review.reply_text ? (
        <div
          style={{
            background: "#f0f9ff",
            borderRadius: 8,
            padding: "8px 12px",
            marginTop: 8,
          }}
        >
          <Space style={{ marginBottom: 4 }}>
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 12 }} />
            <Typography.Text
              style={{ fontSize: 11, color: "#52c41a", fontWeight: 600 }}
            >
              Your Reply
              {review.replied_at &&
                ` · ${new Date(review.replied_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`}
            </Typography.Text>
          </Space>
          <Typography.Text style={{ fontSize: 13, color: "#1677ff" }}>
            {review.reply_text}
          </Typography.Text>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <Tooltip title="Replying publicly shows customers you care">
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={() => onReply(review)}
              style={{ borderRadius: 8 }}
            >
              Reply to customer
            </Button>
          </Tooltip>
        </div>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY STATS
// ─────────────────────────────────────────────────────────────────────────────

const ReviewStats: React.FC<{ reviews: Review[] }> = ({ reviews }) => {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const replied = reviews.filter((r) => !!r.reply_text).length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: Math.round(
      (reviews.filter((r) => r.rating === star).length / reviews.length) * 100,
    ),
  }));

  return (
    <Card size="small" style={{ borderRadius: 12, marginBottom: 16 }}>
      <Row gutter={16} align="middle">
        <Col xs={24} sm={8} style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: avg >= 4 ? "#52c41a" : avg >= 3 ? "#faad14" : "#ff4d4f",
              lineHeight: 1,
            }}
          >
            {avg.toFixed(1)}
          </div>
          <Rate disabled value={avg} allowHalf style={{ fontSize: 16 }} />
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </div>
        </Col>
        <Col xs={24} sm={10}>
          {dist.map(({ star, count, pct }) => (
            <Row
              key={star}
              align="middle"
              gutter={6}
              style={{ marginBottom: 3 }}
            >
              <Col
                style={{
                  width: 16,
                  textAlign: "right",
                  fontSize: 11,
                  color: "#888",
                }}
              >
                {star}
              </Col>
              <Col>
                <span style={{ fontSize: 12 }}>⭐</span>
              </Col>
              <Col flex="auto">
                <div
                  style={{
                    background: "#f0f0f0",
                    borderRadius: 4,
                    overflow: "hidden",
                    height: 8,
                  }}
                >
                  <div
                    style={{
                      background:
                        star >= 4
                          ? "#52c41a"
                          : star === 3
                            ? "#faad14"
                            : "#ff4d4f",
                      width: `${pct}%`,
                      height: "100%",
                      transition: "width 0.4s",
                    }}
                  />
                </div>
              </Col>
              <Col style={{ width: 28, fontSize: 11, color: "#888" }}>
                {count}
              </Col>
            </Row>
          ))}
        </Col>
        <Col xs={24} sm={6} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1677ff" }}>
            {replied}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>replied</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#faad14",
              marginTop: 8,
            }}
          >
            {reviews.length - replied}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>pending reply</div>
        </Col>
      </Row>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TAB COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const VendorReviewsTab: React.FC = () => {
  const { restaurant } = useRestaurant();
  const qc = useQueryClient();
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);
  const [filterReplied, setFilterReplied] = useState<
    "all" | "replied" | "pending"
  >("all");

  const {
    data: reviews = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Review[]>({
    queryKey: ["vendor-reviews", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: () => fetchRestaurantReviews(restaurant!.id),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Real-time: new review arrives
  React.useEffect(() => {
    const handle = (payload: any) => {
      if (payload.type === "new_review") {
        qc.invalidateQueries({ queryKey: ["vendor-reviews"] });
      }
    };
    socket.on("notification", handle);
    return () => socket.off("notification", handle);
  }, [qc]);

  const filtered = reviews.filter((r) => {
    if (filterReplied === "replied") return !!r.reply_text;
    if (filterReplied === "pending") return !r.reply_text;
    return true;
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Customer Reviews
        </Typography.Title>
        <Space>
          <Button
            size="small"
            icon={<ReloadOutlined spin={isFetching} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Space>
      </Row>

      {/* Stats */}
      {reviews.length > 0 && <ReviewStats reviews={reviews} />}

      {/* Filter tabs */}
      {reviews.length > 0 && (
        <Row gutter={8} style={{ marginBottom: 14 }}>
          {(["all", "pending", "replied"] as const).map((f) => (
            <Col key={f}>
              <Button
                size="small"
                type={filterReplied === f ? "primary" : "default"}
                onClick={() => setFilterReplied(f)}
                style={{ borderRadius: 20 }}
              >
                {f === "all"
                  ? `All (${reviews.length})`
                  : f === "pending"
                    ? `Pending Reply (${reviews.filter((r) => !r.reply_text).length})`
                    : `Replied (${reviews.filter((r) => !!r.reply_text).length})`}
              </Button>
            </Col>
          ))}
        </Row>
      )}

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            reviews.length === 0
              ? "No reviews yet. Reviews will appear here after customers rate their orders."
              : `No ${filterReplied} reviews.`
          }
          style={{ padding: 48 }}
        />
      ) : (
        filtered.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onReply={setReplyTarget}
          />
        ))
      )}

      {/* Reply modal */}
      <ReplyModal review={replyTarget} onClose={() => setReplyTarget(null)} />
    </div>
  );
};
