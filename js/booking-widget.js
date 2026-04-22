/**
 * Elite Dental Force — Branded Chat Widget
 * Self-contained: injects own CSS + HTML, zero dependencies
 * Floating circle button → chat panel with team branding
 */
(function () {
  'use strict';

  /* ── Derive base path from this script's own src ── */
  var scripts = document.querySelectorAll('script[src*="booking-widget"]');
  var scriptSrc = (scripts[scripts.length - 1] || {}).src || '';
  var BASE = scriptSrc ? scriptSrc.replace(/js\/booking-widget\.js.*$/, '') : '/';
  var LOGO_URL    = BASE + 'images/edf-icon-logo.png';
  var TEAM_CAL    = 'https://b.elitedentalforce.com/widget/bookings/outsource-edf-30mins-consultation/edf-team';
  var FOUNDER_CAL = 'https://b.elitedentalforce.com/widget/bookings/elitedentalforce';

  var AUTO_REPLIES = {
    revenue: "Most dental practices lose 12–18% of collectible revenue to billing errors and unchecked denials. We can show you exactly how much your practice is leaving on the table — sometimes $50K+ per year. Want to see a quick demo?",
    demo:    "Absolutely! You can book a 30-min session with our team or sit down directly with our founder Alvin. Which works better for you?",
    edifi:   "EDiFi is our AI-powered revenue intelligence platform — it handles real-time eligibility, clean-claim submission, payment audits, and more in one system. A 30-min demo is the fastest way to see it in action.",
    default: "Thanks for reaching out! One of our team members will get back to you shortly. In the meantime, feel free to book a demo and we'll walk you through everything."
  };

  /* ════════════════════════════════════════
     STYLES
  ════════════════════════════════════════ */
  var css = document.createElement('style');
  css.textContent = `
    /* ── Floating chat button ── */
    #edf-chat-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9998;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #001f71 0%, #095ba7 100%);
      border: 2px solid rgba(75,168,240,0.5);
      box-shadow:
        0 8px 28px rgba(0,0,0,0.5),
        0 0 0 1px rgba(75,168,240,0.1),
        0 0 32px rgba(75,168,240,0.22);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: edf-chat-rise 0.55s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 1.2s;
      transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease;
      -webkit-tap-highlight-color: transparent;
      position: fixed;
    }
    #edf-chat-btn:hover {
      transform: scale(1.08);
      box-shadow:
        0 12px 40px rgba(0,0,0,0.6),
        0 0 0 1px rgba(75,168,240,0.2),
        0 0 50px rgba(75,168,240,0.32);
    }
    #edf-chat-btn:active { transform: scale(0.97); }
    @keyframes edf-chat-rise {
      from { opacity: 0; transform: scale(0.5) translateY(16px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ── Logo image — main button face ── */
    .edf-btn-logo {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 50%;
      pointer-events: none;
      flex-shrink: 0;
      display: block;
    }

    /* ── Online indicator dot on button ── */
    .edf-btn-online {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid #020917;
      box-shadow: 0 0 8px rgba(34,197,94,0.7);
      animation: edf-online-pulse 2.5s ease-in-out infinite;
    }
    @keyframes edf-online-pulse {
      0%,100% { box-shadow: 0 0 8px rgba(34,197,94,0.7); }
      50%      { box-shadow: 0 0 16px rgba(34,197,94,0.4); }
    }

    /* ── Unread badge ── */
    .edf-unread-badge {
      position: absolute;
      top: -4px;
      left: -4px;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      background: #ef4444;
      border: 2px solid #020917;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      opacity: 0;
      transform: scale(0.6);
      transition: opacity 0.3s, transform 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .edf-unread-badge.edf-visible {
      opacity: 1;
      transform: scale(1);
    }

    /* ── Chat panel ── */
    #edf-chat-panel {
      position: fixed;
      bottom: 100px;
      right: 28px;
      z-index: 9999;
      width: 360px;
      max-height: 560px;
      background: #030d22;
      border: 1px solid rgba(75,168,240,0.22);
      border-radius: 20px;
      box-shadow:
        0 32px 80px rgba(0,0,0,0.65),
        0 0 0 1px rgba(75,168,240,0.07),
        0 0 60px rgba(75,168,240,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: scale(0.92) translateY(18px);
      transform-origin: bottom right;
      transition:
        opacity 0.3s ease,
        transform 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    #edf-chat-panel.edf-open {
      opacity: 1;
      pointer-events: all;
      transform: scale(1) translateY(0);
    }
    #edf-chat-panel::before {
      content: '';
      height: 2px;
      flex-shrink: 0;
      background: linear-gradient(90deg, transparent, #4ba8f0, #3454f8, transparent);
    }

    /* ── Panel header ── */
    #edf-panel-header {
      background: linear-gradient(135deg, #001550 0%, #001f71 60%, #032a8c 100%);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(75,168,240,0.15);
    }
    .edf-header-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(75,168,240,0.15);
      border: 2px solid rgba(75,168,240,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }
    .edf-header-avatar img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      border-radius: 50%;
    }
    .edf-header-avatar-text {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 800;
      color: #fff;
    }
    .edf-header-online-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid #001f71;
    }
    .edf-header-info { flex: 1; min-width: 0; }
    .edf-header-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #f0f7ff;
      margin: 0 0 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .edf-header-status {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      color: rgba(133,184,216,0.75);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .edf-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
    }
    #edf-panel-close {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: rgba(133,184,216,0.7);
      flex-shrink: 0;
      transition: background 0.2s, color 0.2s;
    }
    #edf-panel-close:hover { background: rgba(255,255,255,0.12); color: #f0f7ff; }

    /* ── Messages area ── */
    #edf-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scrollbar-width: thin;
      scrollbar-color: rgba(75,168,240,0.2) transparent;
    }
    #edf-messages::-webkit-scrollbar { width: 4px; }
    #edf-messages::-webkit-scrollbar-track { background: transparent; }
    #edf-messages::-webkit-scrollbar-thumb { background: rgba(75,168,240,0.2); border-radius: 4px; }

    /* ── Message rows ── */
    .edf-msg-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .edf-msg-row--team { justify-content: flex-start; }
    .edf-msg-row--user { justify-content: flex-end; }

    /* ── Team avatar (small) ── */
    .edf-msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(75,168,240,0.12);
      border: 1px solid rgba(75,168,240,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .edf-msg-avatar img {
      width: 22px;
      height: 22px;
      object-fit: contain;
      border-radius: 50%;
    }
    .edf-msg-avatar-text {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9px;
      font-weight: 800;
      color: #4ba8f0;
    }

    /* ── Bubble ── */
    .edf-bubble {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 16px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13.5px;
      line-height: 1.55;
    }
    .edf-bubble--team {
      background: rgba(75,168,240,0.1);
      border: 1px solid rgba(75,168,240,0.18);
      color: rgba(240,247,255,0.9);
      border-bottom-left-radius: 4px;
    }
    .edf-bubble--user {
      background: linear-gradient(135deg, #095ba7, #001f71);
      border: 1px solid rgba(75,168,240,0.3);
      color: #f0f7ff;
      border-bottom-right-radius: 4px;
    }
    .edf-bubble-time {
      font-size: 10px;
      color: rgba(133,184,216,0.45);
      margin-top: 4px;
      text-align: right;
    }
    .edf-bubble--team + .edf-bubble-time { text-align: left; }

    /* ── Quick reply chips ── */
    .edf-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 14px 2px 50px;
    }
    .edf-chip {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: #4ba8f0;
      background: rgba(75,168,240,0.08);
      border: 1px solid rgba(75,168,240,0.28);
      border-radius: 50px;
      padding: 5px 13px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }
    .edf-chip:hover {
      background: rgba(75,168,240,0.18);
      border-color: rgba(75,168,240,0.5);
      color: #f0f7ff;
    }

    /* ── Typing indicator ── */
    .edf-typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 10px 14px;
    }
    .edf-typing span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: rgba(75,168,240,0.5);
      animation: edf-bounce 1.2s ease-in-out infinite;
    }
    .edf-typing span:nth-child(2) { animation-delay: 0.2s; }
    .edf-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes edf-bounce {
      0%,60%,100% { transform: translateY(0); opacity: 0.5; }
      30%          { transform: translateY(-6px); opacity: 1; }
    }

    /* ── CTA inside message ── */
    .edf-msg-cta-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .edf-msg-cta {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 14px;
      border-radius: 50px;
      text-decoration: none;
      transition: background 0.2s, border-color 0.2s;
      cursor: pointer;
      border: 1px solid;
    }
    .edf-msg-cta--blue {
      background: rgba(75,168,240,0.15);
      border-color: rgba(75,168,240,0.4);
      color: #4ba8f0;
    }
    .edf-msg-cta--blue:hover { background: rgba(75,168,240,0.25); }
    .edf-msg-cta--gold {
      background: rgba(255,215,0,0.08);
      border-color: rgba(255,215,0,0.35);
      color: #ffd700;
    }
    .edf-msg-cta--gold:hover { background: rgba(255,215,0,0.15); }

    /* ── Email capture ── */
    #edf-email-capture {
      padding: 12px 14px;
      border-top: 1px solid rgba(75,168,240,0.1);
      flex-shrink: 0;
      display: none;
    }
    #edf-email-capture p {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      color: rgba(133,184,216,0.8);
      margin: 0 0 8px;
    }
    .edf-email-row {
      display: flex;
      gap: 8px;
    }
    .edf-email-input {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(75,168,240,0.22);
      border-radius: 10px;
      padding: 8px 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      color: #f0f7ff;
      outline: none;
      transition: border-color 0.2s;
    }
    .edf-email-input::placeholder { color: rgba(133,184,216,0.4); }
    .edf-email-input:focus { border-color: rgba(75,168,240,0.5); }
    .edf-email-submit {
      background: rgba(75,168,240,0.15);
      border: 1px solid rgba(75,168,240,0.35);
      border-radius: 10px;
      padding: 8px 14px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #4ba8f0;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .edf-email-submit:hover { background: rgba(75,168,240,0.25); }

    /* ── Input bar ── */
    #edf-input-bar {
      padding: 12px 14px;
      border-top: 1px solid rgba(75,168,240,0.1);
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
    }
    #edf-msg-input {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(75,168,240,0.22);
      border-radius: 12px;
      padding: 10px 14px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13.5px;
      color: #f0f7ff;
      outline: none;
      resize: none;
      min-height: 40px;
      max-height: 100px;
      line-height: 1.4;
      transition: border-color 0.2s;
    }
    #edf-msg-input::placeholder { color: rgba(133,184,216,0.4); }
    #edf-msg-input:focus { border-color: rgba(75,168,240,0.5); }
    #edf-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #095ba7, #001f71);
      border: 1px solid rgba(75,168,240,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #f0f7ff;
      flex-shrink: 0;
      transition: background 0.2s, transform 0.15s;
    }
    #edf-send-btn:hover { background: linear-gradient(135deg, #4ba8f0, #095ba7); transform: scale(1.05); }
    #edf-send-btn:active { transform: scale(0.96); }

    /* ── Responsive ── */
    @media (max-width: 420px) {
      #edf-chat-panel { width: calc(100vw - 24px); right: 12px; bottom: 90px; }
      #edf-chat-btn { bottom: 18px; right: 14px; }
    }
  `;
  document.head.appendChild(css);

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */
  function now() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
  }

  function makeAvatar(large) {
    var sz = large ? 42 : 28;
    var imgSz = large ? 36 : 22;
    var el = document.createElement('div');
    el.className = large ? 'edf-header-avatar' : 'edf-msg-avatar';
    var img = document.createElement('img');
    img.src = LOGO_URL;
    img.style.cssText = 'width:' + imgSz + 'px;height:' + imgSz + 'px;object-fit:contain;border-radius:50%;';
    img.onerror = function () {
      el.removeChild(img);
      var txt = document.createElement('span');
      txt.className = large ? 'edf-header-avatar-text' : 'edf-msg-avatar-text';
      txt.textContent = 'EDF';
      el.appendChild(txt);
    };
    el.appendChild(img);
    if (large) {
      var dot = document.createElement('div');
      dot.className = 'edf-header-online-dot';
      el.appendChild(dot);
    }
    return el;
  }

  function scrollBottom() {
    var msgs = document.getElementById('edf-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── Add a team message bubble ── */
  function addTeamMsg(html, showChips, chipsData) {
    var msgs = document.getElementById('edf-messages');

    var row = document.createElement('div');
    row.className = 'edf-msg-row edf-msg-row--team';
    row.appendChild(makeAvatar(false));

    var col = document.createElement('div');
    var bubble = document.createElement('div');
    bubble.className = 'edf-bubble edf-bubble--team';
    bubble.innerHTML = html;
    var timeEl = document.createElement('div');
    timeEl.className = 'edf-bubble-time';
    timeEl.textContent = now();
    col.appendChild(bubble);
    col.appendChild(timeEl);
    row.appendChild(col);
    msgs.appendChild(row);

    if (showChips && chipsData) {
      var chips = document.createElement('div');
      chips.className = 'edf-chips';
      chipsData.forEach(function (c) {
        var chip = document.createElement('button');
        chip.className = 'edf-chip';
        chip.textContent = c.label;
        chip.addEventListener('click', function () {
          chips.remove();
          handleChip(c.key, c.label);
        });
        chips.appendChild(chip);
      });
      msgs.appendChild(chips);
    }

    scrollBottom();
  }

  /* ── Add user message bubble ── */
  function addUserMsg(text) {
    var msgs = document.getElementById('edf-messages');
    var row = document.createElement('div');
    row.className = 'edf-msg-row edf-msg-row--user';
    var col = document.createElement('div');
    var bubble = document.createElement('div');
    bubble.className = 'edf-bubble edf-bubble--user';
    bubble.textContent = text;
    var timeEl = document.createElement('div');
    timeEl.className = 'edf-bubble-time';
    timeEl.textContent = now();
    col.appendChild(bubble);
    col.appendChild(timeEl);
    row.appendChild(col);
    msgs.appendChild(row);
    scrollBottom();
  }

  /* ── Typing indicator ── */
  function showTyping(cb, delay) {
    var msgs = document.getElementById('edf-messages');
    var row = document.createElement('div');
    row.className = 'edf-msg-row edf-msg-row--team';
    row.id = 'edf-typing-indicator';
    row.appendChild(makeAvatar(false));
    var bubble = document.createElement('div');
    bubble.className = 'edf-bubble edf-bubble--team edf-typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    row.appendChild(bubble);
    msgs.appendChild(row);
    scrollBottom();
    setTimeout(function () {
      var ind = document.getElementById('edf-typing-indicator');
      if (ind) ind.remove();
      cb();
      scrollBottom();
    }, delay || 1600);
  }

  /* ── Handle chip/quick reply ── */
  var hasAskedEmail = false;
  var conversationLog = [];

  function handleChip(key, label) {
    addUserMsg(label);
    conversationLog.push({ role: 'user', text: label });

    showTyping(function () {
      var replyHtml = '';
      if (key === 'revenue') {
        replyHtml = AUTO_REPLIES.revenue + '<div class="edf-msg-cta-row"><a href="' + TEAM_CAL + '" target="_blank" class="edf-msg-cta edf-msg-cta--blue">📅 Book a Free Demo</a></div>';
      } else if (key === 'demo') {
        replyHtml = AUTO_REPLIES.demo + '<div class="edf-msg-cta-row"><a href="' + TEAM_CAL + '" target="_blank" class="edf-msg-cta edf-msg-cta--blue">👥 Book with the Team</a><a href="' + FOUNDER_CAL + '" target="_blank" class="edf-msg-cta edf-msg-cta--gold">⭐ Book with Alvin</a></div>';
      } else if (key === 'edifi') {
        replyHtml = AUTO_REPLIES.edifi + '<div class="edf-msg-cta-row"><a href="' + TEAM_CAL + '" target="_blank" class="edf-msg-cta edf-msg-cta--blue">📅 See EDiFi in Action</a></div>';
      } else {
        replyHtml = AUTO_REPLIES.default + '<div class="edf-msg-cta-row"><a href="' + TEAM_CAL + '" target="_blank" class="edf-msg-cta edf-msg-cta--blue">📅 Book a Demo</a></div>';
      }
      addTeamMsg(replyHtml, false, null);
      maybeAskEmail();
    }, 1400);
  }

  function handleUserMessage(text) {
    if (!text.trim()) return;
    addUserMsg(text);
    conversationLog.push({ role: 'user', text: text });
    var input = document.getElementById('edf-msg-input');
    if (input) input.value = '';

    showTyping(function () {
      addTeamMsg(AUTO_REPLIES.default + '<div class="edf-msg-cta-row"><a href="' + TEAM_CAL + '" target="_blank" class="edf-msg-cta edf-msg-cta--blue">📅 Book a Demo</a></div>', false, null);
      maybeAskEmail();
    }, 1600);
  }

  function maybeAskEmail() {
    if (hasAskedEmail) return;
    hasAskedEmail = true;
    var capture = document.getElementById('edf-email-capture');
    if (capture) capture.style.display = '';
  }

  /* ════════════════════════════════════════
     BUILD DOM
  ════════════════════════════════════════ */
  function buildWidget() {

    /* ── Floating button ── */
    var btn = document.createElement('button');
    btn.id = 'edf-chat-btn';
    btn.setAttribute('aria-label', 'Chat with Elite Dental Force');

    /* EDF logo — main button face */
    var btnImg = document.createElement('img');
    btnImg.src = LOGO_URL;
    btnImg.alt = 'Elite Dental Force';
    btnImg.className = 'edf-btn-logo';
    btnImg.onerror = function () {
      btnImg.style.display = 'none';
      var txt = document.createElement('span');
      txt.style.cssText = 'font-family:\'Plus Jakarta Sans\',sans-serif;font-size:10px;font-weight:800;color:#fff;letter-spacing:0.03em;';
      txt.textContent = 'EDF';
      btn.insertBefore(txt, btn.firstChild);
    };
    btn.appendChild(btnImg);

    /* Online dot — bottom-right */
    var onlineDot = document.createElement('div');
    onlineDot.className = 'edf-btn-online';
    btn.appendChild(onlineDot);

    var badge = document.createElement('div');
    badge.className = 'edf-unread-badge';
    badge.id = 'edf-unread-badge';
    badge.textContent = '1';
    btn.appendChild(badge);

    /* ── Chat panel ── */
    var panel = document.createElement('div');
    panel.id = 'edf-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with Elite Dental Force');

    /* Header */
    var header = document.createElement('div');
    header.id = 'edf-panel-header';
    header.appendChild(makeAvatar(true));

    var info = document.createElement('div');
    info.className = 'edf-header-info';
    info.innerHTML = '<div class="edf-header-name">Elite Dental Force</div><div class="edf-header-status"><span class="edf-status-dot"></span> Online — Typically replies in minutes</div>';
    header.appendChild(info);

    var closeBtn = document.createElement('button');
    closeBtn.id = 'edf-panel-close';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    header.appendChild(closeBtn);
    panel.appendChild(header);

    /* Messages */
    var msgs = document.createElement('div');
    msgs.id = 'edf-messages';
    panel.appendChild(msgs);

    /* Email capture */
    var capture = document.createElement('div');
    capture.id = 'edf-email-capture';
    capture.innerHTML = `
      <p>What's your email so we can follow up?</p>
      <div class="edf-email-row">
        <input type="email" class="edf-email-input" id="edf-email-input" placeholder="you@practice.com">
        <button class="edf-email-submit" id="edf-email-submit">Send</button>
      </div>
    `;
    panel.appendChild(capture);

    /* Input bar */
    var inputBar = document.createElement('div');
    inputBar.id = 'edf-input-bar';
    inputBar.innerHTML = `
      <textarea id="edf-msg-input" placeholder="Type a message…" rows="1"></textarea>
      <button id="edf-send-btn" aria-label="Send message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    `;
    panel.appendChild(inputBar);

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    /* ── Initial greeting (delayed for polish) ── */
    var greeted = false;
    function showGreeting() {
      if (greeted) return;
      greeted = true;
      addTeamMsg(
        "Hi there! 👋 Have questions about our dental revenue solutions? We're here to help.",
        true,
        [
          { key: 'revenue', label: '💰 How much revenue am I missing?' },
          { key: 'demo',    label: '📅 Book a Demo' },
          { key: 'edifi',   label: '❓ How does EDiFi work?' },
          { key: 'talk',    label: '💬 Talk to someone' },
        ]
      );
    }

    /* ── Open / close ── */
    var isOpen = false;
    function openPanel() {
      isOpen = true;
      panel.classList.add('edf-open');
      badge.classList.remove('edf-visible');
      showGreeting();
      setTimeout(scrollBottom, 50);
    }
    function closePanel() {
      isOpen = false;
      panel.classList.remove('edf-open');
    }

    btn.addEventListener('click', function () {
      isOpen ? closePanel() : openPanel();
    });
    closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closePanel();
    });

    /* ── Send message ── */
    document.getElementById('edf-send-btn').addEventListener('click', function () {
      var input = document.getElementById('edf-msg-input');
      handleUserMessage(input.value);
    });
    document.getElementById('edf-msg-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserMessage(this.value);
      }
    });

    /* ── Auto-resize textarea ── */
    document.getElementById('edf-msg-input').addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    /* ── Email submit ── */
    document.getElementById('edf-email-submit').addEventListener('click', function () {
      var emailInput = document.getElementById('edf-email-input');
      var email = (emailInput.value || '').trim();
      if (!email) return;
      var capture = document.getElementById('edf-email-capture');
      if (capture) capture.style.display = 'none';
      addTeamMsg('Thanks! We\'ll follow up at <strong>' + email + '</strong>. A member of our team will be in touch shortly.', false, null);
      conversationLog.push({ role: 'email', email: email });
    });

    /* ── Show unread badge after 4s if panel not opened ── */
    setTimeout(function () {
      if (!isOpen) badge.classList.add('edf-visible');
    }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
