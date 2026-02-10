import { type SxProps, type Theme } from "@mui/material";
const isReadonlyArray = (value: unknown): value is readonly unknown[] => {
  return Array.isArray(value);
};

type SxObject = Exclude<
  SxProps<Theme>,
  readonly unknown[] | ((theme: Theme) => unknown)
>;

/**
 * Recursively resolves SxProps into a single flat object.
 */
function resolveSx(sx: SxProps<Theme> | boolean, theme: Theme): SxObject {
  if (typeof sx === "function") {
    return sx(theme);
  }

  if (typeof sx === "boolean") {
    return {};
  }

  if (isReadonlyArray(sx)) {
    // Handle ReadonlyArray by reducing its elements recursively
    return sx.reduce((acc: SxObject, curr) => {
      return { ...acc, ...resolveSx(curr, theme) };
    }, {});
  }
  // At this point, it's a standard SxObject
  return sx || {};
}

/**
 * Merges multiple SxProps. First argument is lowest priority.
 */
export function mergeSx(
  ...styles: (SxProps<Theme> | undefined | null | boolean)[]
): SxProps<Theme> {
  return (theme: Theme) => {
    return styles.reduce((acc: SxObject, curr) => {
      // Filter out falsy values (null, undefined, false)
      if (!curr || curr === true) return acc;

      return {
        ...acc,
        ...resolveSx(curr, theme),
      };
    }, {});
  };
}
