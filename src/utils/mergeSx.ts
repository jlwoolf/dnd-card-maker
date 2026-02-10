import { type SxProps, type Theme } from "@mui/material";

/**
 * Merges a base SxProps object with an override that can be an object or a function.
 */
export function mergeSx(
  baseSx: SxProps<Theme>,
  overrideSx?: SxProps<Theme>,
): SxProps<Theme> {
  if (!overrideSx) {
    return baseSx;
  }

  return (theme: Theme) => {
    const base = typeof baseSx === "function" ? baseSx(theme) : baseSx;
    const override =
      typeof overrideSx === "function" ? overrideSx(theme) : overrideSx;
    return { ...base, ...override };
  };
}
