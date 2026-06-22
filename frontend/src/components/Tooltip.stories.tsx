import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import Tooltip from "./Tooltip";

const meta = { component: Tooltip } satisfies Meta<typeof Tooltip>;
export default meta;

export const Default: StoryObj<typeof Tooltip> = {
  args: {
    title: "Helpful tip",
    children: <span data-testid="tooltip-child">Hover me</span>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("tooltip-child")).toBeInTheDocument();
  },
};

export const WithLongTitle: StoryObj<typeof Tooltip> = {
  args: {
    title: "This is a much longer tooltip message that explains something in great detail",
    children: <span data-testid="tooltip-long">Long tooltip</span>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("tooltip-long")).toBeInTheDocument();
  },
};
