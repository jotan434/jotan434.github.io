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

## Want to try it?
## Run locally:

```bash
git clone https://github.com/jotan434/jotan434.github.io.git
cd jotan434.github.io
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Every push to `main` is published automatically by GitHub Pages (usually within 1–2 minutes).
