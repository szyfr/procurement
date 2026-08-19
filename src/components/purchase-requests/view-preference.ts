export type ListView = "cards" | "table";

/**
 * Remembers the purchase request list's cards/table choice across visits.
 *
 * A cookie rather than localStorage so the *server* can read it: the page is
 * a server shell that picks the view before rendering, so a remembered table
 * view arrives as a table instead of flashing cards for a frame while a
 * client effect corrects it.
 *
 * Deliberately unlike the auth cookies next door. This one is written by the
 * browser and readable from JavaScript, because it carries a display
 * preference and nothing else — no session, no identity, nothing a forged
 * value could escalate. The worst a tampered cookie can do is open the wrong
 * view, and `parseListView` rejects anything that isn't one of the two.
 */
export const LIST_VIEW_COOKIE = "pr_list_view";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Narrows an untrusted value — URL param or cookie — to a view, or nothing. */
export function parseListView(
  value: string | undefined | null,
): ListView | null {
  return value === "cards" || value === "table" ? value : null;
}

/**
 * Client-side only; the server never writes this cookie.
 *
 * `secure` is derived from the current protocol rather than an env var,
 * because the flag has to be decided in the browser and `APP_ENV` is
 * server-only — setting it unconditionally would silently drop the cookie on
 * a plain-http dev server.
 */
export function rememberListView(view: ListView) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";

  // biome-ignore lint/suspicious/noDocumentCookie: the suggested Cookie Store API is unimplemented in Safari, and this write has no read-modify-write to race.
  document.cookie = `${LIST_VIEW_COOKIE}=${view}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax${secure}`;
}
