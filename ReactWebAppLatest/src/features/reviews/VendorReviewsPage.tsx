import React, { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Progress,
  Rate,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  MessageOutlined,
  StarFilled,
  UserOutlined,
  CheckCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRestaurant } from "../../hooks/useRestaurant";
import { reviewService } from "../../services/review.service";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function starColor(rating: number): string {
  if (rating >= 4) return "#52c41a";
  if (rating >= 3) return "#faad14";
  return "#ff4d4f";
}

// ─── Rating Breakdown ─────────────────────────────────────────────────────────

const RatingBreakdown: React.FC<{ reviews: any[] }> = ({ reviews }) => {
  if (!reviews.length) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <Card
      style={{
        borderRadius: 16,
        border: "1px solid #f0f0f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}
      styles={{ body: { padding: "24px 28px" } }}
    >
      <Row gutter={32} align="middle">
        {/* Big average */}
        <Col xs={24} sm={8} style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#1a1a1a",
              lineHeight: 1,
            }}
          >
            {avg.toFixed(1)}
          </div>
          <Rate
            disabled
            value={avg}
            allowHalf
            style={{ fontSize: 18, color: "#faad14" }}
          />
          <div style={{ color: "#8c8c8c", fontSize: 13, marginTop: 4 }}>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </div>
        </Col>

        {/* Bar breakdown */}
        <Col xs={24} sm={16}>
          {counts.map(({ star, count }) => {
            const pct = reviews.length
              ? Math.round((count / reviews.length) * 100)
              : 0;
            return (
              <div
                key={star}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    width: 20,
                    textAlign: "right",
                    color: "#8c8c8c",
                    fontSize: 13,
                  }}
                >
                  {star}
                </Text>
                <StarFilled style={{ color: "#faad14", fontSize: 12 }} />
                <Progress
                  percent={pct}
                  showInfo={false}
                  strokeColor={starColor(star)}
                  trailColor="#f0f0f0"
                  style={{ flex: 1, margin: 0 }}
                  size="small"
                />
                <Text style={{ width: 28, color: "#8c8c8c", fontSize: 13 }}>
                  {count}
                </Text>
              </div>
            );
          })}
        </Col>
      </Row>
    </Card>
  );
};

// ─── Reply Modal ──────────────────────────────────────────────────────────────

const ReplyModal: React.FC<{
  review: any;
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  loading: boolean;
}> = ({ review, open, onClose, onSubmit, loading }) => {
  const [text, setText] = useState("");

  const handleOk = () => {
    if (!text.trim()) return message.warning("Please enter a reply.");
    onSubmit(text.trim());
  };

  return (
    <Modal
      open={open}
      title={
        <Space>
          <MessageOutlined style={{ color: "#1677ff" }} />
          <span>Reply to Review</span>
        </Space>
      }
      onCancel={onClose}
      onOk={handleOk}
      okText="Send Reply"
      confirmLoading={loading}
      okButtonProps={{ style: { borderRadius: 8 } }}
      cancelButtonProps={{ style: { borderRadius: 8 } }}
      destroyOnClose
      afterClose={() => setText("")}
    >
      {review && (
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <Rate
            disabled
            value={review.rating}
            style={{ fontSize: 13, color: "#faad14" }}
          />
          <Paragraph style={{ margin: "6px 0 0", color: "#444", fontSize: 14 }}>
            {review.comment || <Text type="secondary">No comment</Text>}
          </Paragraph>
        </div>
      )}
      <TextArea
        rows={4}
        placeholder="Write a professional, friendly reply to this customer…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        showCount
        style={{ borderRadius: 8 }}
      />
    </Modal>
  );
};

// ─── Review Card ──────────────────────────────────────────────────────────────

const ReviewCard: React.FC<{
  review: any;
  onReply: (review: any) => void;
}> = ({ review, onReply }) => {
  const hasReply = !!review.reply_text;

  return (
    <Card
      style={{
        borderRadius: 14,
        border: "1px solid #f0f0f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        marginBottom: 16,
        transition: "box-shadow 0.2s",
      }}
      styles={{ body: { padding: "18px 20px" } }}
      hoverable
    >
      <div style={{ display: "flex", gap: 14 }}>
        {/* Avatar */}
        <Avatar
          icon={<UserOutlined />}
          style={{ background: "#e8f0fe", color: "#1677ff", flexShrink: 0 }}
          size={42}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <Text strong style={{ fontSize: 14 }}>
                {review.customer_name || "Customer"}
              </Text>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 2,
                }}
              >
                <Rate
                  disabled
                  value={review.rating}
                  style={{ fontSize: 13, color: "#faad14" }}
                />
                <Tag
                  color={starColor(review.rating)}
                  style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                >
                  {review.rating}/5
                </Tag>
              </div>
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 12, whiteSpace: "nowrap" }}
            >
              {timeAgo(review.created_at)}
            </Text>
          </div>

          {/* Comment */}
          <Paragraph
            style={{
              margin: "10px 0 0",
              color: "#444",
              fontSize: 14,
              lineHeight: 1.6,
            }}
            ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
          >
            {review.comment || <Text type="secondary">No written comment</Text>}
          </Paragraph>

          {/* Reply section */}
          {hasReply ? (
            <div
              style={{
                marginTop: 14,
                background: "linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%)",
                border: "1px solid #bae0ff",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <CheckCircleOutlined
                  style={{ color: "#1677ff", fontSize: 13 }}
                />
                <Text
                  style={{ color: "#1677ff", fontWeight: 600, fontSize: 12 }}
                >
                  Your Reply
                </Text>
                {review.replied_at && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    · {timeAgo(review.replied_at)}
                  </Text>
                )}
              </div>
              <Text style={{ fontSize: 13, color: "#333" }}>
                {review.reply_text}
              </Text>
            </div>
          ) : (
            <Button
              type="dashed"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => onReply(review)}
              style={{ marginTop: 12, borderRadius: 8, fontSize: 13 }}
            >
              Reply to this review
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const VendorReviewsPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const queryClient = useQueryClient();
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterReply, setFilterReply] = useState<string>("all");
  const [replyTarget, setReplyTarget] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-reviews", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: () => reviewService.getRestaurantReviews(restaurant!.id),
    staleTime: 0, // ← change from 2 * 60 * 1000
    gcTime: 0, // ← add this
    refetchOnMount: "always", // ← add this
  });

  const reviews: any[] = data?.data?.data ?? [];

  const replyMutation = useMutation({
    mutationFn: ({
      reviewId,
      reply_text,
    }: {
      reviewId: string;
      reply_text: string;
    }) => reviewService.replyToReview(reviewId, reply_text),
    onSuccess: () => {
      message.success("Reply sent successfully!");
      setReplyTarget(null);
      queryClient.invalidateQueries({
        queryKey: ["vendor-reviews", restaurant?.id],
      });
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.error?.message || "Failed to send reply",
      );
    },
  });

  // Filter
  const filtered = reviews.filter((r) => {
    if (filterRating !== "all" && r.rating !== Number(filterRating))
      return false;
    if (filterReply === "replied" && !r.reply_text) return false;
    if (filterReply === "pending" && r.reply_text) return false;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.reply_text).length;

  return (
    <div style={{ padding: "4px 0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Reviews & Ratings
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Manage customer feedback for {restaurant?.name}
          </Text>
        </div>
        {pendingCount > 0 && (
          <Tag
            color="orange"
            style={{ fontSize: 13, padding: "4px 12px", borderRadius: 8 }}
          >
            {pendingCount} awaiting reply
          </Tag>
        )}
      </div>

      {/* Rating Breakdown */}
      {isLoading ? (
        <Card style={{ borderRadius: 16, marginBottom: 24 }}>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
      ) : (
        <RatingBreakdown reviews={reviews} />
      )}

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
      >
        <Space>
          <FilterOutlined style={{ color: "#8c8c8c" }} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Filter:
          </Text>
        </Space>
        <Select
          value={filterRating}
          onChange={setFilterRating}
          style={{ width: 140 }}
          size="middle"
        >
          <Option value="all">All Ratings</Option>
          {[5, 4, 3, 2, 1].map((s) => (
            <Option key={s} value={String(s)}>
              {"⭐".repeat(s)} {s} Star{s !== 1 ? "s" : ""}
            </Option>
          ))}
        </Select>
        <Select
          value={filterReply}
          onChange={setFilterReply}
          style={{ width: 160 }}
          size="middle"
        >
          <Option value="all">All Reviews</Option>
          <Option value="pending">Pending Reply</Option>
          <Option value="replied">Replied</Option>
        </Select>
        {(filterRating !== "all" || filterReply !== "all") && (
          <Button
            size="middle"
            onClick={() => {
              setFilterRating("all");
              setFilterReply("all");
            }}
            style={{ borderRadius: 8 }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Review List */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} style={{ borderRadius: 14, marginBottom: 16 }}>
            <Skeleton avatar active paragraph={{ rows: 2 }} />
          </Card>
        ))
      ) : !filtered.length ? (
        <Empty
          description={
            reviews.length ? "No reviews match this filter" : "No reviews yet"
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: "60px 0" }}
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

      {/* Reply Modal */}
      <ReplyModal
        review={replyTarget}
        open={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        onSubmit={(text) =>
          replyMutation.mutate({ reviewId: replyTarget.id, reply_text: text })
        }
        loading={replyMutation.isPending}
      />
    </div>
  );
};
