// src/features/notification/NotificationToast.tsx
import React, { useEffect, useRef } from "react";
import {
  useNotificationStore,
  AppNotification,
} from "../../store/notification/notificationStore";
import { useNotifications } from "../../hooks/useNotifications";

// ── Type → visual config ──────────────────────────────────────────────────────
interface TypeConfig {
  icon: string;
  accent: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  // Vendor events
  NEW_ORDER: { icon: "🛎️", accent: "#f97316" },
  ORDER_CANCELLED: { icon: "❌", accent: "#ef4444" },
  NEW_REVIEW: { icon: "⭐", accent: "#eab308" },
  LOW_STOCK: { icon: "⚠️", accent: "#f59e0b" },
  PAYMENT_RECEIVED: { icon: "💰", accent: "#22c55e" },
  ORDER_DISPUTE: { icon: "🚨", accent: "#dc2626" },
  VENDOR_PAYOUT: { icon: "🏦", accent: "#6366f1" },
  // Customer events
  ORDER_CONFIRMED: { icon: "✅", accent: "#22c55e" },
  ORDER_PREPARING: { icon: "👨‍🍳", accent: "#f97316" },
  ORDER_READY: { icon: "🎁", accent: "#8b5cf6" },
  OUT_FOR_DELIVERY: { icon: "🛵", accent: "#3b82f6" },
  ORDER_DELIVERED: { icon: "🎉", accent: "#22c55e" },
  ORDER_CANCELLED_BY_VENDOR: { icon: "😔", accent: "#ef4444" },
  PROMO_OFFER: { icon: "🎟️", accent: "#ec4899" },
  REVIEW_REQUEST: { icon: "✍️", accent: "#eab308" },
  REFUND_INITIATED: { icon: "🔄", accent: "#6366f1" },
  REFUND_COMPLETED: { icon: "💸", accent: "#22c55e" },
};

const DEFAULT_CONFIG: TypeConfig = { icon: "🔔", accent: "#f97316" };

function getConfig(type: string): TypeConfig {
  return TYPE_CONFIG[type] ?? DEFAULT_CONFIG;
}

// ── Single toast card ─────────────────────────────────────────────────────────
interface ToastCardProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}

function ToastCard({ notification, onDismiss, onMarkRead }: ToastCardProps) {
  const config = getConfig(notification.type);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // NEW_ORDER stays 8 s, others 5 s
  const duration = notification.type === "NEW_ORDER" ? 8000 : 5000;

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(notification.id), duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification.id, duration, onDismiss]);

  const handleClick = () => {
    onMarkRead(notification.id);
    onDismiss(notification.id);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <div
      className="fb-toast"
      style={{ "--accent": config.accent } as React.CSSProperties}
      onClick={handleClick}
    >
      <div className="fb-toast__bar" />
      <span className="fb-toast__icon" aria-hidden="true">
        {config.icon}
      </span>
      <div className="fb-toast__body">
        <p className="fb-toast__title">{notification.title}</p>
        <p className="fb-toast__message">{notification.body}</p>
        <span className="fb-toast__time">{timeAgo}</span>
      </div>
      <button
        className="fb-toast__close"
        onClick={handleClose}
        aria-label="Dismiss notification"
      >
        ×
      </button>
      <div
        className="fb-toast__progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

// ── Container — mount at app root, pass userId to initialise listeners ─────────
interface NotificationToastContainerProps {
  userId?: number | string | null;
}

export function NotificationToastContainer({
  userId,
}: NotificationToastContainerProps) {
  const { popupQueue, dismissPopup } = useNotificationStore();
  const { markRead } = useNotifications(userId);

  if (popupQueue.length === 0) return null;

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="fb-toast-container"
        role="region"
        aria-label="Notifications"
      >
        {popupQueue.map((notif: AppNotification) => (
          <ToastCard
            key={notif.id}
            notification={notif}
            onDismiss={dismissPopup}
            onMarkRead={markRead}
          />
        ))}
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTimeAgo(dateStr: string): string {
  const diffSec = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ── Styles (self-contained, no external CSS needed) ───────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

  .fb-toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 360px;
    font-family: 'DM Sans', sans-serif;
    pointer-events: none;
  }

  .fb-toast {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #1a1a2e;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 14px 40px 18px 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
    cursor: pointer;
    pointer-events: all;
    overflow: hidden;
    animation: fb-toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
    transition: transform 0.2s;
  }
  .fb-toast:hover { transform: translateY(-2px) scale(1.01); }

  .fb-toast__bar {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: var(--accent, #f97316);
    border-radius: 14px 0 0 14px;
  }

  .fb-toast__icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }

  .fb-toast__body { flex: 1; min-width: 0; }

  .fb-toast__title {
    font-size: 13px;
    font-weight: 600;
    color: #f1f1f1;
    margin: 0 0 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fb-toast__message {
    font-size: 12px;
    color: #9ca3af;
    margin: 0 0 4px;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .fb-toast__time {
    font-size: 11px;
    color: var(--accent, #f97316);
    opacity: 0.85;
    font-weight: 500;
  }

  .fb-toast__close {
    position: absolute;
    top: 8px; right: 10px;
    width: 22px; height: 22px;
    background: rgba(255,255,255,0.07);
    border: none;
    border-radius: 50%;
    color: #9ca3af;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
  }
  .fb-toast__close:hover { background: rgba(255,255,255,0.14); color: #f1f1f1; }

  .fb-toast__progress {
    position: absolute;
    bottom: 0; left: 0;
    height: 2px; width: 100%;
    background: var(--accent, #f97316);
    opacity: 0.5;
    transform-origin: left;
    animation: fb-toast-progress linear forwards;
  }

  @keyframes fb-toast-in {
    from { opacity: 0; transform: translateX(120%) scale(0.9); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }

  @keyframes fb-toast-progress {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }

  @media (max-width: 480px) {
    .fb-toast-container { width: calc(100vw - 24px); right: 12px; top: 12px; }
  }
`;
