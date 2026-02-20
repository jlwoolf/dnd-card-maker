import { motion } from "framer-motion";
import React from "react";
import Tooltip from "../Tooltip";

const ActionButton = ({
  icon,
  color,
  onClick,
  disabled,
  tooltip,
}: {
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
}) => (
  <Tooltip title={tooltip}>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent card clicks
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
