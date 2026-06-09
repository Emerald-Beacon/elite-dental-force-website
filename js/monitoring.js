/**
 * Elite Dental Force — Error Monitoring (Wave 4C)
 *
 * Loads Sentry Browser SDK when window.EDF_SENTRY_DSN is set.
 * To activate: add the following to the <head> of any page (or all pages):
 *
 *   <script>window.EDF_SENTRY_DSN = "https://YOUR_KEY@oXXXX.ingest.sentry.io/XXXX";</script>
 *
 * The DSN can be set per-environment without code changes.
 * ghl-forms.js and booking-modal.js call window.Sentry.captureException when available.
 */
(function () {
  "use strict";

  var dsn = window.EDF_SENTRY_DSN;
  if (!dsn) return;

  var script = document.createElement("script");
  script.src =
    "https://browser.sentry-cdn.com/7.120.3/bundle.tracing.min.js";
  script.crossOrigin = "anonymous";
  script.onload = function () {
    if (!window.Sentry) return;
    window.Sentry.init({
      dsn: dsn,
      environment: window.location.hostname.includes("localhost")
        ? "development"
        : "production",
      tracesSampleRate: 0.1,
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection",
        "NetworkError",
      ],
      beforeSend: function (event) {
        /* Strip any PHI-adjacent fields from extra data */
        if (event.extra) {
          delete event.extra.email;
          delete event.extra.phone;
          delete event.extra.name;
        }
        return event;
      },
    });
  };
  document.head.appendChild(script);
})();
