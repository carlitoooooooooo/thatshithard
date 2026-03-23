import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { dbSelect, dbUpdate } from "./dbHelper.js";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICONS = {
  hard: "🔥",
  comment: "💬",
  reaction: "😤",
};

export default function NotificationsPage({ onNotificationsRead }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!currentUser?.username) return;
    try {
      const data = await dbSelect('notifications', { user_username: currentUser.username }, 'created_at.desc');
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Load notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.username]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(notif) {
    if (notif.read) return;
    try {
      await dbUpdate('notifications', { id: notif.id }, { read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
      );
      // Tell parent to refresh unread count
      if (onNotificationsRead) onNotificationsRead();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      // Mark all unread ones
      await Promise.all(unread.map(n => dbUpdate('notifications', { id: n.id }, { read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      if (onNotificationsRead) onNotificationsRead();
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="page-title">🔔 NOTIFICATIONS</div>
            <div className="page-subtitle">
              {unreadCount > 0 ? `${unreadCount} unread` : "all caught up"}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              className="btn-bevel"
              style={{ fontSize: "8px", padding: "6px 10px" }}
              onClick={markAllRead}
            >
              MARK ALL READ
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--pink)", fontFamily: "var(--font-pixel)", fontSize: "11px" }}>
          LOADING...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔔</div>
          <div style={{ fontFamily: "var(--font-pixel)", fontSize: "11px", color: "var(--text-dim)" }}>
            NO NOTIFICATIONS YET
          </div>
          <div style={{ fontFamily: "var(--font-vt)", fontSize: "18px", color: "#555", marginTop: "8px" }}>
            when people hard your tracks you'll see it here
          </div>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`notification-row ${!notif.read ? "notification-row--unread" : ""}`}
              onClick={() => markAsRead(notif)}
            >
              <div className="notification-icon">
                {TYPE_ICONS[notif.type] || "🔔"}
              </div>
              <div className="notification-body">
                <div className="notification-message">{notif.message}</div>
                <div className="notification-time">{timeAgo(notif.created_at)}</div>
              </div>
              {!notif.read && <div className="notification-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
