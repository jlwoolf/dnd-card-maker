import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import ControlButton from "./ControlButton";

const meta = { component: ControlButton } satisfies Meta<typeof ControlButton>;
export default meta;

export const Default: StoryObj<typeof ControlButton> = {
  args: { icon: <span>▶️</span>, label: "Play" },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Play")).toBeInTheDocument();
  },
};

export const WithClick: StoryObj<typeof ControlButton> = {
  args: { icon: <span>▶️</span>, label: "Click me", onClick: fn() },
  play: async ({ canvas, args }) => {
    await canvas.getByLabelText("Click me").click();
    expect(args.onClick).toHaveBeenCalled();
  },
};

export const Disabled: StoryObj<typeof ControlButton> = {
  args: { icon: <span>▶️</span>, label: "Can't click", disabled: true, onClick: fn() },
  play: async ({ canvas, args }) => {
    await canvas.getByLabelText("Can't click").click();
    expect(args.onClick).not.toHaveBeenCalled();
  },
};
