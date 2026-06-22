import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import BaseCard from "./BaseCard";

const meta = { component: BaseCard } satisfies Meta<typeof BaseCard>;
export default meta;

export const Default: StoryObj<typeof BaseCard> = {
  args: { children: "Card Content" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Card Content")).toBeInTheDocument();
    const paper = canvas.getByText("Card Content").closest(".MuiPaper-root");
    expect(paper).toBeInTheDocument();
  },
};

export const WithMultipleChildren: StoryObj<typeof BaseCard> = {
  args: {
    children: (
      <>
        <div>First Child</div>
        <div>Second Child</div>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("First Child")).toBeInTheDocument();
    await expect(canvas.getByText("Second Child")).toBeInTheDocument();
  },
};

export const WithCustomClassName: StoryObj<typeof BaseCard> = {
  args: { className: "custom-card", children: "Styled card" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Styled card")).toBeInTheDocument();
  },
};
