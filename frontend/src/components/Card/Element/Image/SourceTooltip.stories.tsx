import type { Meta, StoryObj } from "@storybook/react-vite";
import SourceTooltip from "./SourceTooltip";

const meta = { component: SourceTooltip } satisfies Meta<typeof SourceTooltip>;
export default meta;

export const OpenWithUrl: StoryObj<typeof SourceTooltip> = {
  args: {
    src: "https://example.com/img.jpg",
    isOpen: true,
    onClose: () => {},
    onUpdate: () => {},
  },
};

export const Closed: StoryObj<typeof SourceTooltip> = {
  args: {
    src: "",
    isOpen: false,
    onClose: () => {},
    onUpdate: () => {},
  },
};
