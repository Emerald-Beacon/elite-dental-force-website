/**
 * Elite Dental Force — Analytics & Event Tracking
 * Replace GTM_CONTAINER_ID with your actual GTM ID (e.g. GTM-MQJKZLMC)
 * This file handles: scroll depth, CTA clicks, form engagement, outbound links
 */

(function () {
  'use strict';

  // ─── Configuration ───────────────────────────────────────────────────────
  const GTM_ID = 'GTM-MQJKZLMC'; // ← REPLACE with your GTM container ID

  // ─── Google Tag Manager Install ──────────────────────────────────────────
  function installGTM(id) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + id;
    document.head.appendChild(s);
  }

  // ─── Push to dataLayer (safe wrapper) ────────────────────────────────────
  function push(obj) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(obj);
  }

  // ─── Scroll Depth Tracking ────────────────────────────────────────────────
  function initScrollDepth() {
    var milestones = [25, 50, 75, 90];
    var fired = {};
    function onScroll() {
      var scrolled = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
      milestones.forEach(function (pct) {
        if (!fired[pct] && scrolled >= pct) {
          fired[pct] = true;
          push({ event: 'scroll_depth', scroll_percentage: pct, page_path: window.location.pathname });
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ─── CTA Click Tracking ───────────────────────────────────────────────────
  function initCTATracking() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a, button');
      if (!el) return;

      var text = (el.innerText || el.textContent || '').trim();
      var href = el.href || '';

      // Book a Demo clicks
      if (/book.?a.?demo/i.test(text) || /#demo/.test(href) || /contact\.html/.test(href)) {
        push({ event: 'cta_click', cta_text: text, cta_location: window.location.pathname, destination: href });
      }

      // Outbound links
      if (href && !href.includes('elitedentalforce.com') && !href.startsWith('#') && !href.startsWith('mailto') && !href.startsWith('tel')) {
        push({ event: 'outbound_link', link_url: href, link_text: text, page_path: window.location.pathname });
      }

      // Mailto clicks
      if (href && href.startsWith('mailto:')) {
        push({ event: 'email_click', email_address: href.replace('mailto:', ''), page_path: window.location.pathname });
      }

      // Phone clicks
      if (href && href.startsWith('tel:')) {
        push({ event: 'phone_click', phone_number: href.replace('tel:', ''), page_path: window.location.pathname });
      }
    });
  }

  // ─── Form Engagement Tracking ─────────────────────────────────────────────
  function initFormTracking() {
    // Track first field interaction (form engagement started)
    document.querySelectorAll('form input, form select, form textarea').forEach(function (field) {
      var tracked = false;
      field.addEventListener('focus', function () {
        if (tracked) return;
        tracked = true;
        var form = field.closest('form');
        push({
          event: 'form_start',
          form_id: form ? (form.id || 'unknown') : 'unknown',
          field_name: field.name || field.id,
          page_path: window.location.pathname
        });
      }, { once: false });
    });
  }

  // ─── Navigation Link Tracking ─────────────────────────────────────────────
  function initNavTracking() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    nav.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      push({
        event: 'nav_click',
        nav_text: (link.innerText || '').trim(),
        nav_href: link.href,
        page_path: window.location.pathname
      });
    });
  }

  // ─── Time on Page ──────────────────────────────────────────────────────────
  function initTimeOnPage() {
    var start = Date.now();
    var milestones = [30, 60, 120, 180];
    var fired = {};
    setInterval(function () {
      var seconds = Math.floor((Date.now() - start) / 1000);
      milestones.forEach(function (s) {
        if (!fired[s] && seconds >= s) {
          fired[s] = true;
          push({ event: 'time_on_page', seconds_on_page: s, page_path: window.location.pathname });
        }
      });
    }, 5000);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  if (GTM_ID !== 'GTM-MQJKZLMC') {
    installGTM(GTM_ID);
  } else {
    console.warn('[EDF Tracking] Replace GTM_CONTAINER_ID in js/tracking.js with your actual GTM ID.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initScrollDepth();
      initCTATracking();
      initFormTracking();
      initNavTracking();
      initTimeOnPage();
    });
  } else {
    initScrollDepth();
    initCTATracking();
    initFormTracking();
    initNavTracking();
    initTimeOnPage();
  }
})();
