/**
 * Elite Dental Force — Lead Capture Endpoint
 *
 * Receives website form submissions same-origin and upserts the contact
 * into GoHighLevel directly. Replaces the n8n webhook hop so leads land
 * in the CRM even if downstream automation is offline.
 *
 * Required Netlify env vars:
 *   GHL_PIT          — GoHighLevel Private Integration Token
 *   GHL_LOCATION_ID  — GHL sub-account location ID
 */

"use strict";

const GHL_API = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

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
  if (!pit || !locationId) {
    console.error("[ghl-lead] Missing GHL_PIT or GHL_LOCATION_ID env var");
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
    data.customFields && typeof data.customFields === "object"
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
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[ghl-lead] GHL upsert failed", res.status, errBody);
      return json(502, { success: false, error: "CRM rejected the lead" });
    }

    const result = await res.json();
    return json(200, {
      success: true,
      contactId: result.contact && result.contact.id,
    });
  } catch (err) {
    console.error("[ghl-lead] GHL request error", err);
    return json(502, { success: false, error: "CRM unreachable" });
  }
}
