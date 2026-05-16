import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      types: path.resolve(__dirname, "src/types/index.ts"),
    },
  },
  server: {
    proxy: {
      "/v1": {
        target: "http://localhost:44322",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});