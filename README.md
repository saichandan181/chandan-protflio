# saichandan.vercel.app

Personal portfolio of **Sanda Reddy Sai Chandan** — mobile app developer & AI/ML engineer.

Hand-built with plain HTML, CSS and JavaScript: no framework, no build step, no runtime dependencies beyond Google Fonts.

## Design

- **Palette — Paper / Ink / Cobalt:** warm off-white `#F3F1EC`, near-black ink `#141413`, a single cobalt accent `#2A3FE5`
  (periwinkle `#8C9AFF` in dark mode). Every text pairing passes WCAG AA; most pass AAA.
- **Type:** Inter Tight for everything, Instrument Serif italic for emphasis.
- **3D scroll:** the hero stage tilts back and its letters peel away as you scroll, an About paragraph lights up word by word,
  Expertise cards rise from a reclined angle, project cards stack and recede in 3D, and the contact headline scales into place.
- **Micro-interactions:** magnetic buttons with rolling labels, cursor-driven 3D tilt + glare on the portrait and cards,
  sliding nav indicator, draw-on project illustrations, circular theme reveal (View Transitions API).
- **Command palette:** <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> to jump anywhere, copy the email, switch theme…
- Light / dark theme (follows the OS, remembers your choice), live GitHub star counts, print stylesheet, OG image, JSON-LD.

## Accessibility

Built to WCAG 2.2 AA and checked with axe-core (0 violations, desktop + mobile, both themes):

- Skip link, semantic landmarks, one `h1` and a logical heading outline
- Everything works with the keyboard; strong `:focus-visible` rings; 44px+ touch targets
- Respects `prefers-reduced-motion`, plus an in-page **Reduce motion** toggle — every 3D/scroll effect turns off
- Split-text animations keep the real heading text for screen readers; tilt/magnetic effects only run for fine pointers
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
