import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import React from "react";
import ActionButton from "./ActionButton";

const meta = { component: ActionButton } satisfies Meta<typeof ActionButton>;
export default meta;

export const Default: StoryObj<typeof ActionButton> = {
  args: {
    icon: <span>⭐</span>,
    color: "#f59e0b",
    tooltip: "Favorite",
    onClick: fn(),
  },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button");
    await button.click();
    expect(args.onClick).toHaveBeenCalled();
  },
};

export const Disabled: StoryObj<typeof ActionButton> = {
  args: {
    icon: <span>⭐</span>,
    color: "#f59e0b",
    tooltip: "Favorite",
    onClick: fn(),
    disabled: true,
  },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button");
    await button.click();
    expect(args.onClick).not.toHaveBeenCalled();
  },
};
