/** Construct a scaled card image URL with an auth token query param.

  Because ``<img>`` tags cannot send ``Authorization`` headers, the token is
  passed as a ``?token=`` query parameter and validated by the backend.
*/
export function getCardImageUrl(cardId: string, scale: number = 0.25): string {
  const token = localStorage.getItem("access_token");
  if (!token) return "";
  return `/api/images/${cardId}?scale=${scale}&token=${token}`;
}
