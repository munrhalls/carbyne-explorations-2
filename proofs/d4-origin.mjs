// Proof D4: the admin refuses requests with a foreign Origin or Host, accepts its own.
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { makeSandbox, startAdmin, api, removeSandbox } from "./harness.mjs";

const BODY = { label: "T", title: "T", body: "x", accent: "", position: 11 };

const dir = makeSandbox();
const admin = await startAdmin(dir);
const count = () => {
  const db = new DatabaseSync(path.join(dir, "content/blog.db"), { readOnly: true });
  const n = db.prepare("SELECT COUNT(*) n FROM pages").get().n;
  const music = db.prepare("SELECT 1 FROM pages WHERE slug = 'music'").get();
  db.close();
  return { n, music: !!music };
};
const before = count().n;

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
const put = (headers) => api(admin, "PUT", "/api/pages/probe", { body: BODY, headers });

await step("foreign origin", async () => {
  is((await put({ Origin: "https://evil.example" })).status === 403, "not 403");
});
await step("no origin", async () => {
  is((await put({ Origin: null })).status === 403, "not 403");
});
await step("foreign host on write", async () => {
  is((await put({ Host: "evil.example" })).status === 403, "not 403");
});
await step("foreign host on read", async () => {
  is((await api(admin, "GET", "/api/pages", { headers: { Host: "evil.example" } })).status === 403, "not 403");
});
await step("foreign origin delete", async () => {
  is((await api(admin, "DELETE", "/api/pages/music", { headers: { Origin: "https://evil.example" } })).status === 403, "not 403");
});
await step("nothing changed", async () => {
  const c = count();
  is(c.n === before, `rows ${c.n} != ${before}`);
  is(c.music, "music row gone");
});
await step("own origin works", async () => {
  is((await put({})).status === 200, "not 200");
  is(count().n === before + 1, "row not added");
});

admin.stop();
removeSandbox(dir);
if (failed) {
  console.log(`D4: no - ${failed} checks failed`);
  process.exit(1);
}
console.log("D4: yes");
