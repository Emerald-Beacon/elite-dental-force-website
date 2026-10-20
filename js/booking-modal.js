/* Booking pre-capture modal retired (Alvin choice, W9): booking links open the EDF booking page
   directly, and that page asks for the visitor's details itself. Campaign tags (utm_*) from the page
   the visitor landed on ride along, so the booking records where the visitor came from. */
(function () {
  "use strict";

  var BOOKING_HOST = "marketing.elitedentalforce.com/book/";
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  function remembered() {
    try {
      var stored = JSON.parse(sessionStorage.getItem("edf_utm") || "{}");
      var here = new URLSearchParams(window.location.search);
      KEYS.forEach(function (k) {
        if (here.get(k)) stored[k] = here.get(k).slice(0, 200);
      });
      sessionStorage.setItem("edf_utm", JSON.stringify(stored));
      return stored;
    } catch (e) {
      return {};
    }
  }

  var utm = remembered();

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target.closest && e.target.closest("a");
      if (!el || !el.href || el.href.indexOf(BOOKING_HOST) === -1) return;
      var url = new URL(el.href);
      KEYS.forEach(function (k) {
        if (utm[k] && !url.searchParams.get(k)) url.searchParams.set(k, utm[k]);
      });
      el.href = url.toString();
    },
    true,
  );
})();
