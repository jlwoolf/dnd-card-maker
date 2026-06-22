import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import CardHoverActions from "./CardHoverActions";

const meta = { component: CardHoverActions } satisfies Meta<typeof CardHoverActions>;
export default meta;

export const AllActions: StoryObj<typeof CardHoverActions> = {
  args: {
    slots: {
      save: { tooltip: "Save to My Cards", icon: <span>💾</span>, color: "#e6b800", onClick: fn(), testId: "save-btn" },
      edit: { tooltip: "Edit Card", icon: <span>✏️</span>, color: "#3b82f6", onClick: fn(), testId: "edit-btn" },
      delete_: { tooltip: "Delete Card", icon: <span>🗑️</span>, color: "#ef4444", onClick: fn(), testId: "delete-btn" },
    },
  },
  play: async ({ canvas, args }) => {
    const { userEvent } = await import("storybook/test");
    await expect(canvas.getByTestId("save-btn")).toBeInTheDocument();
    await expect(canvas.getByTestId("edit-btn")).toBeInTheDocument();
    await expect(canvas.getByTestId("delete-btn")).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId("save-btn"));
    expect(args.slots.save?.onClick).toHaveBeenCalled();
    await userEvent.click(canvas.getByTestId("delete-btn"));
    expect(args.slots.delete_?.onClick).toHaveBeenCalled();
  },
};

export const PartialActions: StoryObj<typeof CardHoverActions> = {
  args: {
    slots: {
      edit: { tooltip: "Edit Card", icon: <span>✏️</span>, color: "#3b82f6", onClick: fn(), testId: "edit-btn" },
      delete_: { tooltip: "Delete Card", icon: <span>🗑️</span>, color: "#ef4444", onClick: fn(), testId: "delete-btn" },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("edit-btn")).toBeInTheDocument();
    await expect(canvas.getByTestId("delete-btn")).toBeInTheDocument();
  },
};
