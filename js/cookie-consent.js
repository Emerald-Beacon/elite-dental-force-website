/**
 * Elite Dental Force — GDPR Cookie Consent
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

  var existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
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
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      background: rgba(3, 10, 30, 0.97);
      border-top: 1px solid rgba(75, 168, 240, 0.22);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
      padding: 20px 24px;
      transform: translateY(100%);
      transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #edf-cookie-banner.edf-cb-visible {
      transform: translateY(0);
    }
    .edf-cb-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .edf-cb-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(75, 168, 240, 0.1);
      border: 1px solid rgba(75, 168, 240, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #4ba8f0;
    }
    .edf-cb-text {
      flex: 1;
      min-width: 260px;
    }
    .edf-cb-title {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #f0f7ff;
      margin: 0 0 4px;
    }
    .edf-cb-body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 12.5px;
      color: rgba(133, 184, 216, 0.82);
      line-height: 1.55;
      margin: 0;
    }
    .edf-cb-body a {
      color: #4ba8f0;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .edf-cb-actions {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .edf-cb-btn {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 700;
      padding: 9px 20px;
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
      box-shadow: 0 4px 14px rgba(75, 168, 240, 0.3);
    }
    .edf-cb-btn--accept:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(75, 168, 240, 0.4);
    }
    .edf-cb-btn--decline {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(133, 184, 216, 0.75);
    }
    .edf-cb-btn--decline:hover {
      border-color: rgba(255, 255, 255, 0.22);
      color: #f0f7ff;
    }
    .edf-cb-btn--settings {
      background: transparent;
      border: 1px solid rgba(75, 168, 240, 0.28);
      color: #4ba8f0;
    }
    .edf-cb-btn--settings:hover {
      background: rgba(75, 168, 240, 0.08);
    }
    @media (max-width: 640px) {
      .edf-cb-inner { flex-direction: column; align-items: flex-start; }
      .edf-cb-actions { width: 100%; }
      .edf-cb-btn { flex: 1; text-align: center; }
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
        <div class="edf-cb-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <div class="edf-cb-text">
          <p class="edf-cb-title">We value your privacy</p>
          <p class="edf-cb-body">
            This website stores cookies on your computer to collect information about how you interact with our website and allow us to remember you. We use this information to improve your browsing experience and for analytics about our visitors both on this website and other media. To find out more about the cookies we use, see our <a href="${PRIVACY_URL}">Privacy Policy</a>.
          </p>
        </div>
        <div class="edf-cb-actions">
          <button class="edf-cb-btn edf-cb-btn--accept" id="edf-cb-accept">Accept All Cookies</button>
          <button class="edf-cb-btn edf-cb-btn--decline" id="edf-cb-decline">Decline</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('edf-cb-visible');
      });
    });

    function dismiss(choice) {
      localStorage.setItem(STORAGE_KEY, choice);
      banner.style.transform = 'translateY(100%)';
      banner.style.transition = 'transform 0.35s ease';
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
