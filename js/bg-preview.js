// ponytail: preview-only switch; ?bg=a|b|c&light=1, remembered per tab via sessionStorage.
(function () {
  var q = new URLSearchParams(location.search), bg = q.get('bg'), light = q.get('light'), s = null;
  try { s = window.sessionStorage; } catch (e) {}
  try {
    if (bg || light !== null) {
      if (s) { s.setItem('edfBg', bg || 'a'); s.setItem('edfLight', light === '1' ? '1' : '0'); }
    } else if (s) { bg = s.getItem('edfBg'); light = s.getItem('edfLight'); }
  } catch (e) {}
  var h = document.documentElement;
  h.setAttribute('data-bg', /^[abc]$/.test(bg || '') ? bg : 'a');
  if (light === '1') h.setAttribute('data-light', '1');
})();
