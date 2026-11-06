import { DatabaseSync } from "node:sqlite";

/** An admin request failure with an HTTP status. */
export class AdminError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Open the content database for reading and writing.
 * @param {string} file path to the SQLite file
 * @returns {DatabaseSync}
 */
export function openDb(file) {
  return new DatabaseSync(file);
}

/**
 * List all pages, Welcome first, then river pages by position.
 * @param {DatabaseSync} db
 * @returns {{slug: string, label: string, title: string, body: string, accent: string, position: number | null}[]}
 */
export function listPages(db) {
  return db
    .prepare(
      "SELECT slug, label, title, body, accent, position FROM pages " +
        "ORDER BY (slug <> 'welcome'), (position IS NULL), position, slug",
    )
    .all();
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ACCENT_RE = /^[#a-zA-Z0-9(),.%\s-]*$/;

/**
 * Create or update the page `slug`.
 * @param {DatabaseSync} db
 * @param {string} slug
 * @param {{label: unknown, title: unknown, body: unknown, accent: unknown, position: unknown}} input
 * @returns {{slug: string, label: string, title: string, body: string, accent: string, position: number | null}}
 */
export function savePage(db, slug, input) {
  const { label, title, body, accent, position } = input ?? {};
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) throw new AdminError(400, "bad slug");
  if (typeof label !== "string" || label.length === 0 || label.length > 200)
    throw new AdminError(400, "bad label");
  if (typeof title !== "string" || title.length === 0 || title.length > 200)
    throw new AdminError(400, "bad title");
  if (typeof body !== "string" || body.length > 200000) throw new AdminError(400, "bad body");
  if (typeof accent !== "string" || accent.length > 50 || !ACCENT_RE.test(accent))
    throw new AdminError(400, "bad accent");
  if (position !== null && !(Number.isInteger(position) && position >= 1))
    throw new AdminError(400, "bad position");
  if (slug === "welcome" && position !== null)
    throw new AdminError(400, "the Welcome page has no position");
  try {
    db.prepare(
      "INSERT INTO pages (slug, label, title, body, accent, position) VALUES (?, ?, ?, ?, ?, ?) " +
        "ON CONFLICT(slug) DO UPDATE SET label = excluded.label, title = excluded.title, " +
        "body = excluded.body, accent = excluded.accent, position = excluded.position",
    ).run(slug, label, title, body, accent, position);
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE constraint failed: pages.position"))
      throw new AdminError(409, "position is already used");
    throw e;
  }
  return db
    .prepare("SELECT slug, label, title, body, accent, position FROM pages WHERE slug = ?")
    .get(slug);
}

/**
 * Delete a page by slug.
 * @param {DatabaseSync} db
 * @param {string} slug
 */
export function deletePage(db, slug) {
  if (slug === "welcome") throw new AdminError(400, "the Welcome page cannot be deleted");
  const { changes } = db.prepare("DELETE FROM pages WHERE slug = ?").run(slug);
  if (changes === 0) throw new AdminError(404, "no such page");
}
