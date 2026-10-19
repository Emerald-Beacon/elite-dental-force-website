// Run: node scripts/test-ghl-lead.mjs
// Website lead function during the GHL to EDF cutover. Network is stubbed at fetch; nothing leaves the machine.
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handler } = require("../netlify/functions/ghl-lead.js");

// Distinctive synthetic values so any leak into a log line or response is detectable.
const SECRETS = {
  GHL_PIT: "SYNTHETIC_GHL_PIT_7f3a",
  GHL_LOCATION_ID: "SYNTHETIC_LOC_91bd",
  EDF_INTAKE_URL: "https://edf-intake.test/api/public/website-lead",
  EDF_INTAKE_KEY: "SYNTHETIC_EDF_KEY_c04e",
};
const GHL = { GHL_PIT: SECRETS.GHL_PIT, GHL_LOCATION_ID: SECRETS.GHL_LOCATION_ID };
const EDF = { EDF_INTAKE_URL: SECRETS.EDF_INTAKE_URL, EDF_INTAKE_KEY: SECRETS.EDF_INTAKE_KEY };

const lead = {
  email: "Pat@Example.com",
  firstName: "Pat",
  lastName: "Lee",
  phone: "801 555 0100",
  companyName: "Lee Family Dental",
  source: "Contact page",
  tags: ["newsletter-signup", "not-a-tag"],
  customFields: { role: "owner", pms: "dentrix" },
  sourceUrl: "https://elitedentalforce.com/pages/contact.html",
  utm_source: "linkedin",
};
const event = (body) => ({ httpMethod: "POST", headers: {}, body: JSON.stringify(body) });
// Provider replies; error bodies echo every secret, as a careless provider might.
const echo = Object.values(SECRETS).join(" ");
const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => echo });
const edfOk = () => reply(200, { success: true, contactId: "edf_1", droppedTags: [] });
const ghlOk = () => reply(200, { contact: { id: "ghl_1" } });
const isEdf = (url) => String(url).startsWith(SECRETS.EDF_INTAKE_URL);
const hang = (init) =>
  new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(init.signal.reason)));

const logs = [];
for (const k of ["log", "warn", "error", "info"]) console[k] = (...a) => logs.push(a.map(String).join(" "));
const say = (line) => process.stdout.write(line + "\n");

function env(vars) {
  for (const k of Object.keys(SECRETS)) delete process.env[k];
  Object.assign(process.env, vars);
}
const calls = [];
async function submit(vars, route, body = lead) {
  env(vars);
  calls.length = 0;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return isEdf(url) ? route.edf(init) : route.ghl(init);
  };
  const res = await handler(event(body));
  return { status: res.statusCode, body: JSON.parse(res.body || "{}"), raw: res.body };
}
const responses = [];
const record = (r) => (responses.push(r.raw), r);

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check("the EDF leg posts to EDF_INTAKE_URL with the key header and JSON", async () => {
  record(await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: ghlOk }));
  const sent = calls.find((c) => isEdf(c.url));
  assert.deepEqual(
    [sent.url, sent.init.method, sent.init.headers],
    [SECRETS.EDF_INTAKE_URL, "POST", { "X-EDF-Intake-Key": SECRETS.EDF_INTAKE_KEY, "Content-Type": "application/json", Accept: "application/json" }],
  );
});
check("the EDF body is exactly the shape the platform intake validates", async () => {
  // Both legs configured, so a GHL only field (locationId, field ids) would have a value to leak.
  record(await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: ghlOk }));
  assert.deepEqual(JSON.parse(calls.find((c) => isEdf(c.url)).init.body), {
    email: "pat@example.com",
    firstName: "Pat",
    lastName: "Lee",
    phone: "801 555 0100",
    companyName: "Lee Family Dental",
    source: "Contact page",
    tags: ["newsletter-signup", "source-website"],
    customFields: { role: "owner", pms: "dentrix" },
    sourceUrl: "https://elitedentalforce.com/pages/contact.html",
    utm_source: "linkedin",
  });
});
check("a form that sends customFields as a list still sends the platform an object", async () => {
  record(await submit(EDF, { edf: edfOk, ghl: ghlOk }, { ...lead, customFields: ["x"] }));
  assert.deepEqual(JSON.parse(calls[0].init.body).customFields, {});
});
check("old CRM returns an error, EDF took the lead: visitor sees success", async () => {
  const r = record(await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: () => reply(500, {}) }));
  assert.deepEqual([r.status, r.body], [200, { success: true, contactId: "edf_1" }]);
});
check("old CRM network failure, EDF took the lead: visitor sees success", async () => {
  const r = record(await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: () => { throw new TypeError("fetch failed"); } }));
  assert.equal(r.status, 200);
});
check("old CRM hangs, EDF took the lead: success arrives before Netlify's 10s limit", async () => {
  const started = Date.now();
  const r = await Promise.race([
    submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: hang }),
    new Promise((resolve) => setTimeout(() => resolve({ status: "still waiting after 6s" }), 6000)),
  ]);
  record(r);
  assert.deepEqual([r.status, Date.now() - started < 6000], [200, true]);
});
check("old CRM env missing: the lead goes to EDF only and the visitor sees success", async () => {
  const r = record(await submit(EDF, { edf: edfOk, ghl: ghlOk }));
  assert.deepEqual([r.status, calls.map((c) => isEdf(c.url))], [200, [true]]);
});
check("EDF down while the old CRM took the lead is reported as a failure", async () => {
  const r = record(await submit({ ...GHL, ...EDF }, { edf: () => reply(503, {}), ghl: ghlOk }));
  assert.deepEqual([r.status, r.body.success], [502, false]);
});
check("EDF unreachable is reported as a failure", async () => {
  const r = record(await submit(EDF, { edf: () => { throw new TypeError("fetch failed"); }, ghl: ghlOk }));
  assert.deepEqual([r.status, r.body.success], [502, false]);
});
check("EDF rejecting the key is reported as a failure", async () => {
  const r = record(await submit({ ...GHL, ...EDF }, { edf: () => reply(401, { error: { code: "UNAUTHORIZED" } }), ghl: ghlOk }));
  assert.equal(r.status, 502);
});
check("an EDF 200 that does not confirm the lead is reported as a failure", async () => {
  const r = record(await submit(EDF, { edf: () => reply(200, {}), ghl: ghlOk }));
  assert.equal(r.status, 502);
});
check("both down is reported as a failure", async () => {
  const r = record(await submit({ ...GHL, ...EDF }, { edf: () => reply(500, {}), ghl: () => reply(500, {}) }));
  assert.equal(r.status, 502);
});
check("before EDF is configured the old CRM alone still saves the lead", async () => {
  const r = record(await submit(GHL, { edf: edfOk, ghl: ghlOk }));
  assert.deepEqual([r.status, r.body.contactId, calls.some((c) => isEdf(c.url))], [200, "ghl_1", false]);
});
check("no CRM configured returns 500", async () => {
  assert.equal(record(await submit({}, { edf: edfOk, ghl: ghlOk })).status, 500);
});
check("the honeypot calls no CRM", async () => {
  record(await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: ghlOk }, { ...lead, _hp: "bot" }));
  assert.equal(calls.length, 0);
});
// Astra W2 gate probe: valid JSON whose custom value is an object with a toString that is not callable.
const customObject = { email: "custom-object@example.test", customFields: { question: { toString: "synthetic answer" } } };
const edfSent = () => calls.filter((c) => isEdf(c.url)).map((c) => JSON.parse(c.init.body));
const ghlSent = () => calls.filter((c) => !isEdf(c.url)).map((c) => JSON.parse(c.init.body));
check("custom object value, old CRM absent: EDF gets the value as sent and the visitor sees success", async () => {
  const r = record(await submit(EDF, { edf: edfOk, ghl: ghlOk }, customObject));
  assert.deepEqual(
    [r.status, edfSent().map((b) => [b.email, b.customFields])],
    [200, [["custom-object@example.test", { question: { toString: "synthetic answer" } }]]],
  );
});
check("custom object value, old CRM configured: EDF gets the request and the visitor sees success", async () => {
  const r = record(await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: ghlOk }, customObject));
  assert.deepEqual([r.status, r.body.contactId, edfSent().length], [200, "edf_1", 1]);
});
check("custom object value: the old CRM note carries it as JSON", async () => {
  await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: ghlOk }, customObject);
  const notes = ghlSent()[0].customFields.find((f) => f.value.includes("question"));
  assert.equal(notes.value, 'question: {"toString":"synthetic answer"}');
});
check("custom object value, old CRM configured and down: EDF still decides", async () => {
  const r = record(await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: () => reply(503, {}) }, customObject));
  assert.deepEqual([r.status, edfSent().length], [200, 1]);
});
check("a PMS value sent as an object still reaches both CRMs", async () => {
  const r = record(
    await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: ghlOk }, { email: "pms-object@example.test", customFields: { pms: { toString: "dentrix" } } }),
  );
  assert.deepEqual([r.status, edfSent().length, ghlSent().length], [200, 1, 1]);
});
check("request JSON that is not an object is refused and calls no CRM", async () => {
  const r = record(await submit({ ...GHL, ...EDF }, { edf: edfOk, ghl: ghlOk }, null));
  assert.deepEqual([r.status, calls.length], [400, 0]);
});
check("no key or env value appears in any log line or response", async () => {
  const leaks = Object.entries(SECRETS).filter(([, v]) => [...logs, ...responses].some((t) => String(t).includes(v)));
  assert.ok(logs.length > 0 && responses.length > 10, "the scan saw the failure logs and responses");
  assert.deepEqual(leaks.map(([k]) => k), []);
});

let passed = 0;
for (const [name, fn] of checks) {
  try {
    await fn();
    passed++;
    say(`PASS ${name}`);
  } catch (e) {
    say(`FAIL ${name}: ${String(e.message).split("\n")[0]}`);
  }
}
say(`${passed}/${checks.length} website lead checks passed`);
if (passed !== checks.length) process.exitCode = 1;
