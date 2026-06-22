import type { Meta, StoryObj } from "@storybook/react-vite";
import SliderToolbarInput from "./SliderToolbarInput";

const meta = { component: SliderToolbarInput } satisfies Meta<typeof SliderToolbarInput>;
export default meta;

export const Default: StoryObj<typeof SliderToolbarInput> = {
  args: { value: 50, onUpdate: () => {} },
};

export const WithLabel: StoryObj<typeof SliderToolbarInput> = {
  args: { value: 75, label: "Width", onUpdate: () => {} },
};

export const WithSuffix: StoryObj<typeof SliderToolbarInput> = {
  args: { value: 30, label: "Radius", suffix: "px", min: 0, max: 10, onUpdate: () => {} },
};
