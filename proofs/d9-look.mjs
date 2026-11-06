/** Proof D9: in a real browser, every river label stays inside the screen, keeps its natural glyph width and is readable. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { makeSandbox, buildSite, removeSandbox } from "./harness.mjs";

const SIZES = [[320, 640], [768, 1024], [1280, 800], [1920, 1080]];
const MIN_LABEL_PX = 12;
const MIN_BODY_PX = 16;
const MIN_TITLE_PX = 20;
const MIN_RIBBON_PX = 12;
const TYPES = { ".html": "text/html", ".css": "text/css", ".mjs": "text/javascript", ".js": "text/javascript", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml" };

/** Runs inside the page: samples each label across its whole lap and reports what it saw. */
const MEASURE = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const labels = [...document.querySelectorAll('.RiverLabel')];
  const navCount = document.querySelectorAll('nav.river a').length;
  const anims = document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('RiverLabel'));
  const problems = [];
  if (labels.length !== navCount) problems.push('labels ' + labels.length + ' but nav links ' + navCount);
  if (anims.length !== labels.length) problems.push(anims.length + ' animations for ' + labels.length + ' labels');
  let minFont = Infinity;
  for (const l of labels) {
    const t = l.querySelector('text');
    minFont = Math.min(minFont, parseFloat(getComputedStyle(t).fontSize));
    if (t.hasAttribute('textLength') || t.hasAttribute('lengthAdjust')) problems.push('squeezed: ' + t.textContent);
  }
  const shown = new Map(labels.map((l) => [l, 0]));
  const STEPS = 80;
  for (const a of anims) a.pause();
  for (let k = 0; k < STEPS; k++) {
    for (const a of anims) a.currentTime = (k / STEPS) * a.effect.getTiming().duration;
    for (const l of labels) {
      if (+getComputedStyle(l).opacity < 0.99) continue;
      shown.set(l, shown.get(l) + 1);
      const r = l.getBoundingClientRect();
      if (r.left < 0 || r.top < 0 || r.right > vw || r.bottom > vh)
        problems.push(l.textContent + ' outside at step ' + k + ': ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(','));
    }
  }
  for (const [l, n] of shown) if (n === 0) problems.push(l.textContent + ' never fully shown');
  return { labels: labels.length, minFont, problems };
})()`;

/** Runs inside the page: checks body, title and ribbon text sizes, ribbon fit, sideways scroll, the text-box border and clipping. */
const MEASURE_TEXT = `(async () => {
  await document.fonts.load('700 12px "Josefin Sans"');
  await document.fonts.load('400 16px "Josefin Sans"');
  await document.fonts.ready;
  const problems = [];
  const paras = [...document.querySelectorAll('.ContentManager p')];
  if (!paras.length) problems.push('[body] no paragraph');
  for (const p of paras) {
    const fs = parseFloat(getComputedStyle(p).fontSize);
    if (fs < ${MIN_BODY_PX}) problems.push('[body] paragraph font ' + fs + 'px < ' + ${MIN_BODY_PX} + 'px');
  }
  const h1 = document.querySelector('.ContentManager h1');
  if (h1 && parseFloat(getComputedStyle(h1).fontSize) < ${MIN_TITLE_PX}) problems.push('[title] font ' + parseFloat(getComputedStyle(h1).fontSize) + 'px < ' + ${MIN_TITLE_PX} + 'px');
  const texts = [...document.querySelectorAll('.AppTitle text')];
  if (!texts.length) problems.push('[ribbon] no title text');
  for (const text of texts) {
    const fs = parseFloat(getComputedStyle(text).fontSize);
    if (fs < ${MIN_RIBBON_PX}) problems.push('[ribbon] font ' + fs + 'px < ' + ${MIN_RIBBON_PX} + 'px: ' + text.textContent);
    const m = document.querySelector('.BGCircle circle').getBoundingClientRect();
    const cx = m.left + m.width / 2, cy = m.top + m.height / 2, r = m.width / 2;
    const p = text.getStartPositionOfChar(0);
    const left = p.x - 2, right = p.x + fs, top = p.y - fs, bottom = p.y + fs;
    const nx = Math.max(left, Math.min(cx, right)), ny = Math.max(top, Math.min(cy, bottom));
    const d = Math.hypot(cx - nx, cy - ny);
    if (d < r + 5) problems.push('[moon] "' + text.textContent + '" starts ' + Math.round(d) + 'px from the moon centre, want ' + Math.round(r + 5));
    const tp = text.querySelector('textPath');
    if (tp) {
      const path = document.getElementById(tp.href.baseVal.slice(1));
      const len = text.getComputedTextLength();
      if (len === 0) problems.push('[fit] computed length 0: ' + text.textContent);
      else if (path && len > path.getTotalLength()) problems.push('[fit] ' + text.textContent + ' len ' + Math.round(len) + ' > path ' + Math.round(path.getTotalLength()));
    }
  }
  if (document.documentElement.scrollWidth > innerWidth) problems.push('[scroll] scrollWidth ' + document.documentElement.scrollWidth + ' > innerWidth ' + innerWidth);
  const item = document.querySelector('.Category__item');
  if (item && getComputedStyle(item).borderRightWidth !== '0px') problems.push('[bar] right border ' + getComputedStyle(item).borderRightWidth);
  const cm = document.querySelector('.ContentManager');
  if (cm && (cm.scrollWidth > cm.clientWidth || cm.getBoundingClientRect().right > innerWidth + 0.5)) problems.push('[clip] ContentManager clipped: scrollWidth ' + cm.scrollWidth + ', clientWidth ' + cm.clientWidth + ', right ' + Math.round(cm.getBoundingClientRect().right) + ' vs ' + innerWidth);
  for (const el of document.querySelectorAll('.ContentManager h1, .ContentManager h2, .ContentManager h3, .ContentManager p')) {
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const re = /\\S+/g;
      let m;
      while ((m = re.exec(node.textContent))) {
        const range = document.createRange();
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        if (range.getClientRects().length > 1) problems.push('[break] "' + m[0] + '" is split over lines');
      }
    }
  }
  const moon = document.querySelector('.BGCircle');
  for (const label of document.querySelectorAll('.RiverLabel')) {
    if (!(label.compareDocumentPosition(moon) & Node.DOCUMENT_POSITION_FOLLOWING)) problems.push('[order] river labels are painted over the moon');
  }
  return { problems };
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sandbox = makeSandbox();
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "carbyne-chrome-"));
let server, chrome, ws;
let bad = 0;
try {
  buildSite(sandbox);
  const dist = path.join(sandbox, "dist");
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (!p.startsWith("/x/")) return void res.writeHead(404).end();
    p = p.slice(2);
    if (p.endsWith("/")) p += "index.html";
    const file = path.join(dist, p);
    if (!file.startsWith(dist) || !fs.existsSync(file)) return void res.writeHead(404).end();
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" }).end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const debugPort = await new Promise((resolve, reject) => {
    let buf = "";
    const timer = setTimeout(() => reject(new Error("chrome did not start in 10s")), 10000);
    chrome.stderr.on("data", (c) => {
      buf += c;
      const m = buf.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (m) { clearTimeout(timer); resolve(Number(m[1])); }
    });
    chrome.on("exit", () => reject(new Error("chrome exited early")));
  });
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    const p = pending.get(m.id);
    if (!p) return;
    pending.delete(m.id);
    if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result);
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++nextId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "evaluate failed");
    return r.result.value;
  };

  /** Opens the home page at a screen size; true once the scene has mounted. */
  const open = async (w, h) => {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/x/` });
    for (let i = 0; i < 100; i++) {
      await sleep(50);
      if (await evaluate("document.documentElement.classList.contains('has-scene')").catch(() => false)) return true;
    }
    return false;
  };

  for (const [w, h] of SIZES) {
    if (!(await open(w, h))) { console.log(`NO  ${w}x${h}: scene did not mount`); bad++; continue; }
    const r = await evaluate(MEASURE);
    const t = await evaluate(MEASURE_TEXT);
    const problems = [...new Set([...r.problems, ...t.problems])];
    if (r.minFont < MIN_LABEL_PX) problems.push(`label font ${r.minFont}px < ${MIN_LABEL_PX}px`);
    console.log(problems.length ? `NO  ${w}x${h}: ${problems.slice(0, 8).join("; ")}` : `ok  ${w}x${h}: ${r.labels} labels inside, font ${r.minFont}px`);
    if (problems.length) bad++;
  }

  // Hover: the label under the pointer stops drifting, the others keep going.
  if (!(await open(1280, 800))) { console.log("NO  hover: scene did not mount"); bad++; }
  else {
    const spot = await evaluate(`(() => {
      for (const l of document.querySelectorAll('.RiverLabel')) {
        if (+getComputedStyle(l).opacity < 0.99) continue;
        const r = l.querySelector('text').getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return null;
    })()`);
    if (!spot) { console.log("NO  hover: no fully visible label to point at"); bad++; }
    else {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: spot.x, y: spot.y });
      await sleep(100);
      const states = await evaluate("[...document.querySelectorAll('.RiverLabel')].map((l) => getComputedStyle(l).animationPlayState)");
      const paused = states.filter((s) => s === "paused").length;
      const hit = await evaluate(`(() => { const e = document.elementFromPoint(${spot.x}, ${spot.y}); return e ? e.tagName + '.' + (e.getAttribute('class') || '') : 'nothing'; })()`);
      console.log(paused === 1 ? `ok  hover: 1 of ${states.length} labels paused` : `NO  hover: ${paused} of ${states.length} labels paused, want 1 (pointer at ${Math.round(spot.x)},${Math.round(spot.y)} is over ${hit})`);
      if (paused !== 1) bad++;
    }
  }
} catch (e) {
  console.log(`D9: no - ${e.message}`);
  bad++;
} finally {
  try { ws?.close(); } catch {}
  if (chrome && chrome.exitCode === null) {
    chrome.kill("SIGKILL");
    await new Promise((r) => chrome.once("exit", r));
  }
  server?.close();
  removeSandbox(sandbox);
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
console.log(bad ? "D9: no" : "D9: yes");
process.exit(bad ? 1 : 0);
