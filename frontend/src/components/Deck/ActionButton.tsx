import React from "react";
import { motion } from "framer-motion";
import Tooltip from "../Tooltip";

interface ActionButtonProps {
  /** Icon to display inside the button */
  icon: React.ReactNode;
  /** Background color of the button */
  color: string;
  /** Callback when the button is clicked */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Tooltip text to display on hover */
  tooltip: string;
}

/**
 * ActionButton is a small, animated button used for quick actions on deck cards (Edit, Delete, Download).
 */
const ActionButton = ({
  icon,
  color,
  onClick,
  disabled,
  tooltip,
}: ActionButtonProps) => (
  <Tooltip title={tooltip}>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      style={{
        background: color,
        color: "white",
        border: "none",
        borderRadius: "4px",
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      {icon}
    </motion.button>
  </Tooltip>
);

export default ActionButton;
