/** Barrel file — re-exports split API modules to preserve existing imports. */

import api from "./api/client";
export default api;
export { api };  // also as named export for compatibility
export type {
  SnakeTheme,
  CloudCardSummary,
  CloudCard,
  SharedCard,
  DeckSummary,
  DeckCardEntry,
  SharedDeckCardEntry,
  SharedDeckData,
  DeckResponse,
  MailSummary,
  MailFull,
  AdminTableRows,
} from "./api/types";
export { cardApi } from "./api/cards";
export { deckApi, sharedDeckApi } from "./api/decks";
export { sharedApi } from "./api/shared";
export { devMailApi, userApi, adminApi } from "./api/admin";
