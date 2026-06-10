/**
 * Elite Dental Force — Booking Pre-Capture Modal (Wave 1C)
 *
 * Intercepts all clicks on booking calendar links and shows a lightweight
 * 2-field lead capture modal before opening the calendar. Fires on every
 * page sitewide via a single script tag.
 *
 * On successful form submission: POSTs the lead to the same-origin
 * GHL capture function, then opens the booking URL in a new tab.
 */
(function () {
  "use strict";

  var BOOKING_HOST = "api.leadconnectorhq.com/widget/bookings/";
  var WEBHOOK_URL = "/.netlify/functions/ghl-lead";

  var modalOpen = false;

  function getUtmFields() {
    try {
      var raw = sessionStorage.getItem("edf_utm");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function push(obj) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(obj);
  }

  function buildModal(bookingUrl) {
    if (modalOpen) return;
    modalOpen = true;

    /* ── Overlay ─────────────────────────────────────────────────────── */
    var overlay = document.createElement("div");
    overlay.id = "edf-bm-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Book a consultation");

    /* ── Card ────────────────────────────────────────────────────────── */
    var card = document.createElement("div");
    card.id = "edf-bm-card";

    /* ── Close button ────────────────────────────────────────────────── */
    var closeBtn = document.createElement("button");
    closeBtn.id = "edf-bm-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "×";

    /* ── Header ──────────────────────────────────────────────────────── */
    var icon = document.createElement("div");
    icon.id = "edf-bm-icon";
    var iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("width", "24");
    iconSvg.setAttribute("height", "24");
    iconSvg.setAttribute("viewBox", "0 0 24 24");
    iconSvg.setAttribute("fill", "none");
    iconSvg.setAttribute("stroke", "currentColor");
    iconSvg.setAttribute("stroke-width", "2");
    var calPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    calPath.setAttribute("x", "3");
    calPath.setAttribute("y", "4");
    calPath.setAttribute("width", "18");
    calPath.setAttribute("height", "18");
    calPath.setAttribute("rx", "2");
    calPath.setAttribute("ry", "2");
    var calLine1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    calLine1.setAttribute("x1", "16");
    calLine1.setAttribute("y1", "2");
    calLine1.setAttribute("x2", "16");
    calLine1.setAttribute("y2", "6");
    var calLine2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    calLine2.setAttribute("x1", "8");
    calLine2.setAttribute("y1", "2");
    calLine2.setAttribute("x2", "8");
    calLine2.setAttribute("y2", "6");
    var calLine3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    calLine3.setAttribute("x1", "3");
    calLine3.setAttribute("y1", "10");
    calLine3.setAttribute("x2", "21");
    calLine3.setAttribute("y2", "10");
    iconSvg.appendChild(calPath);
    iconSvg.appendChild(calLine1);
    iconSvg.appendChild(calLine2);
    iconSvg.appendChild(calLine3);
    icon.appendChild(iconSvg);

    var h2 = document.createElement("h2");
    h2.id = "edf-bm-title";
    h2.textContent = "Book Your Free Consultation";

    var sub = document.createElement("p");
    sub.id = "edf-bm-sub";
    sub.textContent =
      "Where should we send the confirmation? We will hold your spot.";

    /* ── Form ────────────────────────────────────────────────────────── */
    var form = document.createElement("form");
    form.id = "edf-bm-form";
    form.setAttribute("novalidate", "");

    var nameGroup = document.createElement("div");
    nameGroup.className = "edf-bm-group";
    var nameLabel = document.createElement("label");
    nameLabel.setAttribute("for", "edf-bm-name");
    nameLabel.textContent = "Your Name";
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "edf-bm-name";
    nameInput.placeholder = "First and last name";
    nameInput.required = true;
    nameInput.autocomplete = "name";
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    var emailGroup = document.createElement("div");
    emailGroup.className = "edf-bm-group";
    var emailLabel = document.createElement("label");
    emailLabel.setAttribute("for", "edf-bm-email");
    emailLabel.textContent = "Work Email";
    var emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.id = "edf-bm-email";
    emailInput.placeholder = "you@yourpractice.com";
    emailInput.required = true;
    emailInput.autocomplete = "email";
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    var errMsg = document.createElement("p");
    errMsg.id = "edf-bm-error";
    errMsg.setAttribute("aria-live", "polite");

    var submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.id = "edf-bm-submit";
    submitBtn.textContent = "Reserve My Spot →";

    var skipLink = document.createElement("a");
    skipLink.id = "edf-bm-skip";
    skipLink.href = bookingUrl;
    skipLink.target = "_blank";
    skipLink.rel = "noopener noreferrer";
    skipLink.textContent = "Skip to calendar without saving my spot";

    form.appendChild(nameGroup);
    form.appendChild(emailGroup);
    form.appendChild(errMsg);
    form.appendChild(submitBtn);

    card.appendChild(closeBtn);
    card.appendChild(icon);
    card.appendChild(h2);
    card.appendChild(sub);
    card.appendChild(form);
    card.appendChild(skipLink);
    overlay.appendChild(card);

    /* ── Styles ──────────────────────────────────────────────────────── */
    var css = document.createElement("style");
    css.id = "edf-bm-styles";
    css.textContent = [
      "#edf-bm-overlay{position:fixed;inset:0;z-index:100000;background:rgba(1,8,24,0.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .25s ease}",
      "#edf-bm-overlay.edf-bm-in{opacity:1}",
      "#edf-bm-card{position:relative;background:linear-gradient(145deg,#0a1628,#061020);border:1px solid rgba(75,168,240,.22);border-radius:20px;padding:40px;width:100%;max-width:440px;box-shadow:0 32px 80px rgba(0,0,0,.65),0 0 0 1px rgba(75,168,240,.08)}",
      "#edf-bm-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:rgba(255,255,255,.55);font-size:1.1rem;line-height:1;width:32px;height:32px;cursor:pointer;transition:all .2s}",
      "#edf-bm-close:hover{background:rgba(255,255,255,.12);color:#fff}",
      "#edf-bm-icon{width:52px;height:52px;border-radius:14px;background:rgba(75,168,240,.12);border:1px solid rgba(75,168,240,.28);display:flex;align-items:center;justify-content:center;color:#4ba8f0;margin-bottom:18px}",
      "#edf-bm-title{font-size:1.4rem;font-weight:800;color:#fff;line-height:1.2;margin:0 0 8px}",
      "#edf-bm-sub{font-size:.88rem;color:rgba(133,184,216,.75);margin:0 0 24px;line-height:1.55}",
      ".edf-bm-group{margin-bottom:14px}",
      ".edf-bm-group label{display:block;font-size:.78rem;font-weight:700;color:rgba(133,184,216,.85);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}",
      ".edf-bm-group input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(75,168,240,.18);border-radius:10px;padding:11px 14px;color:#fff;font-size:.95rem;font-family:inherit;outline:none;transition:border-color .2s;box-sizing:border-box}",
      ".edf-bm-group input:focus{border-color:rgba(75,168,240,.55);background:rgba(75,168,240,.05)}",
      ".edf-bm-group input::placeholder{color:rgba(255,255,255,.25)}",
      "#edf-bm-error{font-size:.82rem;color:#f87171;min-height:18px;margin:4px 0 10px}",
      "#edf-bm-submit{width:100%;padding:13px;background:linear-gradient(135deg,#095ba7,#4ba8f0);border:none;border-radius:12px;color:#fff;font-size:.95rem;font-weight:700;font-family:inherit;cursor:pointer;transition:opacity .2s,transform .2s;margin-top:4px}",
      "#edf-bm-submit:hover{opacity:.9;transform:translateY(-1px)}",
      "#edf-bm-submit:disabled{opacity:.55;cursor:not-allowed;transform:none}",
      "#edf-bm-skip{display:block;text-align:center;margin-top:14px;font-size:.78rem;color:rgba(133,184,216,.5);text-decoration:none}",
      "#edf-bm-skip:hover{color:rgba(133,184,216,.8);text-decoration:underline}",
    ].join("");
    document.head.appendChild(css);

    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("edf-bm-in");
        nameInput.focus();
      });
    });

    /* ── Dismiss ─────────────────────────────────────────────────────── */
    function dismiss() {
      overlay.classList.remove("edf-bm-in");
      overlay.style.opacity = "0";
      setTimeout(function () {
        overlay.remove();
        var styleEl = document.getElementById("edf-bm-styles");
        if (styleEl) styleEl.remove();
        modalOpen = false;
      }, 260);
    }

    closeBtn.addEventListener("click", dismiss);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) dismiss();
    });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") {
        dismiss();
        document.removeEventListener("keydown", onKey);
      }
    });

    /* ── Submit ──────────────────────────────────────────────────────── */
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      errMsg.textContent = "";

      if (!name) {
        errMsg.textContent = "Please enter your name.";
        nameInput.focus();
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errMsg.textContent = "Please enter a valid email address.";
        emailInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Reserving your spot…";

      var nameParts = name.split(/\s+/);
      var utm = getUtmFields();
      var payload = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: email,
        source: "Website — Booking Modal",
        sourceUrl: window.location.href,
        tags: ["source-website", "booking-modal", "pre-booking-capture"],
        customFields: Object.assign({}, utm, {
          bookingPage: bookingUrl,
        }),
      };

      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function () {
          push({
            event: "booking_modal_submit",
            lead_email: email,
            page_path: window.location.pathname,
            conversion: true,
          });
          window.open(bookingUrl, "_blank", "noopener,noreferrer");
          dismiss();
        })
        .catch(function (err) {
          console.error("[EDF BM] Submission error:", err);
          if (window.Sentry) {
            window.Sentry.captureException(err, {
              extra: { form: "booking-modal", page: window.location.pathname },
            });
          }
          submitBtn.disabled = false;
          submitBtn.textContent = "Reserve My Spot →";
          errMsg.textContent =
            "Something went wrong. Use the link below to book directly.";
        });
    });

    /* ── Skip link also dismisses modal ─────────────────────────────── */
    skipLink.addEventListener("click", function () {
      setTimeout(dismiss, 100);
    });
  }

  /* ── Global click intercept ──────────────────────────────────────────── */
  document.addEventListener(
    "click",
    function (e) {
      var el = e.target.closest("a");
      if (!el) return;
      if (!el.href) return;
      if (el.href.indexOf(BOOKING_HOST) === -1) return;
      /* Skip links that are already inside a form or the skip link itself */
      if (el.id === "edf-bm-skip") return;
      if (el.closest("form")) return;
      /* Skip links where target is _self inside the demo page iframe area */
      if (el.closest(".booking-calendar-wrap")) return;
      e.preventDefault();
      buildModal(el.href);
    },
    true,
  );
})();
