import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AdminError, openDb, listPages, savePage, deletePage } from "./pages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const db = openDb(join(root, "content", "blog.db"));
const imgDir = join(root, "public", "img");
const ui = readFileSync(join(root, "src", "admin", "ui.html"), "utf8");

const port = Number(process.env.PORT ?? 4321);
const IMG_RE = /^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|gif|webp|avif|svg)$/i;

/**
 * Send a JSON response.
 * @param {import("node:http").ServerResponse} res
 * @param {number} status
 * @param {unknown} data
 */
function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

/**
 * Read the request body, throwing 413 over `max` bytes.
 * @param {import("node:http").IncomingMessage} req
 * @param {number} max
 * @returns {Promise<Buffer>}
 */
async function body(req, max) {
  const parts = [];
  let n = 0;
  for await (const part of req) {
    n += part.length;
    if (n > max) throw new AdminError(413, "body too large");
    parts.push(part);
  }
  return Buffer.concat(parts);
}

/**
 * Decode a slug from a path; a bad escape is a 400.
 * @param {string} raw
 * @returns {string}
 */
function slug(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    throw new AdminError(400, "bad slug encoding");
  }
}

/**
 * Handle one request; gate first, then route.
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 */
async function route(req, res) {
  const p = server.address().port;
  const own = ["127.0.0.1:" + p, "localhost:" + p];
  if (!own.includes(req.headers.host ?? "")) return json(res, 403, { error: "bad host" });
  if (req.method !== "GET" && req.method !== "HEAD") {
    const ok = own.includes((req.headers.origin ?? "").replace(/^http:\/\//, ""));
    if (!ok) return json(res, 403, { error: "bad origin" });
  }
  const url = new URL(req.url ?? "/", "http://x");
  const path = url.pathname;
  const fail = (s, m) => json(res, s, { error: m });

  if (path === "/") {
    if (req.method !== "GET" && req.method !== "HEAD") return fail(405, "method not allowed");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(ui);
  }
  if (path === "/api/pages") {
    if (req.method !== "GET") return fail(405, "method not allowed");
    return json(res, 200, listPages(db));
  }
  const pageMatch = path.match(/^\/api\/pages\/(.+)$/);
  if (pageMatch) {
    const s = slug(pageMatch[1]);
    if (req.method === "PUT") {
      let input;
      try {
        input = JSON.parse((await body(req, 1 << 20)).toString("utf8"));
      } catch (e) {
        if (e instanceof AdminError) throw e;
        return fail(400, "invalid JSON");
      }
      return json(res, 200, savePage(db, s, input));
    }
    if (req.method === "DELETE") {
      deletePage(db, s);
      return json(res, 200, { ok: true });
    }
    return fail(405, "method not allowed");
  }
  if (path === "/api/images") {
    if (req.method !== "POST") return fail(405, "method not allowed");
    const name = url.searchParams.get("name") ?? "";
    if (!IMG_RE.test(name)) return fail(400, "bad image name");
    if (existsSync(join(imgDir, name)))
      return json(res, 409, { error: "an image with this name exists" });
    const data = await body(req, 20 << 20);
    mkdirSync(imgDir, { recursive: true });
    writeFileSync(join(imgDir, name), data);
    return json(res, 200, { path: "/img/" + name });
  }
  return fail(404, "not found");
}

const server = createServer((req, res) => {
  route(req, res).catch((e) => {
    if (e instanceof AdminError) return json(res, e.status, { error: e.message });
    console.error(e);
    json(res, 500, { error: "server error" });
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Admin: http://127.0.0.1:${server.address().port}/`);
});
