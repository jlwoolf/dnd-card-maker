import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import CardMenu from "./CardMenu";

const meta = {
  component: CardMenu,
  args: { children: "Toolbar content" },
} satisfies Meta<typeof CardMenu>;

export default meta;

export const Default: StoryObj<typeof CardMenu> = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Toolbar content")).toBeInTheDocument();
    const paper = canvas.getByText("Toolbar content").closest(".MuiPaper-root");
    expect(paper).toBeInTheDocument();
  },
};

export const WithActionButtons: StoryObj<typeof CardMenu> = {
  args: {
    children: (
      <div style={{ display: "flex", gap: 8 }}>
        <button>Bold</button>
        <button>Italic</button>
      </div>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Bold")).toBeInTheDocument();
    await expect(canvas.getByText("Italic")).toBeInTheDocument();
  },
};
