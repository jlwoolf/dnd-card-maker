/** Design tokens shared across the frontend.

  Replaces hardcoded values that were duplicated 16+ times across the
  application (e.g. ``calc(100vh - 48px)``, ``width: 360``).

  Import from ``@src/theme/constants`` instead of hardcoding these values.
*/

/** Height of the top navigation toolbar in pixels. */
export const TOOLBAR_HEIGHT = 48;

/** Minimum height for page content below the toolbar. */
export const CONTENT_MIN_HEIGHT = `calc(100vh - ${TOOLBAR_HEIGHT}px)`;

/** Width of the card used on auth pages. */
export const AUTH_CARD_WIDTH = 360;

/** Standardised z-index layers to prevent arbitrary values. */
export const Z_INDEX = {
  page: 0,
  cardOverlay: 500,
  toolbar: 1100,
  overlay: 1200,
  modal: 1300,
  exportOverlay: 1400,
  tooltip: 9999,
  snackbar: 1400,
} as const;

/** Design token bundle used by shared components like AuthPageLayout. */
export const DESIGN_TOKENS = {
  toolbarHeight: TOOLBAR_HEIGHT,
  contentMinHeight: CONTENT_MIN_HEIGHT,
  authCardWidth: AUTH_CARD_WIDTH,
  zIndex: Z_INDEX,
} as const;
