## Cerberus Website

Cerberus IT's marketing site for showcasing services, insight hubs, and supporting staff content. Built as a static HTML/CSS/JS experience with custom animations and video-driven cards.

### Project structure
- `index.html` – main page markup
- `styles.css` – global styling, component layouts, animations
- `scripts/features.js` – interactive behaviors (parallax, video ping-pong, tabs, contact form, etc.)
- `assets/` – images, videos, and fonts
- `robots.txt` – search engine crawl rules
- `sitemap.xml` – site map for search engines

### Local development
1. Clone the repo.
2. Edit HTML/CSS/JS files directly (no build step required).
3. Use a simple static server (e.g., `npx serve .` or `python3 -m http.server`) to preview `index.html` while editing.

### Git workflow
```bash
# after making changes
git status
git add <files>
git commit -m "Describe update"
git push origin main
```

### Deployment
The site is hosted on **GitHub Pages**, served from the root of the `main` branch. Pushes to `main` automatically trigger a rebuild.

- **Live site:** https://cerberusituk.github.io/cerberus-it-co-uk/
- **Pages settings:** repo Settings → Pages

### Contact form
The contact form submits to [FormSubmit](https://formsubmit.co/), which forwards submissions to `support@cerberus-it.co.uk`. The first submission triggers a one-time confirmation email that must be actioned to activate the endpoint.
