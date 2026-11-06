/** Escape `&`, `<`, `>` and `"` in a string for safe use in markup text and attributes. */
export function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
