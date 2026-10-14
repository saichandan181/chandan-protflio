# saichandan.vercel.app

Personal portfolio of **Sanda Reddy Sai Chandan** — mobile app developer & AI/ML engineer.

Hand-built with plain HTML, CSS and JavaScript: no framework, no build step, no runtime dependencies beyond Google Fonts.

## Features

- **Interactive terminal** in the hero — try `help`, `projects`, `joke`, `sudo hire-me` (↑/↓ history, Tab completion)
- **Command palette** — <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> to jump anywhere, copy the email, switch theme…
- Light / dark theme (follows the OS, remembers your choice)
- Animated "agent network" hero canvas, filterable projects and tech stack, live GitHub star counts
- Print stylesheet, Open Graph image, JSON-LD

## Accessibility

Built to WCAG 2.2 AA and checked with axe-core (0 violations, desktop + mobile, both themes):

- Skip link, semantic landmarks, one `h1` and a logical heading outline
- Everything works with the keyboard; strong `:focus-visible` rings; 44px+ touch targets
- Respects `prefers-reduced-motion`, plus an in-page **Pause animations** button (WCAG 2.2.2)
- Native `<dialog>` palette with combobox/listbox semantics; live regions for filter results, copy confirmation and terminal output
- Colour contrast ≥ 4.5:1 in both themes; Windows High Contrast (forced-colors) support
- The page is fully readable with JavaScript disabled

## Run locally

```sh
npx http-server .   # or: python3 -m http.server
```

## Structure

```
index.html
favicon.svg
assets/css/styles.css
assets/js/main.js
assets/images/   portrait (webp + jpg), og.jpg, résumé PDFs
```
