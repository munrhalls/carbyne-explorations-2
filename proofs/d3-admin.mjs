// Proof D3: admin create/upload/update/delete all land in the built site (sandbox copy).
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { makeSandbox, startAdmin, api, buildSite, removeSandbox } from "./harness.mjs";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==",
  "base64",
);
const PAGE = { label: "Test", title: "Test <page>", body: "Hello\n\n![t](/img/t.png)", accent: "tomato" };

const dir = makeSandbox();
const admin = await startAdmin(dir);
const dist = path.join(dir, "dist");
const select = (sql, ...args) => {
  const db = new DatabaseSync(path.join(dir, "content/blog.db"), { readOnly: true });
  const rows = db.prepare(sql).all(...args);
  db.close();
  return rows;
};
const navLinks = () => {
  const nav = fs.readFileSync(path.join(dist, "index.html"), "utf8").match(/<nav class="river"[\s\S]*?<\/nav>/);
  return nav ? [...nav[0].matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]) : [];
};

let failed = 0;
const step = async (name, fn) => {
  try {
    await fn();
    console.log("ok  " + name);
  } catch (e) {
    failed++;
    console.log(`NO  ${name}: ${e.message}`);
  }
};
const is = (cond, msg) => { if (!cond) throw new Error(msg); };

await step("list", async () => {
  const r = await api(admin, "GET", "/api/pages");
  is(r.status === 200 && r.json.length === 11 && r.json[0].slug === "welcome", "bad list: " + r.status);
});
await step("create", async () => {
  const r = await api(admin, "PUT", "/api/pages/test-page", { body: { ...PAGE, position: 11 } });
  is(r.status === 200, "status " + r.status);
  is(select("SELECT slug FROM pages WHERE slug = 'test-page'").length === 1, "row missing");
});
await step("upload", async () => {
  const r = await api(admin, "POST", "/api/images?name=t.png", { body: PNG });
  is(r.status === 200 && r.json.path === "/img/t.png", "status " + r.status);
  is(fs.existsSync(path.join(dir, "public/img/t.png")), "file missing");
  is((await api(admin, "POST", "/api/images?name=t.png", { body: PNG })).status === 409, "no 409");
  is((await api(admin, "POST", "/api/images?name=..%2Fx.png", { body: PNG })).status === 400, "no 400 for ..");
  is((await api(admin, "POST", "/api/images?name=x.exe", { body: PNG })).status === 400, "no 400 for .exe");
});
await step("build after create", async () => {
  buildSite(dir);
  const html = fs.readFileSync(path.join(dist, "test-page/index.html"), "utf8");
  is(html.includes("<h1>Test &lt;page&gt;</h1>"), "h1 missing");
  is(html.includes('src="/x/img/t.png"'), "img src missing");
  is(fs.existsSync(path.join(dist, "img/t.png")), "dist image missing");
  const links = navLinks();
  is(links.length === 11 && links[10] === "/x/test-page/", "river wrong: " + links.length);
});
await step("conflict", async () => {
  const r = await api(admin, "PUT", "/api/pages/test-page", { body: { ...PAGE, position: 3 } });
  is(r.status === 409, "status " + r.status);
});
await step("update", async () => {
  const r = await api(admin, "PUT", "/api/pages/test-page", { body: { ...PAGE, title: "Renamed", position: 12 } });
  is(r.status === 200, "status " + r.status);
  buildSite(dir);
  is(fs.readFileSync(path.join(dist, "test-page/index.html"), "utf8").includes("<h1>Renamed</h1>"), "h1 not renamed");
  is(select("SELECT title FROM pages WHERE slug = 'test-page'")[0]?.title === "Renamed", "db title wrong");
});
await step("validation", async () => {
  is((await api(admin, "PUT", "/api/pages/Bad%20Slug", { body: { ...PAGE, position: 20 } })).status === 400, "bad slug not 400");
  is((await api(admin, "DELETE", "/api/pages/welcome")).status === 400, "welcome delete not 400");
  is((await api(admin, "DELETE", "/api/pages/nope")).status === 404, "missing page not 404");
});
await step("delete", async () => {
  is((await api(admin, "DELETE", "/api/pages/test-page")).status === 200, "delete failed");
  buildSite(dir);
  is(!fs.existsSync(path.join(dist, "test-page")), "dist dir remains");
  is(navLinks().length === 10, "river wrong after delete");
  is(select("SELECT slug FROM pages WHERE slug = 'test-page'").length === 0, "row remains");
});

admin.stop();
removeSandbox(dir);
if (failed === 0) {
  console.log("D3: yes");
} else {
  console.log(`D3: no - ${failed} steps failed`);
  process.exit(1);
}
