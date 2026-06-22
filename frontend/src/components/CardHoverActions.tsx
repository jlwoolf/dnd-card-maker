import type { ReactNode } from "react";
import { Box } from "@mui/material";
import ActionButton from "./Deck/ActionButton";

export interface CardHoverActionSlots {
  save?: { tooltip: string; icon: ReactNode; color: string; onClick: () => void; testId?: string };
  addToDeck?: { tooltip: string; icon: ReactNode; color: string; onClick: () => void; testId?: string };
  edit?: { tooltip: string; icon: ReactNode; color: string; onClick: () => void; testId?: string };
  copy?: { tooltip: string; icon: ReactNode; color: string; onClick: () => void; testId?: string };
  share?: { tooltip: string; icon: ReactNode; color: string; onClick: () => void; testId?: string };
  delete_?: { tooltip: string; icon: ReactNode; color: string; onClick: () => void; testId?: string };
}

interface CardHoverActionsProps {
  slots: CardHoverActionSlots;
}

const SLOT_ORDER: (keyof CardHoverActionSlots)[] = [
  "save", "addToDeck", "edit", "copy", "share", "delete_",
];

export default function CardHoverActions({ slots }: CardHoverActionsProps) {
  const buttons = SLOT_ORDER.filter((key) => slots[key]).map((key) => {
    const s = slots[key]!;
    return (
      <ActionButton
        key={key}
        tooltip={s.tooltip}
        icon={s.icon}
        color={s.color}
        onClick={s.onClick}
        data-testid={s.testId}
      />
    );
  });

  if (buttons.length === 0) return null;

  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(3, 1fr)"
      gap={1}
      p={1}
      borderRadius={1}
      bgcolor="background.paper"
      boxShadow={2}
    >
      {buttons}
    </Box>
  );
}
