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

/** Standard card aspect ratio (5:7), used across card rendering and grid layouts. */
export const CARD_ASPECT_RATIO = "5 / 7";

/** Placeholder image URL for elements with no source set. */
export const PLACEHOLDER_IMAGE = "https://placehold.co/600x400";

/** Number of cards uploaded per batch when saving large decks. */
export const DECK_SAVE_BATCH_SIZE = 10;

/** Number of rows per page in admin table views. */
export const ADMIN_PAGE_SIZE = 100;

/** Progressive blur amount for low-quality image placeholders. */
export const PROGRESSIVE_BLUR = "blur(10px)";
