const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const REDIRECT = path.join("early-adopters", "index.html");
const BANNED = [
  /early.?adopter/i,
  /price.?lock/i,
  /keep (their|your) prices?/i,
  /locks? (in )?(their|your) prices?/i,
  /31 March 2027/i,
  /31 October 2027/i,
  /first 50 companies/i,
];

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === ".git" || e.name === "node_modules") return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith(".html") ? [p] : [];
  });
}

test("no page outside the redirect mentions the early-adopter offer or a price lock", () => {
  const hits = [];
  for (const file of htmlFiles(root)) {
    const rel = path.relative(root, file);
    if (rel === REDIRECT) continue;
    const text = fs.readFileSync(file, "utf8").replace(/\s+/g, " ");
    for (const re of BANNED) if (re.test(text)) hits.push(`${rel}: ${re}`);
  }
  assert.deepEqual(hits, []);
});

test("sitemap does not list the early-adopters redirect", () => {
  const xml = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  assert.ok(!/early-adopters/.test(xml));
});

test("/early-adopters/ is a redirect to /pricing/", () => {
  const html = fs.readFileSync(path.join(root, REDIRECT), "utf8");
  assert.match(html, /http-equiv="refresh" content="0; url=\/pricing\/"/);
  assert.match(html, /rel="canonical" href="https:\/\/compliar\.co\.uk\/pricing\/"/);
});

test("JSON-LD blocks stay valid JSON", () => {
  for (const file of htmlFiles(root)) {
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(m[1]), path.relative(root, file));
    }
  }
});
