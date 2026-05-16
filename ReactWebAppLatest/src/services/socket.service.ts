import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "https://foodapp.softgoway.com";

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
});

socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
});

socket.on("connect_error", (err) => {
    console.error("🔴 Socket connection error:", err.message);
});

export default socket;