// Run: node scripts/test-ghl-lead.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handler } = require("../netlify/functions/ghl-lead.js");

const lead = { email: "pat@example.com", firstName: "Pat", tags: ["newsletter-signup"], customFields: { role: "owner" } };
const event = (body) => ({ httpMethod: "POST", headers: {}, body: JSON.stringify(body) });
const ok = (body) => ({ ok: true, json: async () => body, text: async () => "" });
const fail = { ok: false, status: 500, text: async () => "down" };

function env(vars) {
  for (const k of ["GHL_PIT", "GHL_LOCATION_ID", "EDF_INTAKE_URL", "EDF_INTAKE_KEY"]) delete process.env[k];
  Object.assign(process.env, vars);
}
const GHL = { GHL_PIT: "pit", GHL_LOCATION_ID: "loc" };
const EDF = { EDF_INTAKE_URL: "https://edf.test/api/public/website-lead", EDF_INTAKE_KEY: "k" };
console.error = () => {};

const cases = [
  ["edf only, accepted", EDF, () => ok({ contactId: "c1" }), 200],
  ["ghl down, edf up still saves", { ...GHL, ...EDF }, (url) => (url.includes("edf.test") ? ok({ contactId: "c1" }) : fail), 200],
  ["both down returns 502", { ...GHL, ...EDF }, () => fail, 502],
  ["no crm configured returns 500", {}, () => ok({}), 500],
];

for (const [name, vars, fetchImpl, status] of cases) {
  env(vars);
  globalThis.fetch = async (url) => fetchImpl(url);
  const res = await handler(event(lead));
  assert.equal(res.statusCode, status, name);
  console.log("ok", name);
}

env(EDF);
let sent;
globalThis.fetch = async (url, init) => { sent = { url, init }; return ok({ contactId: "c1" }); };
await handler(event({ ...lead, utm_source: "linkedin" }));
const body = JSON.parse(sent.init.body);
assert.equal(sent.init.headers["X-EDF-Intake-Key"], "k", "intake key header sent");
assert.deepEqual(body.tags, ["newsletter-signup", "source-website"], "tags forwarded with source-website");
assert.equal(body.utm_source, "linkedin", "utm forwarded");
console.log("ok edf body shape");

let calls = 0;
globalThis.fetch = async () => { calls++; return ok({}); };
await handler(event({ ...lead, _hp: "bot" }));
assert.equal(calls, 0, "honeypot never calls a CRM");
console.log("ok honeypot");
