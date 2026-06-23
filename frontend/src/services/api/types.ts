/** Shared API response types used across domain modules. */

import type { Element } from "@src/schemas";

/** Theme colours as received from the API (snake_case keys). */
export interface SnakeTheme {
  fill: string;
  banner_fill: string;
  box_fill: string;
  stroke: string;
  banner_text: string;
  box_text: string;
}

export interface CloudCardSummary {
  id: string;
  title: string | null;
  img_url: string;
  saved: boolean;
  created_at: string;
  updated_at: string;
  share_slug: string | null;
  share_mode: string | null;
}

export interface CloudCard {
  id: string;
  user_id: string;
  title: string | null;
  elements: Element[];
  img_url: string;
  theme: SnakeTheme;
  share_slug: string | null;
  share_mode: string | null;
  share_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedCard {
  id: string;
  title: string | null;
  elements: Element[];
  img_url: string;
  theme: SnakeTheme;
  mode: string | null;
  can_copy: boolean;
}

export interface DeckSummary {
  id: string;
  title: string;
  is_default: boolean;
  card_count: number;
  first_card_id: string | null;
  share_slug: string | null;
  share_mode: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeckCardEntry {
  id: string;
  title: string | null;
  saved: boolean;
  elements: Element[];
  theme: SnakeTheme;
  img_url?: string;
  share_slug: string | null;
  share_mode: string | null;
}

export interface SharedDeckCardEntry {
  id: string;
  title: string | null;
  elements: Element[];
  theme: SnakeTheme;
  img_url?: string;
  share_slug: string | null;
  share_mode: string | null;
}

export interface SharedDeckData {
  id: string;
  title: string;
  cards: SharedDeckCardEntry[];
  mode: string | null;
  can_copy: boolean;
}

export interface DeckResponse {
  id: string;
  title: string;
  is_default: boolean;
  cards: DeckCardEntry[];
  share_slug: string | null;
  share_mode: string | null;
}

export interface MailSummary {
  id: string;
  to_email: string;
  subject: string;
  sent_at: string;
}

export interface MailFull extends MailSummary {
  html_body: string;
}

export interface AdminTableRows {
  rows: Record<string, unknown>[];
  total: number;
  offset: number;
  limit: number;
}

/** Response from GET /api/decks/local/{id} */
export interface LocalDeckResponse {
  id: string;
  cards: Array<{
    elements: Element[];
    img_url: string;
    theme: SnakeTheme;
  }>;
  editing_cloud_deck_id: string | null;
  editing_cloud_deck_title: string | null;
}
