/**
 * Turn an API error into something a person can read. customFetch errors carry
 * the server's JSON body in `data` (usually `{ error: "..." }`); their
 * `message` is prefixed with "HTTP 400 Bad Request: …", which we don't show.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { data?: unknown } | null)?.data;
  if (data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  return fallback;
}
