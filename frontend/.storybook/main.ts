import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
  ],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    const srcPath = path.resolve(dirname, "../src");
    const assetsPath = path.resolve(dirname, "../src/assets");

    if (Array.isArray(config.resolve?.alias)) {
      config.resolve.alias.push(
        { find: "@assets", replacement: assetsPath },
        { find: "@src", replacement: srcPath },
      );
    } else if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@assets": assetsPath,
        "@src": srcPath,
      };
    }

    return config;
  },
};

export default config;
