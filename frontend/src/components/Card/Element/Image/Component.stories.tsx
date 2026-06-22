import type { Meta, StoryObj } from "@storybook/react-vite";
import ImageElement from "./Component";

const meta = {
  component: ImageElement,
  args: { id: "test-img-1" },
} satisfies Meta<typeof ImageElement>;

export default meta;

export const Default: StoryObj<typeof ImageElement> = {};
