/**
 * Elite Dental Force — GoHighLevel Form Integration
 *
 * HOW TO CONFIGURE:
 * 1. In GoHighLevel: Settings → Integrations → Webhooks → Add Webhook
 * 2. Copy the webhook URL and paste it into GHL_CONFIG below
 * 3. Each form maps to its own webhook + pipeline tag
 *
 * FIELD MAPPING:
 * GHL Contact fields: firstName, lastName, email, phone, companyName
 * GHL Custom fields: use the field key from Settings → Custom Fields
 */

var EDF_GHL = (function () {
  'use strict';

  // ─── Configuration — SET THESE ─────────────────────────────────────────
  var GHL_CONFIG = {
    // Contact form webhook (subject-based routing)
    contact: {
      webhookUrl: 'https://n8n-production-6004.up.railway.app/webhook/edf-contact',
      pipelineTag: 'website-contact'
    },
    // Demo request webhook
    demo: {
      webhookUrl: 'https://n8n-production-6004.up.railway.app/webhook/edf-demo',
      pipelineTag: 'demo-request',
      pipeline: 'Demo Requests'
    },
    // Revenue audit webhook
    audit: {
      webhookUrl: 'https://n8n-production-6004.up.railway.app/webhook/edf-audit',
      pipelineTag: 'revenue-audit',
      pipeline: 'Audit Leads'
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  // Parse full name into first + last
  function parseName(fullName) {
    var parts = (fullName || '').trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  }

  // Send data to GHL webhook
  function sendToGHL(webhookUrl, payload) {
    return fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // Push conversion event to GA4 via dataLayer
  function pushConversion(formType, email) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'form_submission',
      form_type: formType,
      lead_email: email,
      page_path: window.location.pathname,
      conversion: true
    });
  }

  // Build base contact payload from parsed name + common fields
  function buildPayload(config, fields) {
    var name = parseName(fields.name);
    return Object.assign({
      firstName: name.firstName,
      lastName: name.lastName,
      email: fields.email,
      phone: fields.phone || '',
      companyName: fields.organization || fields.practice || '',
      source: 'Website — ' + document.title,
      sourceUrl: window.location.href,
      tags: [config.pipelineTag],
      customFields: {}
    }, fields.extra ? { customFields: fields.extra } : {});
  }

  // ─── Contact Form Handler ────────────────────────────────────────────────
  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = {
        name: (document.getElementById('ct-name') || {}).value || '',
        email: (document.getElementById('ct-email') || {}).value || '',
        phone: (document.getElementById('ct-phone') || {}).value || '',
        organization: (document.getElementById('ct-org') || {}).value || '',
        extra: {
          subject: (document.getElementById('ct-subject') || {}).value || '',
          message: (document.getElementById('ct-message') || {}).value || ''
        }
      };

      var config = GHL_CONFIG.contact;

      // Route high-value subjects to demo pipeline
      if (fields.extra.subject === 'demo' || fields.extra.subject === 'sales') {
        config = GHL_CONFIG.demo;
      }

      var payload = buildPayload(config, fields);
      payload.customFields.subject = fields.extra.subject;
      payload.customFields.message = fields.extra.message;

      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      var webhookUrl = config.webhookUrl;

      if (webhookUrl.startsWith('YOUR_')) {
        console.warn('[EDF GHL] Webhook URL not configured. Form data:', payload);
        showSuccess(form);
        return;
      }

      sendToGHL(webhookUrl, payload)
        .then(function () {
          pushConversion('contact', fields.email);
          showSuccess(form);
        })
        .catch(function (err) {
          console.error('[EDF GHL] Submission error:', err);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
          alert('There was an issue sending your message. Please email us directly at info@elitedentalforce.com');
        });
    });
  }

  // ─── Demo Form Handler (standalone demo page) ───────────────────────────
  function initDemoForm() {
    var form = document.getElementById('demo-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = {
        name: (form.querySelector('[name="name"]') || {}).value || '',
        email: (form.querySelector('[name="email"]') || {}).value || '',
        phone: (form.querySelector('[name="phone"]') || {}).value || '',
        practice: (form.querySelector('[name="practice"]') || {}).value || '',
        extra: {
          practiceType: (form.querySelector('[name="practice_type"]') || {}).value || '',
          locations: (form.querySelector('[name="locations"]') || {}).value || '',
          challenge: (form.querySelector('[name="challenge"]') || {}).value || '',
          source: (form.querySelector('[name="heard_from"]') || {}).value || ''
        }
      };

      var payload = buildPayload(GHL_CONFIG.demo, fields);
      Object.assign(payload.customFields, fields.extra);

      var webhookUrl = GHL_CONFIG.demo.webhookUrl;
      if (webhookUrl.startsWith('YOUR_')) {
        console.warn('[EDF GHL] Demo webhook not configured. Data:', payload);
        showSuccess(form);
        return;
      }

      sendToGHL(webhookUrl, payload)
        .then(function () {
          pushConversion('demo', fields.email);
          showSuccess(form);
        })
        .catch(function (err) {
          console.error('[EDF GHL] Demo form error:', err);
        });
    });
  }

  // ─── Audit Form Handler ──────────────────────────────────────────────────
  function initAuditForm() {
    var form = document.getElementById('audit-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = {
        name: (form.querySelector('[name="name"]') || {}).value || '',
        email: (form.querySelector('[name="email"]') || {}).value || '',
        phone: (form.querySelector('[name="phone"]') || {}).value || '',
        practice: (form.querySelector('[name="practice"]') || {}).value || '',
        extra: {
          monthlyProduction: (form.querySelector('[name="monthly_production"]') || {}).value || '',
          insuranceMix: (form.querySelector('[name="insurance_mix"]') || {}).value || '',
          concern: (form.querySelector('[name="concern"]') || {}).value || ''
        }
      };

      var payload = buildPayload(GHL_CONFIG.audit, fields);
      Object.assign(payload.customFields, fields.extra);

      var webhookUrl = GHL_CONFIG.audit.webhookUrl;
      if (webhookUrl.startsWith('YOUR_')) {
        console.warn('[EDF GHL] Audit webhook not configured. Data:', payload);
        showSuccess(form);
        return;
      }

      sendToGHL(webhookUrl, payload)
        .then(function () {
          pushConversion('audit', fields.email);
          showSuccess(form);
        })
        .catch(function (err) {
          console.error('[EDF GHL] Audit form error:', err);
        });
    });
  }

  // ─── Success State ────────────────────────────────────────────────────────
  function showSuccess(form) {
    var wrap = form.closest('[id$="-wrap"]') || form.parentElement;
    var successEl = document.getElementById('ct-success') ||
                    document.getElementById('form-success') ||
                    document.getElementById('contact-success');
    if (wrap) wrap.style.display = 'none';
    if (successEl) {
      successEl.style.display = 'flex';
      successEl.setAttribute('aria-hidden', 'false');
    } else {
      form.innerHTML = '<div style="text-align:center;padding:3rem 2rem;"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#27c93f" stroke-width="2" style="margin:0 auto 16px;display:block;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><h3 style="color:#f0f7ff;margin-bottom:8px;">Message Sent!</h3><p style="color:rgba(133,184,216,0.85);">We\'ll be in touch within one business day.</p></div>';
    }
  }

  // ─── Public Init ─────────────────────────────────────────────────────────
  function init() {
    initContactForm();
    initDemoForm();
    initAuditForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init: init, config: GHL_CONFIG };
})();
