import React from "react";
import { motion } from "framer-motion";

interface ControlButtonProps {
  /** Callback when the button is clicked */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Accessibility label */
  label?: string;
  /** Icon to display inside the button */
  icon: React.ReactNode;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * ControlButton is a circular, dark-themed button used for deck navigation and global actions.
 */
const ControlButton = ({
  onClick,
  icon,
  label,
  disabled,
}: ControlButtonProps) => (
  <motion.button
    disabled={disabled}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    style={{
      background: "#222",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      pointerEvents: "auto",
    }}
    aria-label={label}
  >
    {icon}
  </motion.button>
);

export default ControlButton;
