import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

// 1. Extend HTMLMotionProps so TypeScript knows it can accept onMouseEnter, etc.
interface ControlButtonProps extends HTMLMotionProps<"button"> {
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
// 2. Wrap the component in forwardRef
const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(
  ({ onClick, icon, label, disabled, style, ...rest }, ref) => (
    <motion.button
      // 3. Attach the ref so the Tooltip can calculate coordinates
      ref={ref}
      disabled={disabled}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      // 4. Spread the rest of the props to catch Tooltip's hover events
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
        ...style, // allow style overrides if necessary
      }}
      aria-label={label}
    >
      {icon}
    </motion.button>
  ),
);

// Helpful for React DevTools when using forwardRef
ControlButton.displayName = "ControlButton";

export default ControlButton;
