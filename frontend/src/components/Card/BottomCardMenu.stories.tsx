import type { Meta, StoryObj } from "@storybook/react-vite";
import BottomCardMenu from "./BottomCardMenu";

/** BottomCardMenu renders a toolbar with insert/color/reset/clear actions. */
const meta = {
  component: BottomCardMenu,
  args: { anchorEl: null },
} satisfies Meta<typeof BottomCardMenu>;

export default meta;

export const Default: StoryObj<typeof BottomCardMenu> = {};
