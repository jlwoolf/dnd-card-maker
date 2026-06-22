import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import React from "react";
import PreviewImage from "./Image";

const meta = { component: PreviewImage } satisfies Meta<typeof PreviewImage>;
export default meta;

export const Default: StoryObj<typeof PreviewImage> = {
  args: { children: <img src="https://placehold.co/100x100" alt="test image" /> },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText("test image")).toBeInTheDocument();
  },
};

export const Rounded: StoryObj<typeof PreviewImage> = {
  args: {
    radius: 8,
    children: <img src="https://placehold.co/100x100" alt="rounded image" />,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText("rounded image")).toBeInTheDocument();
  },
};

export const Narrow: StoryObj<typeof PreviewImage> = {
  args: {
    width: 75,
    children: <img src="https://placehold.co/100x100" alt="narrow image" />,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText("narrow image")).toBeInTheDocument();
  },
};
