import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const BASE_PATH = process.env.VITE_BASE_PATH || "/dnd-card-maker/";

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, ".."),
  base: process.env.NODE_ENV === "production" ? BASE_PATH : undefined,
  plugins: [react()],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@src": path.resolve(__dirname, "./src/"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-mui": ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/modifiers", "@dnd-kit/utilities"],
          "vendor-slate": ["slate", "slate-react"],
          "vendor-animation": ["framer-motion"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  test: {
    projects: [
      // Unit tests (stores, schemas, API) — jsdom is sufficient
      {
        extends: true,
        test: {
          name: "unit",
          globals: true,
          environment: "jsdom",
          setupFiles: "./src/test-setup.ts",
          css: false,
          exclude: ["e2e/**", "node_modules/**"],
          include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
        },
      },
      // Storybook component tests — real browser via Playwright
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(__dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
          setupFiles: ["./.storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
