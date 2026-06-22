import { Box } from "@mui/material";
import { DESIGN_TOKENS } from "@src/theme/constants";
import type { ReactNode } from "react";

interface AuthPageLayoutProps {
  /** Optional title displayed above the content area. */
  title?: string;
  /** The form or status content to render inside the card. */
  children: ReactNode;
  /** Optional form submission handler (passes to the inner Box as `component="form"`). */
  onSubmit?: (e: React.FormEvent) => void;
  /** Optional data-testid for the inner card. */
  dataTestId?: string;
}

/** Centered page layout for auth-related pages (login, register, etc.).

  All five auth pages previously duplicated an identical outer ``<Box>``
  wrapper that centred a 360px-wide card inside ``calc(100vh - 48px)``.
  This component DRYs that up so only the content changes per page.
*/
export default function AuthPageLayout({
  title,
  children,
  onSubmit,
  dataTestId,
}: AuthPageLayoutProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={DESIGN_TOKENS.contentMinHeight}
    >
      <Box
        component={onSubmit ? "form" : "div"}
        onSubmit={onSubmit}
        sx={{ width: DESIGN_TOKENS.authCardWidth, p: 3 }}
        data-testid={dataTestId}
      >
        {children}
      </Box>
    </Box>
  );
}
