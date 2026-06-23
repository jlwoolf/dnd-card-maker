/** Construct a scaled card image URL with an auth token query param.

  Because ``<img>`` tags cannot send ``Authorization`` headers, the token is
  passed as a ``?token=`` query parameter and validated by the backend.
*/
export function getCardImageUrl(cardId: string, scale: number = 0.25): string {
  const token = localStorage.getItem("access_token");
  const params = new URLSearchParams({ scale: String(scale) });
  if (token) params.set("token", token);
  return `${import.meta.env.BASE_URL}api/images/${cardId}?${params.toString()}`;
}

/** Return the best available preview image URL for a card.

  Prefers local images (thumbnail, then full imgUrl) for instant display.
  Falls back to the backend image endpoint for cloud-synced cards that
  don't have a cached local image (e.g. after copy-to-local or edit).
*/
export function getCardPreviewSrc(card: {
  thumbnailUrl?: string;
  imgUrl: string;
  cloudCardId?: string;
}): string {
  if (card.thumbnailUrl) return card.thumbnailUrl;
  if (card.imgUrl) return card.imgUrl;
  if (card.cloudCardId) return getCardImageUrl(card.cloudCardId, 0.35);
  return "";
}
