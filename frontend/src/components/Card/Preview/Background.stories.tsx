import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import Background from "./Background";

const meta = {
  component: Background,
  args: { children: <div>Preview content</div> },
} satisfies Meta<typeof Background>;

export default meta;

export const WithContent: StoryObj<typeof Background> = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Preview content")).toBeInTheDocument();
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  },
};

export const Empty: StoryObj<typeof Background> = {
  args: { children: null },
};
