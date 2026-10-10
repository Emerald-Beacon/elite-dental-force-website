/**
 * Elite Dental Force: GDPR Cookie Consent
 * Self-contained. Stores preference in localStorage.
 * Blocks GTM until consent is given.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'edf_cookie_consent';
  var PRIVACY_URL = (function () {
    var path = window.location.pathname;
    var depth = (path.match(/\//g) || []).length - 1;
    var prefix = Array(depth).fill('..').join('/');
    return (prefix ? prefix + '/' : '') + 'pages/privacy.html';
  })();

  var existing = null;
  try { existing = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (existing === 'accepted' || existing === 'declined') {
    if (existing === 'accepted') fireConsent();
    return;
  }

  function fireConsent() {
    if (window.dataLayer) {
      window.dataLayer.push({ event: 'cookie_consent_accepted' });
    }
  }

  var css = document.createElement('style');
  css.textContent = `
    #edf-cookie-banner {
      position: fixed;
      left: 16px;
      bottom: 16px;
      z-index: 99999;
      width: calc(100% - 32px);
      max-width: 420px;
      box-sizing: border-box;
      background: rgba(3, 10, 30, 0.97);
      border: 1px solid rgba(75, 168, 240, 0.22);
      border-radius: 12px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
      padding: 10px 12px 10px 16px;
      transform: translateY(calc(100% + 24px));
      transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #edf-cookie-banner.edf-cb-visible {
      transform: translateY(0);
    }
    .edf-cb-inner {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .edf-cb-body {
      flex: 1;
      min-width: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 12.5px;
      color: rgba(200, 222, 240, 0.9);
      line-height: 1.4;
      margin: 0;
    }
    .edf-cb-body a {
      color: #4ba8f0;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .edf-cb-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .edf-cb-btn {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 12.5px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      line-height: 1;
    }
    .edf-cb-btn--accept {
      background: linear-gradient(135deg, #095ba7, #4ba8f0);
      border: none;
      color: #fff;
    }
    .edf-cb-btn--accept:hover {
      box-shadow: 0 4px 14px rgba(75, 168, 240, 0.4);
    }
    .edf-cb-btn--decline {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: rgba(200, 222, 240, 0.85);
    }
    .edf-cb-btn--decline:hover {
      border-color: rgba(255, 255, 255, 0.3);
      color: #f0f7ff;
    }
    @media (max-width: 640px) {
      #edf-cookie-banner {
        left: 0;
        bottom: 0;
        width: 100%;
        max-width: none;
        border-radius: 0;
        border-width: 1px 0 0;
        padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
      }
      .edf-cb-btn { padding: 8px 12px; }
    }
    html.edf-cb-open #edf-chat-btn {
      translate: 0 calc(-1 * var(--edf-cb-h, 60px) - 4px);
    }
  `;
  document.head.appendChild(css);

  function buildBanner() {
    var banner = document.createElement('div');
    banner.id = 'edf-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie consent');

    banner.innerHTML = `
      <div class="edf-cb-inner">
        <p class="edf-cb-body">We use cookies for analytics. See our <a href="${PRIVACY_URL}">Privacy Policy</a>.</p>
        <div class="edf-cb-actions">
          <button class="edf-cb-btn edf-cb-btn--accept" id="edf-cb-accept">Accept</button>
          <button class="edf-cb-btn edf-cb-btn--decline" id="edf-cb-decline">Decline</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    // translate, not bottom, so lifting the chat bubble never counts as a layout shift
    document.documentElement.style.setProperty('--edf-cb-h', banner.offsetHeight + 'px');
    document.documentElement.classList.add('edf-cb-open');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('edf-cb-visible');
      });
    });

    function dismiss(choice) {
      try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) {}
      banner.style.transform = 'translateY(calc(100% + 24px))';
      banner.style.transition = 'transform 0.35s ease';
      document.documentElement.classList.remove('edf-cb-open');
      setTimeout(function () { banner.remove(); }, 400);
      if (choice === 'accepted') fireConsent();
    }

    document.getElementById('edf-cb-accept').addEventListener('click', function () {
      dismiss('accepted');
    });
    document.getElementById('edf-cb-decline').addEventListener('click', function () {
      dismiss('declined');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildBanner);
  } else {
    buildBanner();
  }
})();
