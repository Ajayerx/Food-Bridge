// src/components/notifications/NotificationPanel.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  useNotificationStore,
  AppNotification,
} from "../../store/notification/notificationStore";
import { useNotifications } from "../../hooks/useNotifications";

const TYPE_CONFIG: Record<
  string,
  { icon: string; accent: string; label: string }
> = {
  NEW_ORDER: { icon: "🛎️", accent: "#f97316", label: "New Order" },
  ORDER_CANCELLED: { icon: "❌", accent: "#ef4444", label: "Cancelled" },
  NEW_REVIEW: { icon: "⭐", accent: "#eab308", label: "Review" },
  LOW_STOCK: { icon: "⚠️", accent: "#f59e0b", label: "Stock Alert" },
  PAYMENT_RECEIVED: { icon: "💰", accent: "#22c55e", label: "Payment" },
  ORDER_DISPUTE: { icon: "🚨", accent: "#dc2626", label: "Dispute" },
  VENDOR_PAYOUT: { icon: "🏦", accent: "#6366f1", label: "Payout" },
  ORDER_CONFIRMED: { icon: "✅", accent: "#22c55e", label: "Confirmed" },
  ORDER_PREPARING: { icon: "👨‍🍳", accent: "#f97316", label: "Preparing" },
  OUT_FOR_DELIVERY: { icon: "🛵", accent: "#3b82f6", label: "On the way" },
  ORDER_DELIVERED: { icon: "🎉", accent: "#22c55e", label: "Delivered" },
  PROMO_OFFER: { icon: "🎟️", accent: "#ec4899", label: "Promo" },
  REVIEW_REQUEST: { icon: "✍️", accent: "#eab308", label: "Review Us" },
  REFUND_INITIATED: { icon: "🔄", accent: "#6366f1", label: "Refund" },
  REFUND_COMPLETED: { icon: "💸", accent: "#22c55e", label: "Refund Done" },
  ORDER_CANCELLED_BY_VENDOR: {
    icon: "😔",
    accent: "#ef4444",
    label: "Cancelled",
  },
};

const DEFAULT_CONFIG = { icon: "🔔", accent: "#f97316", label: "Notification" };

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "orders", label: "Orders" },
  { key: "reviews", label: "Reviews" },
  { key: "payments", label: "Payments" },
];

const ORDER_TYPES = [
  "NEW_ORDER",
  "ORDER_CANCELLED",
  "ORDER_CONFIRMED",
  "ORDER_PREPARING",
  "OUT_FOR_DELIVERY",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED_BY_VENDOR",
  "ORDER_DISPUTE",
  "ORDER_READY",
];
const REVIEW_TYPES = ["NEW_REVIEW", "REVIEW_REQUEST"];
const PAYMENT_TYPES = [
  "PAYMENT_RECEIVED",
  "VENDOR_PAYOUT",
  "REFUND_INITIATED",
  "REFUND_COMPLETED",
  "PROMO_OFFER",
];

function filterNotifications(
  notifs: AppNotification[],
  tab: string,
): AppNotification[] {
  switch (tab) {
    case "unread":
      return notifs.filter((n) => !n.isRead);
    case "orders":
      return notifs.filter((n) => ORDER_TYPES.includes(n.type));
    case "reviews":
      return notifs.filter((n) => REVIEW_TYPES.includes(n.type));
    case "payments":
      return notifs.filter((n) => PAYMENT_TYPES.includes(n.type));
    default:
      return notifs;
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Notification row ─────────────────────────────────────────────────────
function NotifRow({
  notif,
  onRead,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
}) {
  const config = TYPE_CONFIG[notif.type] ?? DEFAULT_CONFIG;

  return (
    <div
      className={`notif-row ${notif.isRead ? "read" : "unread"}`}
      style={{ "--accent": config.accent } as React.CSSProperties}
      onClick={() => !notif.isRead && onRead(notif.id)}
    >
      {!notif.isRead && <div className="notif-unread-dot" />}
      <div className="notif-icon">{config.icon}</div>
      <div className="notif-text">
        <div className="notif-row-header">
          <span className="notif-row-title">{notif.title}</span>
          <span className="notif-row-time">
            {formatTimeAgo(notif.createdAt)}
          </span>
        </div>
        <p className="notif-row-body">{notif.body}</p>
        <span
          className="notif-row-tag"
          style={{ background: config.accent + "20", color: config.accent }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

// ── Bell button with badge ────────────────────────────────────────────────
export function NotificationBell({
  userId,
  onClick,
  isOpen,
}: {
  userId?: number | null;
  onClick: () => void;
  isOpen: boolean;
}) {
  const { badgeCount } = useNotificationStore();
  useNotifications(userId); // Initialise listeners

  return (
    <button
      className={`notif-bell ${isOpen ? "active" : ""}`}
      onClick={onClick}
      aria-label={`Notifications${badgeCount > 0 ? ` (${badgeCount} unread)` : ""}`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {badgeCount > 0 && (
        <span className="notif-badge">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </button>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────
export function NotificationPanel({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId?: number | null;
}) {
  const { notifications, badgeCount, isLoading } = useNotificationStore();
  const { markRead, markAllRead, loadMore } = useNotifications(userId);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = filterNotifications(notifications, activeTab);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadMore(next);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{PANEL_STYLES}</style>
      <div className="notif-panel" ref={panelRef}>
        {/* Header */}
        <div className="notif-panel-header">
          <div>
            <h3 className="notif-panel-title">Notifications</h3>
            {badgeCount > 0 && (
              <span className="notif-panel-subtitle">{badgeCount} unread</span>
            )}
          </div>
          <div className="notif-panel-actions">
            {badgeCount > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllRead}>
                Mark all read
              </button>
            )}
            <button className="notif-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="notif-tabs">
          {FILTER_TABS.map((tab) => {
            const count = tab.key === "unread" ? badgeCount : undefined;
            return (
              <button
                key={tab.key}
                className={`notif-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span className="notif-tab-count">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="notif-list">
          {isLoading && filtered.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-spinner" />
              <p>Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="notif-empty">
              <span className="notif-empty-icon">🔔</span>
              <p className="notif-empty-title">No notifications</p>
              <p className="notif-empty-sub">You're all caught up!</p>
            </div>
          ) : (
            <>
              {filtered.map((n) => (
                <NotifRow key={n.id} notif={n} onRead={markRead} />
              ))}
              {filtered.length >= 20 && (
                <button className="notif-load-more" onClick={handleLoadMore}>
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const PANEL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .notif-bell {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    color: #6b7280;
    border-radius: 10px;
    transition: background 0.2s, color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .notif-bell:hover, .notif-bell.active {
    background: rgba(249,115,22,0.1);
    color: #f97316;
  }
  .notif-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    min-width: 17px;
    height: 17px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid white;
    animation: badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes badgePop {
    from { transform: scale(0); }
    to { transform: scale(1); }
  }

  .notif-panel {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 400px;
    max-height: 560px;
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    animation: panelSlideIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
    z-index: 1000;
  }
  @keyframes panelSlideIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .notif-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 18px 12px;
    border-bottom: 1px solid #f3f4f6;
  }
  .notif-panel-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  .notif-panel-subtitle {
    font-size: 12px;
    color: #f97316;
    font-weight: 600;
  }
  .notif-panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .notif-mark-all-btn {
    font-size: 12px;
    font-weight: 600;
    color: #f97316;
    background: rgba(249,115,22,0.08);
    border: none;
    border-radius: 8px;
    padding: 5px 10px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.2s;
  }
  .notif-mark-all-btn:hover { background: rgba(249,115,22,0.15); }
  .notif-close-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .notif-close-btn:hover { background: #e5e7eb; }

  .notif-tabs {
    display: flex;
    gap: 4px;
    padding: 10px 14px;
    overflow-x: auto;
    border-bottom: 1px solid #f3f4f6;
    scrollbar-width: none;
  }
  .notif-tabs::-webkit-scrollbar { display: none; }
  .notif-tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 20px;
    border: none;
    font-size: 12.5px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    white-space: nowrap;
    background: transparent;
    color: #6b7280;
    transition: all 0.2s;
  }
  .notif-tab:hover { background: #f3f4f6; }
  .notif-tab.active { background: #f97316; color: white; font-weight: 600; }
  .notif-tab-count {
    background: rgba(255,255,255,0.3);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    padding: 0 5px;
    min-width: 16px;
    text-align: center;
  }
  .notif-tab:not(.active) .notif-tab-count {
    background: #fee2e2;
    color: #ef4444;
  }

  .notif-list {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;
  }
  .notif-list::-webkit-scrollbar { width: 4px; }
  .notif-list::-webkit-scrollbar-track { background: transparent; }
  .notif-list::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

  .notif-row {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 16px;
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid #f9fafb;
  }
  .notif-row:hover { background: #fafafa; }
  .notif-row.unread { background: #fff7ed; }
  .notif-row.unread:hover { background: #fef3c7; }

  .notif-unread-dot {
    position: absolute;
    left: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    background: #f97316;
    border-radius: 50%;
  }

  .notif-icon {
    font-size: 22px;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--accent, #f97316)1a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .notif-text { flex: 1; min-width: 0; }
  .notif-row-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 3px;
  }
  .notif-row-title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    line-height: 1.3;
  }
  .notif-row.read .notif-row-title { color: #6b7280; font-weight: 500; }
  .notif-row-time {
    font-size: 11px;
    color: #9ca3af;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .notif-row-body {
    font-size: 12.5px;
    color: #6b7280;
    line-height: 1.4;
    margin: 0 0 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .notif-row-tag {
    display: inline-block;
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    letter-spacing: 0.3px;
  }

  .notif-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    gap: 8px;
  }
  .notif-empty-icon { font-size: 40px; opacity: 0.3; }
  .notif-empty-title { font-size: 15px; font-weight: 600; color: #374151; margin: 0; }
  .notif-empty-sub { font-size: 13px; color: #9ca3af; margin: 0; }

  .notif-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f3f4f6;
    border-top-color: #f97316;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .notif-load-more {
    width: 100%;
    padding: 14px;
    border: none;
    background: transparent;
    color: #f97316;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.2s;
  }
  .notif-load-more:hover { background: #fff7ed; }

  @media (max-width: 480px) {
    .notif-panel {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%;
      max-height: 100%;
      border-radius: 0;
    }
  }
`;
