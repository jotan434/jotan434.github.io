/*
 * Nova – Konfiguration für die Seitenklar-Website.
 * Lädt den Chat-Assistenten nur, wenn eine Webhook-URL gesetzt ist.
 * Solange PUBLIC_WEBHOOK leer ist, sehen Besucher keinen Chat (nichts kaputt, nichts sichtbar).
 */
(function () {
  // Öffentliche HTTPS-URL des n8n-Chat-Triggers (Production URL). Erst eintragen, wenn n8n aus dem Internet erreichbar ist.
  var PUBLIC_WEBHOOK = 'https://diana-players-toronto-bars.trycloudflare.com/webhook/4f3c9a1e-7b2d-4c8e-a6f1-2d9e8b7c5a10/chat';
  // Nur zum Testen auf dem eigenen Rechner (python3 -m http.server 8000 → http://localhost:8000). Greift nie auf der Live-Seite.
  var LOCAL_WEBHOOK = 'http://localhost:5678/webhook/4f3c9a1e-7b2d-4c8e-a6f1-2d9e8b7c5a10/chat';

  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var url = isLocal ? LOCAL_WEBHOOK : PUBLIC_WEBHOOK;
  if (!url) return;

  window.ChatWidgetConfig = {
    webhookUrl: url,
    lang: 'de',
    title: 'Nova',
    subtitle: 'KI-Assistent · antwortet sofort',
    welcomeMessage: 'Hallo 👋 Ich bin **Nova**, der KI-Assistent von Seitenklar. Fragen Sie mich, was der Website-Check prüft und wie er abläuft.\n\nBitte geben Sie hier **keine persönlichen Daten** ein.',
    placeholder: 'Ihre Frage …',
    suggestions: ['Was prüft der Website-Check?', 'Was kostet das?', 'Wie nehme ich Kontakt auf?'],
    teaser: 'Fragen zum Website-Check? ✨',
    accent: '#1f6feb',
    accent2: '#1f8a4c',
    footer: 'KI-Assistent · keine Rechtsberatung'
  };

  var s = document.createElement('script');
  s.src = 'nova/chat-widget.js';
  document.head.appendChild(s);
})();
