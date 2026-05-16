import React, { useState } from "react";
import {
  Button,
  Divider,
  Form,
  Input,
  List,
  message,
  Modal,
  Select,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supportService } from "../../services/support.service";
import { useAppSelector } from "../../hooks/useAppSelector";
import type { SupportTicket } from "../../types";

const STATUS_COLOR: Record<string, string> = {
  open: "blue",
  in_progress: "gold",
  resolved: "green",
  closed: "default",
};

export const SupportTicketsPage: React.FC = () => {
  const qc = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.roleType === "admin";
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [form] = Form.useForm();

  const { data } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () =>
      (await supportService.getTickets({ limit: 100 })).data.data.data,
  });

  const { data: detail } = useQuery({
    queryKey: ["ticket", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () =>
      (await supportService.getTicket(selected!.id)).data.data,
  });

  const create = useMutation({
    mutationFn: (v: any) => supportService.createTicket(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      setCreateModal(false);
      message.success("Ticket created");
    },
  });

  const reply = useMutation({
    mutationFn: (msg: string) => supportService.replyTicket(selected!.id, msg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", selected?.id] });
      setReplyText("");
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      supportService.updateStatus(selected!.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket", selected?.id] });
    },
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Support Tickets
        </Typography.Title>
        {!isAdmin && (
          <Button
            type="primary"
            onClick={() => {
              form.resetFields();
              setCreateModal(true);
            }}
          >
            New Ticket
          </Button>
        )}
      </div>

      <List
        dataSource={data ?? []}
        renderItem={(t: SupportTicket) => (
          <List.Item
            style={{
              cursor: "pointer",
              padding: "12px 16px",
              background: selected?.id === t.id ? "#f0f7ff" : "#fff",
              borderRadius: 6,
              marginBottom: 6,
            }}
            onClick={() => setSelected(t)}
          >
            <List.Item.Meta
              title={
                <span>
                  {t.subject}{" "}
                  <Tag color={STATUS_COLOR[t.status]}>{t.status}</Tag>
                </span>
              }
              description={
                <span style={{ fontSize: 12, color: "#999" }}>
                  {t.category} · {new Date(t.createdAt).toLocaleString()}
                </span>
              }
            />
          </List.Item>
        )}
      />

      {/* Ticket Detail Modal */}
      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        title={selected?.subject}
        footer={null}
        width={620}
      >
        {detail && (
          <>
            <div style={{ marginBottom: 12 }}>
              <Tag color={STATUS_COLOR[detail.status]}>{detail.status}</Tag>
              <Tag>{detail.category}</Tag>
              {isAdmin && (
                <Select
                  size="small"
                  value={detail.status}
                  style={{ marginLeft: 8, width: 140 }}
                  options={["open", "in_progress", "resolved", "closed"].map(
                    (v) => ({ label: v, value: v }),
                  )}
                  onChange={(v) => updateStatus.mutate(v)}
                />
              )}
            </div>
            <Divider orientation="left" plain>
              Messages
            </Divider>
            <div
              style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}
            >
              <Timeline
                items={(detail.messages ?? []).map((m: any) => ({
                  color: m.senderRole === "admin" ? "blue" : "gray",
                  children: (
                    <div>
                      <div style={{ fontSize: 11, color: "#999" }}>
                        {m.senderRole} ·{" "}
                        {new Date(m.createdAt).toLocaleString()}
                      </div>
                      <div>{m.message}</div>
                    </div>
                  ),
                }))}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input.TextArea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply..."
              />
              <Button
                type="primary"
                loading={reply.isPending}
                disabled={!replyText.trim()}
                onClick={() => reply.mutate(replyText)}
              >
                Send
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Create Ticket Modal */}
      <Modal
        open={createModal}
        title="New Support Ticket"
        onCancel={() => setCreateModal(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v)}>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                "order_issue",
                "payment_issue",
                "delivery_issue",
                "other",
              ].map((v) => ({ label: v.replace(/_/g, " "), value: v }))}
            />
          </Form.Item>
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
