# Seitenklar – Website checks for small businesses

**Live:** https://jotan434.github.io

Portfolio website for **Seitenklar**, a self-built tool that checks websites of small businesses in Upper Austria for legal basics, Google and AI visibility, and mobile load time – and explains the results in plain language.

> This is a portfolio project. No commercial services are offered. The check verifies whether something *exists* – it is **not** legal advice.

The website itself is written in German (target audience: Austrian businesses).

## Files

| File | Purpose |
|---|---|
| `index.html` | Main page: what is checked, how it works, projects, about, contact |
| `style.css` | All styles (no framework) |
| `impressum.html` | Legal notice (required in Austria) |
| `datenschutz.html` | Privacy policy |
| `workflow.png` | Screenshot of the n8n workflow |
| `nova/` | Nova, the AI chat widget (`chat-widget.js`) and its site config (`nova-config.js`) |
| `n8n/` | Importable n8n workflow and system prompt for Nova |
| `robots.txt` / `sitemap.xml` | Rules and page list for search engines |

## How a check works

The check runs as an **n8n workflow** (self-hosted in Docker, not part of this repo):

1. **Prepare URL** – `beispiel.at` → `https://beispiel.at/`
2. **Load homepage** + `robots.txt`
3. **Google PageSpeed** – load time, SEO, accessibility (mobile)
4. **Check subpages** – up to 9, one by one with a pause; respects `robots.txt`
5. **Build report** – sorted by priority: red, yellow, green

Every red finding is then verified by hand in the browser and source code.

## Tech stack

- Plain HTML + CSS, no build step
- Hosted on **GitHub Pages**
- Checking tool: n8n, Docker, Linux, Google PageSpeed / Lighthouse

## Run locally:

```bash
git clone https://github.com/jotan434/jotan434.github.io.git
cd jotan434.github.io
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Every push to `main` is published automatically by GitHub Pages (usually within 1–2 minutes).

## Nova – AI chat assistant

Nova answers visitors' questions about the check. It is a vanilla-JS widget (`nova/chat-widget.js`, no dependencies, no external requests) that talks to an **n8n AI Agent** (Claude Haiku) through a webhook. The API key stays in n8n, never in the browser.

- `nova/nova-config.js` loads the widget **only if a webhook URL is set** (`PUBLIC_WEBHOOK`). While it is empty, visitors see no chat.
- Cost protection: the workflow has a **Limit-Check** node (daily cap, per-conversation cap, max. message length). Numbers are constants at the top of its code.
- `n8n/nova-workflow.json`: import into n8n, add Anthropic credentials, activate. `n8n/nova-system-prompt.md` holds the knowledge Nova answers from.
- Test locally: `python3 -m http.server 8000`, open `http://localhost:8000`. On `localhost` the widget uses the local n8n webhook (add `http://localhost:8000` to the Chat Trigger's allowed origins).
- Before going live: public HTTPS URL for n8n, spend limit in the Claude Console, rate limit, and the privacy policy section about the chat.
