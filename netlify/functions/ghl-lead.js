/**
 * Elite Dental Force — Lead Capture Endpoint
 *
 * Receives website form submissions same-origin and upserts the contact
 * into GoHighLevel directly. Replaces the n8n webhook hop so leads land
 * in the CRM even if downstream automation is offline.
 *
 * Netlify env vars:
 *   EDF_INTAKE_URL   — EDF platform intake, .../api/public/website-lead
 *   EDF_INTAKE_KEY   — shared key sent as X-EDF-Intake-Key
 *   GHL_PIT          — GoHighLevel Private Integration Token (until Nov 1)
 *   GHL_LOCATION_ID  — GHL sub-account location ID (until Nov 1)
 *
 * Once EDF intake is configured it is the record: its result alone decides
 * what the visitor sees. The GHL leg is best effort and time boxed.
 */

"use strict";

const GHL_API = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";
// Both legs run in parallel inside Netlify's 10s function limit, so a hung
// GHL call can never hold the EDF answer past GHL_TIMEOUT_MS.
const GHL_TIMEOUT_MS = 4000;
const EDF_TIMEOUT_MS = 8000;

// GHL custom field IDs (location oMeyewr4HWw0bamzu28W)
const FIELD_IDS = {
  practiceName: "zdpPfSDbZR6GscHJaGqs",
  notes: "unJEjv8ci5iz6DwfyOr6",
  leadSource: "mWyDk3IkZUedeEjPFY2k",
  pmsSoftware: "P5UA73HiVx38P9nwk3T9",
};

// Picklist values must match GHL exactly
const PMS_MAP = {
  open_dental: "Open Dental",
  dentrix: "Dentrix",
  eaglesoft: "Eaglesoft",
  curve: "Curve",
  denticon: "Other",
  other: "Other",
};

const ALLOWED_TAGS = new Set([
  "website-contact",
  "demo-request",
  "revenue-audit",
  "enterprise-inquiry",
  "partner-inquiry",
  "investor-inquiry",
  "newsletter-signup",
  "compliance-inquiry",
  "compliance-download",
  "roi-calculator-lead",
  "booking-modal",
  "pre-booking-capture",
  "source-website",
]);

// CORS: the production domain is served by a separate Netlify site that
// cannot reach this function same-origin until its env vars are set.
const ALLOWED_ORIGINS = new Set([
  "https://elitedentalforce.com",
  "https://www.elitedentalforce.com",
  "https://exquisite-dango-095989.netlify.app",
]);

function corsHeaders(event) {
  const origin =
    (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  return ALLOWED_ORIGINS.has(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      }
    : {};
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max || 500);
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async function (event) {
  const cors = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  const result = await handleLead(event);
  result.headers = Object.assign({}, result.headers, cors);
  return result;
};

async function handleLead(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { success: false, error: "Method not allowed" });
  }

  const pit = process.env.GHL_PIT;
  const locationId = process.env.GHL_LOCATION_ID;
  const edfUrl = process.env.EDF_INTAKE_URL;
  const edfKey = process.env.EDF_INTAKE_KEY;
  const hasGhl = Boolean(pit && locationId);
  const hasEdf = Boolean(edfUrl && edfKey);
  if (!hasGhl && !hasEdf) {
    console.error(
      "[ghl-lead] No CRM configured (GHL_PIT/GHL_LOCATION_ID or EDF_INTAKE_URL/EDF_INTAKE_KEY)",
    );
    return json(500, { success: false, error: "Server not configured" });
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { success: false, error: "Invalid JSON" });
  }

  // Honeypot: bots fill hidden fields, humans never see them
  if (data._hp) {
    return json(200, { success: true });
  }

  const email = clean(data.email, 320).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return json(400, { success: false, error: "Valid email required" });
  }

  const tags = Array.isArray(data.tags)
    ? data.tags.filter(
        (t) =>
          ALLOWED_TAGS.has(t) ||
          (typeof t === "string" && /^doc-[a-z0-9-]{1,40}$/.test(t)),
      )
    : [];
  if (!tags.includes("source-website")) tags.push("source-website");

  const company = clean(
    data.companyName || data.practice || data.organization || data.firm,
    200,
  );

  // Everything not a standard contact field lands in the Notes custom
  // field so no form input is silently dropped.
  const noteLines = [];
  const extras =
    data.customFields &&
    typeof data.customFields === "object" &&
    !Array.isArray(data.customFields)
      ? data.customFields
      : {};
  for (const key of Object.keys(extras)) {
    const val = clean(String(extras[key] == null ? "" : extras[key]), 1500);
    if (val) noteLines.push(key + ": " + val);
  }
  if (data.sourceUrl) noteLines.push("Page: " + clean(data.sourceUrl, 300));

  const customFields = [{ id: FIELD_IDS.leadSource, value: "Organic" }];
  if (company) {
    customFields.push({ id: FIELD_IDS.practiceName, value: company });
  }
  if (noteLines.length) {
    customFields.push({ id: FIELD_IDS.notes, value: noteLines.join("\n") });
  }
  const pms = PMS_MAP[String(extras.pms || "").toLowerCase()];
  if (pms) {
    customFields.push({ id: FIELD_IDS.pmsSoftware, value: pms });
  }

  const payload = {
    locationId,
    email,
    firstName: clean(data.firstName, 100),
    lastName: clean(data.lastName, 100),
    phone: clean(data.phone, 30),
    companyName: company,
    source: clean(data.source, 200) || "EDF Website",
    tags,
    customFields,
  };

  // ponytail: dual write during the GHL to EDF cutover; drop the GHL sink
  // once GHL is canceled (Nov 1).
  const edfBody = {
    email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    companyName: company,
    source: payload.source,
    tags,
    customFields: extras,
    sourceUrl: clean(data.sourceUrl, 300),
  };
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]) {
    if (typeof data[key] === "string") edfBody[key] = clean(data[key], 200);
  }

  const ghl = hasGhl ? sendToGhl(pit, payload) : null;
  const edf = hasEdf ? await sendToEdf(edfUrl, edfKey, edfBody) : null;
  // Awaited so Netlify does not freeze the GHL request mid flight; it is
  // time boxed and never throws, so it cannot change the EDF answer.
  const old = ghl ? await ghl : null;
  const saved = hasEdf ? edf : old;
  if (!saved.ok) {
    return json(502, { success: false, error: "CRM rejected the lead" });
  }
  return json(200, { success: true, contactId: saved.contactId });
}

async function sendToGhl(pit, payload) {
  try {
    const res = await fetch(GHL_API + "/contacts/upsert", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + pit,
        Version: API_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(GHL_TIMEOUT_MS),
    });
    // Status only: a provider error body can echo the request.
    if (!res.ok) {
      console.error("[ghl-lead] GHL upsert failed", res.status);
      return { ok: false };
    }
    const result = await res.json();
    return { ok: true, contactId: result.contact && result.contact.id };
  } catch (err) {
    console.error("[ghl-lead] GHL request error", err.name);
    return { ok: false };
  }
}

async function sendToEdf(url, key, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-EDF-Intake-Key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(EDF_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[ghl-lead] EDF intake failed", res.status);
      return { ok: false };
    }
    const result = await res.json();
    if (!result || result.success !== true) {
      console.error("[ghl-lead] EDF intake did not confirm the lead");
      return { ok: false };
    }
    return { ok: true, contactId: result.contactId };
  } catch (err) {
    console.error("[ghl-lead] EDF intake request error", err.name);
    return { ok: false };
  }
}
