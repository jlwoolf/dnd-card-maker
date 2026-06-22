import type { Meta, StoryObj } from "@storybook/react-vite";
import SettingsTooltip from "./SettingsTooltip";

const meta = { component: SettingsTooltip } satisfies Meta<typeof SettingsTooltip>;
export default meta;

export const Open: StoryObj<typeof SettingsTooltip> = {
  args: {
    open: true,
    title: "Image Source",
    onClose: () => {},
    children: <span>🖼️</span>,
  },
};

export const Closed: StoryObj<typeof SettingsTooltip> = {
  args: {
    open: false,
    title: "Settings",
    onClose: () => {},
    children: <span>⚙️</span>,
  },
};
