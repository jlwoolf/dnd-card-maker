import type { Meta, StoryObj } from "@storybook/react-vite";
import NumericToolbarInput from "./NumericToolbarInput";

const meta = { component: NumericToolbarInput } satisfies Meta<typeof NumericToolbarInput>;
export default meta;

export const Default: StoryObj<typeof NumericToolbarInput> = {
  args: { value: 50, onUpdate: () => {} },
};

export const WithMinMax: StoryObj<typeof NumericToolbarInput> = {
  args: { value: 10, min: 5, max: 20, onUpdate: () => {} },
};

export const WithSuffix: StoryObj<typeof NumericToolbarInput> = {
  args: { value: 24, suffix: "px", onUpdate: () => {} },
};
