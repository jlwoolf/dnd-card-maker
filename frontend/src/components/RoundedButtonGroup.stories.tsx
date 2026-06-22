import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import React from "react";
import RoundedButtonGroup from "./RoundedButtonGroup";

const meta = { component: RoundedButtonGroup } satisfies Meta<typeof RoundedButtonGroup>;
export default meta;

export const Horizontal: StoryObj<typeof RoundedButtonGroup> = {
  name: "Horizontal (default)",
  args: {
    children: (
      <>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("One")).toBeInTheDocument();
    await expect(canvas.getByText("Three")).toBeInTheDocument();
  },
};

export const Vertical: StoryObj<typeof RoundedButtonGroup> = {
  args: {
    vertical: true,
    children: (
      <>
        <button>Top</button>
        <button>Bottom</button>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Top")).toBeInTheDocument();
  },
};
