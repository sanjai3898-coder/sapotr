# SAPOTR — landing page

Single-page marketing site for SAPOTR, an on-demand workforce platform for
New Zealand businesses. Plain HTML, CSS and vanilla JavaScript — no framework,
no build step. Open `index.html` and it runs.

## Structure

    index.html      all ten sections, meta tags, FAQPage + LocalBusiness JSON-LD
    styles.css      design tokens, layout, animation, responsive rules
    script.js       booking console, scroll-scrubbed steps, reveals, carousel, FAQ
    assets/         hero film, photography, logos, share image

## Local preview

    python3 -m http.server 8000

Then open <http://localhost:8000>. Opening the file directly with `file://`
also works, but a local server matches how the video and images load in
production.

## Notes

- Everything is one page. Every link is an in-page anchor, `mailto:` or `tel:`
  — nothing navigates away.
- Animation is gated behind `prefers-reduced-motion`; that path falls back to a
  static, fully readable layout.
- Hero video ships in two encodes: `hero.mp4` (1920×1080) and
  `hero-mobile.mp4` (960×540, served under 720px wide).

## Before launch

- Testimonials are placeholders written against stock portraits. Replace with
  real, attributable customer quotes.
- The stat figures and the "4.9 average rating" line are unverified marketing
  numbers. Confirm or change them.
- Stock media comes from Pexels and Coverr. Confirm the licence terms for each
  asset before commercial use.
