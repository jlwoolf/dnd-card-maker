import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const BASE_PATH = process.env.VITE_BASE_PATH || "/dnd-card-maker/";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? BASE_PATH : undefined,
  plugins: [react()],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@src": path.resolve(__dirname, "./src/"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
