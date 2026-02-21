import { motion } from "framer-motion";
import React from "react";

interface ControlButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  label?: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

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
