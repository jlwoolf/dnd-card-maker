import type { Meta, StoryObj } from "@storybook/react-vite";
import ColorSettingsModal from "./ColorSettingsModal";
import { useActiveCardStore } from "../../stores/useActiveCardStore";

const meta = {
  component: ColorSettingsModal,
  args: { anchorEl: null as HTMLElement | null },
  beforeEach: () => {
    useActiveCardStore.setState({
      theme: {
        fill: "#111111",
        bannerFill: "#222222",
        boxFill: "#333333",
        stroke: "#444444",
        bannerText: "#555555",
        boxText: "#666666",
      },
    });
  },
} satisfies Meta<typeof ColorSettingsModal>;

export default meta;

export const Closed: StoryObj<typeof ColorSettingsModal> = {
  args: { open: false, onClose: () => {} },
};

export const Open: StoryObj<typeof ColorSettingsModal> = {
  args: { open: true, onClose: () => {} },
};
