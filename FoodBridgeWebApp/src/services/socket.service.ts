import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const HUB_BASE_URL =
  import.meta.env.VITE_SIGNALR_URL ||
  import.meta.env.VITE_API_URL ||
  "https://foodapp.softgoway.com";

function getAccessToken(): string {
  try {
    const stored = localStorage.getItem("fb_auth_state");
    if (stored) {
      const { accessToken } = JSON.parse(stored);
      return accessToken ?? "";
    }
  } catch {
    // ignore
  }
  return "";
}

export const orderHub = new HubConnectionBuilder()
  .withUrl(`${HUB_BASE_URL}/hubs/orders`)
  .withAutomaticReconnect()
  .configureLogging(LogLevel.Warning)
  .build();

export const notificationHub = new HubConnectionBuilder()
  .withUrl(`${HUB_BASE_URL}/hubs/notifications`, {
    accessTokenFactory: () => getAccessToken(),
  })
  .withAutomaticReconnect()
  .configureLogging(LogLevel.Warning)
  .build();

orderHub.start().catch((err) => console.error("OrderHub start failed:", err));
notificationHub.start().catch((err) => console.error("NotificationHub start failed:", err));
