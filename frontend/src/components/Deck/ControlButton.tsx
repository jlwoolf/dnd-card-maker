import React, { forwardRef } from "react";
import { type HTMLMotionProps, motion } from "framer-motion";

interface ControlButtonProps extends HTMLMotionProps<"button"> {
  /** Callback triggered when the button is clicked */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Accessibility label for screen readers */
  label?: string;
  /** Icon component or SVG node to display */
  icon: React.ReactNode;
  /** Whether the button is currently interactive */
  disabled?: boolean;
}

/**
 * ControlButton is a circular, stylized action button designed for the deck toolbar.
 * It uses Framer Motion for interactive animations and is wrapped in `forwardRef` 
 * to ensure compatibility with Tooltips and other anchor-based components.
 */
const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(
  ({ onClick, icon, label, disabled, style, ...rest }, ref) => (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      {...rest}
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
        ...style,
      }}
      aria-label={label}
    >
      {icon}
    </motion.button>
  ),
);

ControlButton.displayName = "ControlButton";

export default ControlButton;
