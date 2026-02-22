import { type SxProps, type Theme } from "@mui/material";

/**
 * Type guard to check if a value is a readonly array.
 */
const isReadonlyArray = (value: unknown): value is readonly unknown[] => {
  return Array.isArray(value);
};

type SxObject = Exclude<
  SxProps<Theme>,
  readonly unknown[] | ((theme: Theme) => unknown)
>;

/**
 * Recursively resolves SxProps into a single flat object.
 * 
 * @param sx - The style properties to resolve.
 * @param theme - The MUI theme object.
 * @returns A flattened style object.
 */
function resolveSx(sx: SxProps<Theme> | boolean, theme: Theme): SxObject {
  if (typeof sx === "function") {
    return sx(theme);
  }

  if (typeof sx === "boolean") {
    return {};
  }

  if (isReadonlyArray(sx)) {
    return sx.reduce((acc: SxObject, curr) => {
      return { ...acc, ...resolveSx(curr, theme) };
    }, {});
  }

  return sx || {};
}

/**
 * Merges multiple SxProps into a single SxProps function.
 * Higher-indexed styles take precedence over lower-indexed ones.
 * 
 * @param styles - A list of style objects, functions, or arrays to merge.
 * @returns A function that resolves the merged styles against a theme.
 */
export function mergeSx(
  ...styles: (SxProps<Theme> | undefined | null | boolean)[]
): SxProps<Theme> {
  return (theme: Theme) => {
    return styles.reduce((acc: SxObject, curr) => {
      if (!curr || curr === true) return acc;

      return {
        ...acc,
        ...resolveSx(curr, theme),
      };
    }, {});
  };
}
