/**
 * Elite Dental Force — GoHighLevel Form Integration
 *
 * Every website form posts same-origin to the Netlify function
 * /.netlify/functions/ghl-lead, which upserts the contact into
 * GoHighLevel server-side. No third-party endpoints in the browser,
 * so the site CSP stays locked to 'self'.
 */

var EDF_GHL = (function () {
  "use strict";

  var ENDPOINT =
    "https://exquisite-dango-095989.netlify.app/.netlify/functions/ghl-lead";

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function parseName(fullName) {
    var parts = (fullName || "").trim().split(/\s+/);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }

  function fieldValue(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : "";
  }

  function sendLead(payload) {
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (body) {
          if (!res.ok || !body.success) {
            throw new Error(body.error || "HTTP " + res.status);
          }
          return body;
        });
    });
  }

  function pushConversion(formType, email) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "form_submission",
      form_type: formType,
      lead_email: email,
      page_path: window.location.pathname,
      conversion: true,
    });
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setBusy(form, busy, busyText) {
    var btn = form.querySelector('[type="submit"]');
    if (!btn) return "";
    if (busy) {
      btn.dataset.label = btn.textContent;
      btn.disabled = true;
      btn.textContent = busyText || "Sending…";
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.label || btn.textContent;
    }
  }

  function inlineError(form, message) {
    var note = form.querySelector(".ghl-form-error");
    if (!note) {
      note = document.createElement("p");
      note.className = "ghl-form-error";
      note.setAttribute("role", "alert");
      note.style.cssText =
        "color:#ff6b6b;font-size:0.875rem;margin-top:0.75rem;";
      var btn = form.querySelector('[type="submit"]');
      if (btn && btn.parentElement) {
        btn.parentElement.insertBefore(note, btn.nextSibling);
      } else {
        form.appendChild(note);
      }
    }
    note.textContent = message;
  }

  function clearError(form) {
    var note = form.querySelector(".ghl-form-error");
    if (note) note.textContent = "";
  }

  function genericSuccess(form, heading, message) {
    form.innerHTML =
      '<div style="text-align:center;padding:3rem 2rem;">' +
      '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#27c93f" stroke-width="2" style="margin:0 auto 16px;display:block;">' +
      '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
      '<h3 style="margin-bottom:8px;">' +
      heading +
      "</h3>" +
      '<p style="opacity:0.85;">' +
      message +
      "</p></div>";
  }

  /**
   * Wire one form. config:
   *   id          — form element id (or pass element via config.form)
   *   tag         — pipeline tag sent to GHL
   *   formType    — GA4 form_type value
   *   nameField   — single full-name input (parsed) OR null when the form
   *                 has firstName/lastName inputs
   *   fields      — map of payload extras: { payloadKey: inputName }
   *   companyField— input name used for companyName
   *   busyText    — submit button label while sending
   *   onSuccess   — function(form) rendering the success state
   *   errorText   — inline failure message
   */
  function wireForm(config) {
    var form = config.form || document.getElementById(config.id);
    if (!form || form.dataset.ghlWired) return;
    form.dataset.ghlWired = "true";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError(form);

      var name = config.nameField
        ? parseName(fieldValue(form, config.nameField))
        : {
            firstName:
              fieldValue(form, "firstName") || fieldValue(form, "first_name"),
            lastName:
              fieldValue(form, "lastName") || fieldValue(form, "last_name"),
          };

      var email = fieldValue(form, "email");
      if (!validEmail(email)) {
        inlineError(form, "Please enter a valid email address.");
        var emailEl = form.querySelector('[name="email"]');
        if (emailEl) emailEl.focus();
        return;
      }

      var missing = Array.prototype.filter.call(
        form.querySelectorAll("[required]"),
        function (el) {
          return !el.value.trim();
        },
      );
      if (missing.length) {
        inlineError(form, "Please fill in all required fields.");
        missing[0].focus();
        return;
      }

      var extras = {};
      Object.keys(config.fields || {}).forEach(function (key) {
        var val = fieldValue(form, config.fields[key]);
        if (val) extras[key] = val;
      });

      var tag =
        typeof config.tag === "function" ? config.tag(form) : config.tag;
      var payload = {
        firstName: name.firstName,
        lastName: name.lastName,
        email: email,
        phone: fieldValue(form, "phone"),
        companyName: config.companyField
          ? fieldValue(form, config.companyField)
          : "",
        source: "Website — " + document.title,
        sourceUrl: window.location.href,
        tags: [tag],
        customFields: extras,
      };

      setBusy(form, true, config.busyText);

      sendLead(payload)
        .then(function () {
          pushConversion(config.formType, email);
          config.onSuccess(form);
        })
        .catch(function (err) {
          console.error(
            "[EDF GHL] " + config.formType + " submission error:",
            err,
          );
          setBusy(form, false);
          inlineError(
            form,
            config.errorText ||
              "Something went wrong. Please email us directly at info@elitedentalforce.com",
          );
        });
    });
  }

  // Hide the form wrapper, reveal a dedicated success element
  function swapSuccess(wrapId, successId) {
    return function () {
      var wrap = document.getElementById(wrapId);
      var success = document.getElementById(successId);
      if (wrap) wrap.style.display = "none";
      if (success) {
        success.style.display = "block";
        success.setAttribute("aria-hidden", "false");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
  }

  // ─── Form registry ───────────────────────────────────────────────────────

  function init() {
    // Contact page — routes demo/sales subjects to the demo tag
    var contactForm = document.getElementById("contact-form");
    if (contactForm) {
      wireForm({
        form: contactForm,
        tag: function (f) {
          var subject = fieldValue(f, "subject");
          return subject === "demo" || subject === "sales"
            ? "demo-request"
            : "website-contact";
        },
        formType: "contact",
        nameField: "name",
        companyField: "organization",
        fields: { subject: "subject", message: "message" },
        busyText: "Sending…",
        onSuccess: function (form) {
          var wrap = form.closest('[id$="-wrap"]') || form.parentElement;
          var successEl =
            document.getElementById("ct-success") ||
            document.getElementById("form-success") ||
            document.getElementById("contact-success");
          if (successEl) {
            if (wrap) wrap.style.display = "none";
            successEl.style.display = "flex";
            successEl.setAttribute("aria-hidden", "false");
          } else {
            genericSuccess(
              form,
              "Message Sent!",
              "We'll be in touch within one business day.",
            );
          }
        },
      });
    }

    // Standalone demo request form
    wireForm({
      id: "demo-form",
      tag: "demo-request",
      formType: "demo",
      nameField: "name",
      companyField: "practice",
      fields: {
        practiceType: "practice_type",
        locations: "locations",
        challenge: "challenge",
        heardFrom: "heard_from",
      },
      busyText: "Sending…",
      onSuccess: function (form) {
        genericSuccess(
          form,
          "Request Received!",
          "We'll reach out within one business day to schedule your demo.",
        );
      },
    });

    // Revenue audit form
    wireForm({
      id: "audit-form",
      tag: "revenue-audit",
      formType: "audit",
      nameField: "name",
      companyField: "practice",
      fields: {
        monthlyProduction: "monthly_production",
        insuranceMix: "insurance_mix",
        concern: "concern",
      },
      busyText: "Sending…",
      onSuccess: function (form) {
        genericSuccess(
          form,
          "Audit Request Received!",
          "We'll be in touch within one business day.",
        );
      },
    });

    // Enterprise inquiry
    wireForm({
      id: "enterprise-form-el",
      tag: "enterprise-inquiry",
      formType: "enterprise",
      nameField: null,
      companyField: "organization",
      fields: {
        locations: "locations",
        pms: "pms",
        billingSoftware: "billing_software",
        monthlyProduction: "monthly_production",
        message: "message",
      },
      busyText: "Sending…",
      onSuccess: swapSuccess("ent-form-wrap", "ent-success"),
    });

    // Partner application
    wireForm({
      id: "ptrs-partner-form",
      tag: "partner-inquiry",
      formType: "partner",
      nameField: null,
      companyField: "company",
      fields: {
        website: "website",
        partnerType: "partnerType",
        description: "description",
      },
      busyText: "Submitting…",
      onSuccess: swapSuccess("ptrs-form-wrap", "ptrs-success"),
    });

    // Investor inquiry
    wireForm({
      id: "investor-form",
      tag: "investor-inquiry",
      formType: "investor",
      nameField: null,
      companyField: "firm",
      fields: { role: "role", message: "message" },
      busyText: "Sending…",
      onSuccess: function (form) {
        genericSuccess(
          form,
          "Request Received!",
          "We'll send the investor package to your inbox shortly.",
        );
      },
    });

    // Newsletter signups (email-only forms)
    document.querySelectorAll("form[data-newsletter]").forEach(function (form) {
      if (form.dataset.ghlWired) return;
      form.dataset.ghlWired = "true";
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearError(form);
        var emailEl = form.querySelector('input[type="email"]');
        var email = emailEl ? emailEl.value.trim() : "";
        if (!validEmail(email)) {
          inlineError(form, "Please enter a valid email address.");
          if (emailEl) emailEl.focus();
          return;
        }
        setBusy(form, true, "Subscribing…");
        sendLead({
          email: email,
          source: "Website Newsletter — " + document.title,
          sourceUrl: window.location.href,
          tags: ["newsletter-signup"],
          customFields: {},
        })
          .then(function () {
            pushConversion("newsletter", email);
            genericSuccess(
              form,
              "Subscribed!",
              "You are on the list. No spam, ever.",
            );
          })
          .catch(function (err) {
            console.error("[EDF GHL] newsletter error:", err);
            setBusy(form, false);
            inlineError(form, "Subscription failed. Please try again.");
          });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { init: init, endpoint: ENDPOINT };
})();
