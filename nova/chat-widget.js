/*!
 * Nova Chat Widget – AI chat for any website, powered by n8n
 * MIT License
 *
 * Usage:
 *   <script>window.ChatWidgetConfig = { webhookUrl: "https://your-n8n.com/webhook/<id>/chat" };</script>
 *   <script src="chat-widget.js" defer></script>
 */
(function () {
  'use strict';
  if (window.NovaChat) return;

  // ---------- Config ----------
  const DEFAULTS = {
    webhookUrl: 'demo', // "demo" = offline demo without n8n
    title: 'Nova',
    subtitle: 'AI assistant · replies instantly',
    welcomeMessage: 'Hey 👋 I\'m **Nova**, your AI assistant. Ask me anything about our services, pricing or how to reach us!',
    placeholder: 'Ask me anything…',
    suggestions: ['What do you offer?', 'How much does it cost?', 'How can I contact you?'],
    teaser: 'Questions? I can help ✨',
    teaserDelay: 2500,
    accent: '#7c5cff',
    accent2: '#00d4ff',
    position: 'right', // right | left
    theme: 'auto', // auto | light | dark
    openOnLoad: false,
    persist: true, // keep history per browser tab
    typewriter: true,
    timeoutMs: 60000,
    footer: 'Powered by n8n & Claude',
    lang: 'en', // en | de (UI texts of the widget)
  };
  const I18N = {
    en: { newChat: 'New chat', close: 'Close', closeChat: 'Close chat', openChat: 'Open chat', message: 'Message', send: 'Send',
          copy: 'Copy', copyAnswer: 'Copy answer', thinking: 'is thinking…', timeout: 'The answer took too long.',
          offline: 'I couldn\'t connect right now.', retry: 'Try again', demo: 'Demo', chat: 'Chat' },
    de: { newChat: 'Neuer Chat', close: 'Schließen', closeChat: 'Chat schließen', openChat: 'Chat öffnen', message: 'Nachricht', send: 'Senden',
          copy: 'Kopieren', copyAnswer: 'Antwort kopieren', thinking: 'denkt nach…', timeout: 'Die Antwort hat zu lange gedauert.',
          offline: 'Ich kann mich gerade nicht verbinden.', retry: 'Nochmal versuchen', demo: 'Demo', chat: 'Chat' },
  };
  const script = document.currentScript;
  const fromData = {};
  if (script) {
    for (const [k, v] of Object.entries(script.dataset)) {
      if (k in DEFAULTS) fromData[k] = typeof DEFAULTS[k] === 'boolean' ? v === 'true' : v;
    }
  }
  const cfg = Object.assign({}, DEFAULTS, fromData, window.ChatWidgetConfig || {});
  const T = I18N[cfg.lang] || I18N.en;
  const DEMO = !cfg.webhookUrl || cfg.webhookUrl === 'demo';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Storage (fail-safe) ----------
  const store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem('nova:' + k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem('nova:' + k, JSON.stringify(v)); } catch { /* ignore */ } },
    del(k) { try { sessionStorage.removeItem('nova:' + k); } catch { /* ignore */ } },
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  let sessionId = store.get('session') || uuid();
  store.set('session', sessionId);
  let history = (cfg.persist && store.get('history')) || [];

  // ---------- Icons ----------
  const ICON = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke-width="3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" opacity=".7"/></svg>',
  };

  // ---------- Styles ----------
  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .w {
    --a1: ${cfg.accent}; --a2: ${cfg.accent2};
    --grad: linear-gradient(135deg, var(--a1), var(--a2));
    --panel: rgba(255,255,255,.78); --panel-solid: #ffffff;
    --text: #12142b; --muted: #676b85; --line: rgba(18,20,43,.08);
    --bot: rgba(255,255,255,.92); --chip: rgba(255,255,255,.7);
    --shadow: 0 30px 80px -20px rgba(58,32,160,.45), 0 10px 30px -10px rgba(0,0,0,.2);
    font: 15px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--text); -webkit-font-smoothing: antialiased;
    position: fixed; z-index: 2147483000; bottom: 24px; right: 24px;
  }
  .w.left { right: auto; left: 24px; }
  .w.dark {
    --panel: rgba(18,18,32,.78); --panel-solid: #121220;
    --text: #eef0ff; --muted: #9a9dbb; --line: rgba(255,255,255,.08);
    --bot: rgba(255,255,255,.06); --chip: rgba(255,255,255,.05);
    --shadow: 0 30px 80px -20px rgba(0,0,0,.8), 0 0 60px -20px var(--a1);
  }

  /* ---------- Launcher ---------- */
  .launcher {
    position: relative; width: 64px; height: 64px; border-radius: 50%; border: 0; cursor: pointer;
    background: var(--grad); color: #fff; display: grid; place-items: center;
    box-shadow: 0 12px 30px -8px var(--a1), inset 0 1px 0 rgba(255,255,255,.35);
    transition: transform .35s cubic-bezier(.3,1.6,.5,1), box-shadow .3s;
    animation: pop .7s cubic-bezier(.3,1.6,.5,1) both;
  }
  .launcher:hover { transform: scale(1.08) rotate(-4deg); box-shadow: 0 18px 40px -8px var(--a1); }
  .launcher:active { transform: scale(.94); }
  .launcher::before { /* rotating glow ring */
    content: ""; position: absolute; inset: -4px; border-radius: 50%; z-index: -1;
    background: conic-gradient(from 0deg, var(--a1), var(--a2), transparent 60%, var(--a1));
    filter: blur(8px); opacity: .8; animation: spin 4s linear infinite;
  }
  .launcher::after { /* pulse */
    content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--a1);
    animation: ping 2.4s cubic-bezier(0,0,.2,1) infinite;
  }
  .w.open .launcher::after { animation: none; opacity: 0; }
  .launcher svg { position: absolute; width: 28px; height: 28px; transition: transform .45s cubic-bezier(.3,1.5,.5,1), opacity .25s; }
  .launcher .i-close { opacity: 0; transform: rotate(-90deg) scale(.4); }
  .w.open .launcher .i-chat { opacity: 0; transform: rotate(90deg) scale(.4); }
  .w.open .launcher .i-close { opacity: 1; transform: none; }

  .teaser {
    position: absolute; bottom: 12px; right: 78px; white-space: nowrap;
    background: var(--panel-solid); color: var(--text); padding: 10px 14px; border-radius: 16px 16px 4px 16px;
    font-size: 14px; font-weight: 500; box-shadow: var(--shadow); cursor: pointer;
    opacity: 0; transform: translateX(12px) scale(.9); pointer-events: none;
    transition: opacity .4s, transform .5s cubic-bezier(.3,1.6,.5,1);
  }
  .w.left .teaser { right: auto; left: 78px; border-radius: 16px 16px 16px 4px; }
  .teaser.show { opacity: 1; transform: none; pointer-events: auto; }
  .w.open .teaser { opacity: 0; pointer-events: none; }

  /* ---------- Panel ---------- */
  .panel {
    position: absolute; bottom: 84px; right: 0; width: 400px; height: min(640px, calc(100vh - 130px));
    display: flex; flex-direction: column; overflow: hidden; border-radius: 26px;
    background: var(--panel); backdrop-filter: blur(28px) saturate(180%); -webkit-backdrop-filter: blur(28px) saturate(180%);
    box-shadow: var(--shadow); border: 1px solid var(--line);
    transform-origin: bottom right; opacity: 0; pointer-events: none; visibility: hidden;
    transform: translateY(24px) scale(.9); filter: blur(10px);
    transition: opacity .35s ease, transform .55s cubic-bezier(.2,1.3,.35,1), filter .4s ease, visibility 0s .55s;
  }
  .w.left .panel { right: auto; left: 0; transform-origin: bottom left; }
  .w.open .panel { opacity: 1; transform: none; filter: none; pointer-events: auto; visibility: visible; transition-delay: 0s; }
  .panel::before { /* animated gradient border */
    content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px; pointer-events: none; z-index: 5;
    background: linear-gradient(120deg, var(--a1), transparent 30%, transparent 70%, var(--a2)) 0 0 / 300% 300%;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    animation: borderflow 6s ease infinite;
  }

  /* header with aurora effect */
  .head { position: relative; padding: 18px 18px 16px; display: flex; align-items: center; gap: 12px; color: #fff; overflow: hidden; background: #0d0b24; flex-shrink: 0; }
  .aurora { position: absolute; inset: 0; pointer-events: none; }
  .aurora i { position: absolute; width: 220px; height: 220px; border-radius: 50%; filter: blur(40px); opacity: .85; }
  .aurora i:nth-child(1) { background: var(--a1); top: -120px; left: -60px; animation: float1 9s ease-in-out infinite; }
  .aurora i:nth-child(2) { background: var(--a2); top: -110px; right: -80px; animation: float2 11s ease-in-out infinite; }
  .aurora i:nth-child(3) { background: #ff5ecf; width: 140px; height: 140px; bottom: -110px; left: 40%; opacity: .5; animation: float1 13s ease-in-out infinite reverse; }
  .head > *:not(.aurora) { position: relative; }
  .avatar { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,.16); display: grid; place-items: center; border: 1px solid rgba(255,255,255,.25); backdrop-filter: blur(8px); flex-shrink: 0; }
  .avatar svg { width: 24px; height: 24px; animation: twinkle 3s ease-in-out infinite; }
  .avatar .dot { position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: #2bd97c; border: 2px solid #0d0b24; }
  .avatar .dot::after { content: ""; position: absolute; inset: -2px; border-radius: 50%; background: #2bd97c; animation: ping 2s infinite; }
  .who { flex: 1; min-width: 0; }
  .who b { display: block; font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
  .who span { display: block; font-size: 12.5px; opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hbtn { width: 34px; height: 34px; border-radius: 10px; border: 0; background: rgba(255,255,255,.12); color: #fff; cursor: pointer; display: grid; place-items: center; transition: background .2s, transform .3s; }
  .hbtn:hover { background: rgba(255,255,255,.24); }
  .hbtn.spin:hover svg { transform: rotate(-200deg); }
  .hbtn svg { width: 17px; height: 17px; transition: transform .5s cubic-bezier(.3,1.4,.5,1); }

  /* messages */
  .msgs { flex: 1; overflow-y: auto; padding: 20px 16px 8px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth;
    -webkit-mask: linear-gradient(transparent, #000 16px); mask: linear-gradient(transparent, #000 16px); }
  .msgs::-webkit-scrollbar { width: 6px; }
  .msgs::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
  .row { display: flex; gap: 8px; align-items: flex-end; animation: msgIn .5s cubic-bezier(.2,1.2,.4,1) both; }
  .row.user { justify-content: flex-end; }
  .mini { width: 28px; height: 28px; border-radius: 9px; background: var(--grad); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
  .mini svg { width: 15px; height: 15px; }
  .bubble { position: relative; max-width: 80%; padding: 11px 14px; border-radius: 18px; word-wrap: break-word; overflow-wrap: anywhere; }
  .bot .bubble { background: var(--bot); border: 1px solid var(--line); border-bottom-left-radius: 6px; box-shadow: 0 4px 14px -6px rgba(0,0,0,.12); }
  .user .bubble { background: var(--grad); color: #fff; border-bottom-right-radius: 6px; box-shadow: 0 8px 20px -8px var(--a1); }
  .bubble p + p, .bubble p + ul, .bubble ul + p, .bubble p + ol, .bubble ol + p { margin-top: 8px; }
  .bubble ul, .bubble ol { padding-left: 20px; }
  .bubble li + li { margin-top: 3px; }
  .bubble strong { font-weight: 650; }
  .bubble a { color: var(--a1); font-weight: 600; text-decoration: none; background: linear-gradient(currentColor,currentColor) 0 100% / 0 1.5px no-repeat; transition: background-size .3s; }
  .bubble a:hover { background-size: 100% 1.5px; }
  .w.dark .bubble a { color: var(--a2); }
  .user .bubble a { color: #fff; text-decoration: underline; }
  .bubble code { font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; background: rgba(127,127,160,.15); padding: 1px 5px; border-radius: 5px; }
  .bubble pre { margin-top: 8px; padding: 10px 12px; border-radius: 10px; background: #0d0b24; color: #e6e6ff; overflow-x: auto; }
  .bubble pre code { background: none; padding: 0; }
  .bubble .h { font-weight: 700; }
  .bubble.typing > :last-child::after { content: ""; display: inline-block; width: 7px; height: 1.05em; margin-left: 2px; vertical-align: -2px; border-radius: 2px; background: var(--grad); animation: blink .9s steps(2) infinite; }
  .copy { position: absolute; top: -10px; right: -10px; width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel-solid); color: var(--muted); cursor: pointer; display: grid; place-items: center; opacity: 0; transform: scale(.7); transition: opacity .2s, transform .25s cubic-bezier(.3,1.6,.5,1); }
  .copy svg { width: 13px; height: 13px; }
  .row.bot:hover .copy { opacity: 1; transform: none; }
  .copy.done { color: #2bd97c; }
  .error .bubble { border-color: rgba(255,90,110,.4); background: rgba(255,90,110,.08); }
  .retry { margin-top: 8px; border: 0; background: var(--grad); color: #fff; padding: 6px 12px; border-radius: 999px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }

  /* typing indicator */
  .dots { display: inline-flex; gap: 5px; padding: 4px 2px; }
  .dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--grad); animation: bounce 1.2s infinite ease-in-out; }
  .dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
  .thinking { font-size: 12.5px; margin-left: 8px; background: linear-gradient(90deg, var(--muted) 30%, var(--a1) 50%, var(--muted) 70%) 0 0 / 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 1.6s linear infinite; }

  /* suggestion chips */
  .chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 2px 0 4px 36px; }
  .chip { border: 1px solid var(--line); background: var(--chip); color: var(--text); font: inherit; font-size: 13.5px; padding: 7px 13px; border-radius: 999px; cursor: pointer; animation: msgIn .5s cubic-bezier(.2,1.2,.4,1) both; transition: transform .25s cubic-bezier(.3,1.6,.5,1), border-color .2s, box-shadow .2s; }
  .chip:hover { transform: translateY(-2px); border-color: var(--a1); box-shadow: 0 6px 16px -6px var(--a1); }

  /* input */
  .foot { padding: 10px 14px 12px; flex-shrink: 0; }
  .field { display: flex; align-items: flex-end; gap: 8px; padding: 6px 6px 6px 14px; border-radius: 18px; background: var(--panel-solid); border: 1px solid var(--line); transition: box-shadow .3s, border-color .3s; }
  .field:focus-within { border-color: transparent; box-shadow: 0 0 0 2px var(--a1), 0 0 24px -4px var(--a2); }
  textarea { flex: 1; resize: none; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; max-height: 120px; padding: 7px 0; min-height: 36px; }
  textarea::placeholder { color: var(--muted); }
  .send { position: relative; overflow: hidden; width: 38px; height: 38px; border-radius: 13px; border: 0; background: var(--grad); color: #fff; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; transition: transform .3s cubic-bezier(.3,1.6,.5,1), opacity .2s, filter .2s; }
  .send svg { width: 18px; height: 18px; transition: transform .3s; }
  .send:hover:not(:disabled) svg { transform: translateX(2px); }
  .send:active:not(:disabled) { transform: scale(.9); }
  .send:disabled { opacity: .4; filter: grayscale(.6); cursor: not-allowed; }
  .ripple { position: absolute; border-radius: 50%; background: rgba(255,255,255,.55); transform: scale(0); animation: ripple .6s ease-out forwards; pointer-events: none; }
  .meta { text-align: center; font-size: 11px; color: var(--muted); margin-top: 8px; }
  .meta .badge { display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 999px; background: var(--grad); color: #fff; font-weight: 600; }

  /* ---------- Animations ---------- */
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ping { 0% { transform: scale(1); opacity: .7; } 80%, 100% { transform: scale(1.7); opacity: 0; } }
  @keyframes pop { from { transform: scale(0) rotate(-45deg); opacity: 0; } }
  @keyframes msgIn { from { opacity: 0; transform: translateY(12px) scale(.96); filter: blur(4px); } }
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0) scale(.8); opacity: .5; } 40% { transform: translateY(-6px) scale(1); opacity: 1; } }
  @keyframes shimmer { to { background-position: -200% 0; } }
  @keyframes blink { to { opacity: 0; } }
  @keyframes ripple { to { transform: scale(4); opacity: 0; } }
  @keyframes borderflow { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes float1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,30px) scale(1.2); } }
  @keyframes float2 { 0%, 100% { transform: translate(0,0) scale(1.1); } 50% { transform: translate(-70px,20px) scale(.9); } }
  @keyframes twinkle { 0%, 100% { transform: scale(1) rotate(0); } 50% { transform: scale(1.12) rotate(12deg); } }

  /* ---------- Mobile ---------- */
  @media (max-width: 480px) {
    .w, .w.left { bottom: 16px; right: 16px; }
    .w.left { left: 16px; right: auto; }
    .panel { position: fixed; inset: 0; width: 100%; height: 100%; height: 100dvh; border-radius: 0; bottom: 0; }
    .w.left .panel { left: 0; }
    .w.open .launcher { transform: scale(0); opacity: 0; pointer-events: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; }
  }`;

  // ---------- Markdown (safe: escape first, then format) ----------
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function markdown(src) {
    const blocks = [];
    let s = esc(String(src).replace(/\r\n/g, '\n'));
    s = s.replace(/```[\w-]*\n?([\s\S]*?)```/g, (_, code) => {
      blocks.push('<pre><code>' + code.replace(/\n$/, '') + '</code></pre>');
      return '\n\u0000' + (blocks.length - 1) + '\u0000\n';
    });
    s = s
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    let html = '';
    let list = null;
    const close = () => { if (list) { html += '</' + list + '>'; list = null; } };
    for (const line of s.split('\n')) {
      const t = line.trim();
      const li = t.match(/^(?:[-*•]|(\d+)[.)])\s+(.*)$/);
      if (/^\u0000\d+\u0000$/.test(t)) { close(); html += t; }
      else if (li) {
        const type = li[1] ? 'ol' : 'ul';
        if (list !== type) { close(); html += '<' + type + '>'; list = type; }
        html += '<li>' + li[2] + '</li>';
      } else {
        close();
        const h = t.match(/^#{1,4}\s+(.*)$/);
        if (h) html += '<p class="h">' + h[1] + '</p>';
        else if (t) html += '<p>' + t + '</p>';
      }
    }
    close();
    return html.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[+i]);
  }

  // ---------- Build DOM ----------
  const host = document.createElement('div');
  host.id = 'nova-chat-widget';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>${CSS}</style>
    <div class="w ${cfg.position === 'left' ? 'left' : ''}" part="widget">
      <section class="panel" role="dialog" aria-modal="false" aria-label="${esc(cfg.title)} ${T.chat}">
        <header class="head">
          <div class="aurora"><i></i><i></i><i></i></div>
          <div class="avatar" style="position:relative">${ICON.spark}<span class="dot"></span></div>
          <div class="who"><b>${esc(cfg.title)}</b><span>${esc(cfg.subtitle)}</span></div>
          <button class="hbtn spin" data-act="reset" title="${T.newChat}" aria-label="${T.newChat}">${ICON.reset}</button>
          <button class="hbtn" data-act="close" title="${T.close}" aria-label="${T.closeChat}">${ICON.close}</button>
        </header>
        <div class="msgs" role="log" aria-live="polite"></div>
        <div class="foot">
          <form class="field">
            <textarea rows="1" placeholder="${esc(cfg.placeholder)}" aria-label="${T.message}"></textarea>
            <button class="send" type="submit" aria-label="${T.send}" disabled>${ICON.send}</button>
          </form>
          <div class="meta">${esc(cfg.footer)}${DEMO ? '<span class="badge">' + T.demo + '</span>' : ''}</div>
        </div>
      </section>
      <div class="teaser" role="button" tabindex="0">${esc(cfg.teaser)}</div>
      <button class="launcher" aria-label="${T.openChat}" aria-expanded="false">
        <span class="i-chat">${ICON.chat}</span><span class="i-close">${ICON.close}</span>
      </button>
    </div>`;
  // swap placeholder <span>s for their SVGs
  root.querySelectorAll('.launcher span').forEach((s) => { const svg = s.firstElementChild; svg.classList.add(s.className); s.replaceWith(svg); });

  const $ = (sel) => root.querySelector(sel);
  const W = $('.w'), msgs = $('.msgs'), form = $('form'), input = $('textarea'), sendBtn = $('.send'), launcher = $('.launcher'), teaser = $('.teaser');

  // Theme
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = () => W.classList.toggle('dark', cfg.theme === 'dark' || (cfg.theme === 'auto' && mq.matches));
  applyTheme();
  mq.addEventListener && mq.addEventListener('change', applyTheme);

  // ---------- Rendering ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const scrollDown = () => { msgs.scrollTop = msgs.scrollHeight; };

  function addRow(role, extraClass) {
    const row = document.createElement('div');
    row.className = 'row ' + role + (extraClass ? ' ' + extraClass : '');
    if (role === 'bot') row.innerHTML = `<div class="mini">${ICON.spark}</div>`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    row.appendChild(bubble);
    msgs.appendChild(row);
    scrollDown();
    return { row, bubble };
  }

  function addCopyButton(row, text) {
    const b = document.createElement('button');
    b.className = 'copy'; b.title = T.copy; b.setAttribute('aria-label', T.copyAnswer);
    b.innerHTML = ICON.copy;
    b.onclick = async () => {
      try { await navigator.clipboard.writeText(text); b.innerHTML = ICON.check; b.classList.add('done'); setTimeout(() => { b.innerHTML = ICON.copy; b.classList.remove('done'); }, 1400); } catch { /* ignore */ }
    };
    row.querySelector('.bubble').appendChild(b);
  }

  // Typewriter effect that keeps the HTML structure (lists, links, …)
  async function typeInto(target, html) {
    const src = document.createElement('div');
    src.innerHTML = html;
    if (!cfg.typewriter || reducedMotion) { target.innerHTML = html; return; }
    const total = src.textContent.length;
    const perTick = Math.max(2, Math.ceil(total / 160)); // max ~2.7 s per answer
    let skip = false;
    const onSkip = () => { skip = true; };
    target.addEventListener('click', onSkip, { once: true });
    target.classList.add('typing');
    async function walk(from, to) {
      for (const node of Array.from(from.childNodes)) {
        if (skip) return;
        if (node.nodeType === 3) {
          const t = document.createTextNode('');
          to.appendChild(t);
          const text = node.textContent;
          for (let i = 0; i < text.length && !skip; i += perTick) {
            t.textContent = text.slice(0, i + perTick);
            scrollDown();
            await sleep(16);
          }
        } else if (node.nodeType === 1) {
          const el = node.cloneNode(node.tagName === 'PRE');
          to.appendChild(el);
          if (node.tagName !== 'PRE') await walk(node, el);
        }
      }
    }
    await walk(src, target);
    target.classList.remove('typing');
    target.removeEventListener('click', onSkip);
    target.innerHTML = html;
    scrollDown();
  }

  function showTyping() {
    const { row, bubble } = addRow('bot', 'pending');
    bubble.innerHTML = '<span class="dots"><i></i><i></i><i></i></span><span class="thinking">' + esc(cfg.title) + ' ' + T.thinking + '</span>';
    return row;
  }

  function renderChips() {
    if (!cfg.suggestions || !cfg.suggestions.length || history.some((m) => m.role === 'user')) return;
    const wrap = document.createElement('div');
    wrap.className = 'chips';
    cfg.suggestions.forEach((s, i) => {
      const c = document.createElement('button');
      c.className = 'chip'; c.textContent = s; c.style.animationDelay = 0.25 + i * 0.08 + 's';
      c.onclick = () => send(s);
      wrap.appendChild(c);
    });
    msgs.appendChild(wrap);
  }

  function renderAll() {
    msgs.innerHTML = '';
    const { row, bubble } = addRow('bot');
    bubble.innerHTML = markdown(cfg.welcomeMessage);
    row.style.animationDelay = '.15s';
    for (const m of history) {
      const r = addRow(m.role === 'user' ? 'user' : 'bot');
      r.row.style.animation = 'none';
      if (m.role === 'user') r.bubble.textContent = m.text;
      else { r.bubble.innerHTML = markdown(m.text); addCopyButton(r.row, m.text); }
    }
    renderChips();
    scrollDown();
  }

  // ---------- Backend ----------
  function parseResponse(raw) {
    try {
      const d = JSON.parse(raw);
      const o = Array.isArray(d) ? d[0] : d;
      if (typeof o === 'string') return o;
      return o.output ?? o.text ?? o.response ?? o.message ?? JSON.stringify(o);
    } catch { /* maybe an NDJSON stream */ }
    let out = '';
    for (const line of raw.split('\n')) {
      try { const j = JSON.parse(line); if (j.type === 'item' && j.content) out += j.content; } catch { /* skip */ }
    }
    return out || raw;
  }

  async function askAgent(text) {
    if (DEMO) return demoReply(text);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
    try {
      const res = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: text, metadata: { page: location.href } }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return parseResponse(await res.text());
    } finally {
      clearTimeout(timer);
    }
  }

  // Offline demo so the page also works without n8n (e.g. on GitHub Pages)
  async function demoReply(text) {
    await sleep(700 + Math.random() * 700);
    const t = text.toLowerCase();
    const A = [
      [/price|pricing|cost|plan|\$|€|subscription/, '**Our plans** (example):\n- **Starter** – $49/month\n- **Pro** – $99/month\n- **Enterprise** – on request\n\nIn the real setup, prices come from your n8n agent\'s system prompt.'],
      [/contact|reach|email|mail|phone|call/, 'The best way to reach us is **email** at `hello@example.com` or via the [contact form](https://example.com). We usually reply within 24 h. 📬'],
      [/hours|open|when/, 'We\'re available **Mon–Fri, 9 am – 5 pm**. As an AI assistant I\'m here around the clock, of course. 🌙'],
      [/n8n|workflow|how do you work|how does (it|this) work|tech/, 'Here\'s how I work:\n1. Your message is sent to **n8n** via webhook\n2. An **AI Agent** powered by Claude answers it – with per-session memory\n3. The answer comes back to this widget, typewriter effect included ✨'],
      [/offer|service|do you do|what do you/, 'We offer (example):\n- **Web design** & development\n- **Automation** with n8n\n- **AI assistants** like me\n\nWhat would you like to know more about?'],
      [/hello|\bhi\b|hey|good (morning|evening)/, 'Hey! 👋 Great to have you here. How can I help?'],
      [/thank|thx|great|cool|awesome/, 'You\'re welcome! 😊 Let me know if there\'s anything else.'],
    ];
    for (const [re, answer] of A) if (re.test(t)) return answer;
    return 'This is **demo mode** – I reply with sample answers here. Connect the widget to your n8n workflow (`webhookUrl`) and Claude will answer any question based on your own knowledge. 🚀';
  }

  // ---------- Send ----------
  let busy = false;
  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true;
    const chips = msgs.querySelector('.chips');
    if (chips) chips.remove();
    const u = addRow('user');
    u.bubble.textContent = text;
    history.push({ role: 'user', text });
    if (cfg.persist) store.set('history', history);
    input.value = ''; autosize(); updateSend();

    const pending = showTyping();
    try {
      const answer = await askAgent(text);
      pending.remove();
      const { row, bubble } = addRow('bot');
      await typeInto(bubble, markdown(answer));
      addCopyButton(row, answer);
      history.push({ role: 'bot', text: answer });
      if (cfg.persist) store.set('history', history);
    } catch (err) {
      pending.remove();
      const { bubble } = addRow('bot', 'error');
      const reason = err.name === 'AbortError' ? T.timeout : T.offline;
      bubble.innerHTML = '<p>😕 ' + reason + '</p>';
      const retry = document.createElement('button');
      retry.className = 'retry'; retry.textContent = T.retry;
      retry.onclick = () => {
        bubble.closest('.row').remove();
        u.row.remove();
        history = history.filter((m, i) => !(i === history.length - 1 && m.role === 'user'));
        busy = false;
        send(text);
      };
      bubble.appendChild(retry);
      console.warn('[NovaChat]', err);
    } finally {
      busy = false;
      updateSend();
    }
  }

  // ---------- Interaktion ----------
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }
  function updateSend() { sendBtn.disabled = busy || !input.value.trim(); }

  input.addEventListener('input', () => { autosize(); updateSend(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); }
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  sendBtn.addEventListener('pointerdown', (e) => {
    if (sendBtn.disabled) return;
    const r = sendBtn.getBoundingClientRect();
    const dot = document.createElement('span');
    const size = r.width;
    dot.className = 'ripple';
    dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    sendBtn.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  });

  let rendered = false;
  function open() {
    if (!rendered) { renderAll(); rendered = true; }
    W.classList.add('open');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', T.closeChat);
    teaser.classList.remove('show');
    store.set('teaserSeen', true);
    setTimeout(() => input.focus({ preventScroll: true }), 300);
  }
  function close() {
    W.classList.remove('open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', T.openChat);
  }
  const toggle = () => (W.classList.contains('open') ? close() : open());
  function reset() {
    sessionId = uuid(); store.set('session', sessionId);
    history = []; store.del('history');
    renderAll();
    input.focus();
  }

  launcher.addEventListener('click', toggle);
  teaser.addEventListener('click', open);
  teaser.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  $('[data-act="close"]').addEventListener('click', close);
  $('[data-act="reset"]').addEventListener('click', reset);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); launcher.focus(); } });

  // ---------- Start ----------
  function mount() {
    document.body.appendChild(host);
    if (cfg.openOnLoad) open();
    else if (cfg.teaser && !store.get('teaserSeen')) setTimeout(() => { if (!W.classList.contains('open')) teaser.classList.add('show'); }, cfg.teaserDelay);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  // Public API
  window.NovaChat = { open, close, toggle, reset, send: (t) => { open(); send(t); }, config: cfg };
})();
