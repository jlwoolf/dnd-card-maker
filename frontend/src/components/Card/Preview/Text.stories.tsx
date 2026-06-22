import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import PreviewText from "./Text";

const meta = { component: PreviewText } satisfies Meta<typeof PreviewText>;
export default meta;

export const Banner: StoryObj<typeof PreviewText> = {
  args: { variant: "banner", children: "Banner Text" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Banner Text")).toBeInTheDocument();
  },
};

export const Box: StoryObj<typeof PreviewText> = {
  args: { variant: "box", children: "Box Text" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Box Text")).toBeInTheDocument();
  },
};

export const Expanded: StoryObj<typeof PreviewText> = {
  args: { variant: "box", expand: true, children: "Expanding box" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Expanding box")).toBeInTheDocument();
  },
};

export const Narrow: StoryObj<typeof PreviewText> = {
  args: { variant: "banner", width: 75, children: "Narrow banner" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Narrow banner")).toBeInTheDocument();
  },
};
