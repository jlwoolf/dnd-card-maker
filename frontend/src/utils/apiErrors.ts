/** Utility for extracting human-readable error messages from API errors.

  The pattern ``catch (err: unknown) { ... extract ... setError(detail) }``
  was copy-pasted verbatim in 4 auth pages. This single function centralises
  the extraction logic.
*/

/**
 * Extract a user-facing error message from a caught API error.
 *
 * @param err  The caught error (typed as ``unknown`` since catch clauses are not typed).
 * @param fallback  Fallback message when no detail string can be extracted.
 * @returns A string suitable for display in an error alert.
 */
export function extractApiError(err: unknown, fallback: string): string {
  const detail =
    (err as { response?: { data?: { detail?: string } } })?.response?.data
      ?.detail;
  return typeof detail === "string" ? detail : fallback;
}
