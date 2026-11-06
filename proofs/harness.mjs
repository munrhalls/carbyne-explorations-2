/** Shared helpers for the proofs: a throw-away copy of the repo plus an admin client. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Copy `src/`, `public/` and `content/` of the repo into a fresh temp dir.
 * @returns {string} the sandbox path
 */
export function makeSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "carbyne-proof-"));
  for (const name of ["src", "public", "content"])
    fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
  return dir;
}

/**
 * Start the admin inside `dir` on a random port; resolves once it prints its URL.
 * @param {string} dir
 * @returns {Promise<{port: number, origin: string, stop: () => void}>}
 */
export async function startAdmin(dir) {
  const child = spawn(process.execPath, [path.join(dir, "src/admin/server.mjs")], {
    cwd: dir,
    env: { ...process.env, PORT: "0" },
  });
  const port = await new Promise((resolve, reject) => {
    let buf = "";
    const timer = setTimeout(() => reject(new Error("admin did not start in 5s")), 5000);
    child.stdout.on("data", (chunk) => {
      buf += chunk;
      const m = buf.match(/Admin: http:\/\/127\.0\.0\.1:(\d+)\//);
      if (m) {
        clearTimeout(timer);
        resolve(Number(m[1]));
      }
    });
    child.on("exit", () => {
      clearTimeout(timer);
      reject(new Error("admin exited before printing its URL"));
    });
  });
  return { port, origin: "http://127.0.0.1:" + port, stop: () => child.kill() };
}

/**
 * Send one HTTP request to the sandbox admin. Default headers pass the Host/Origin
 * gate; a `headers` key overrides a default, `null` removes it.
 * @param {{port: number, origin: string}} admin
 * @param {string} method
 * @param {string} urlPath
 * @param {{body?: Buffer|string|object, headers?: Record<string, string|null>}} [opts]
 * @returns {Promise<{status: number, json: unknown}>}
 */
export function api(admin, method, urlPath, { body, headers } = {}) {
  const hdrs = { Host: "127.0.0.1:" + admin.port, Origin: admin.origin, ...headers };
  for (const key of Object.keys(hdrs)) if (hdrs[key] === null) delete hdrs[key];
  let data = body;
  if (data != null && typeof data === "object" && !Buffer.isBuffer(data)) {
    data = JSON.stringify(data);
    hdrs["Content-Type"] = "application/json";
  }
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: admin.port, method, path: urlPath, headers: hdrs },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {}
          resolve({ status: res.statusCode, json });
        });
      },
    );
    req.on("error", reject);
    if (data != null) req.write(data);
    req.end();
  });
}

/**
 * Run `src/build.mjs` inside `dir` with `BASE_PATH=/x`; throws on failure.
 * @param {string} dir
 */
export function buildSite(dir) {
  const res = spawnSync(process.execPath, [path.join(dir, "src/build.mjs")], {
    cwd: dir,
    env: { ...process.env, BASE_PATH: "/x" },
    encoding: "utf8",
  });
  if (res.status !== 0)
    throw new Error("build failed: " + (res.stderr || res.stdout || res.status));
}

/**
 * Remove a sandbox directory.
 * @param {string} dir
 */
export function removeSandbox(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}
