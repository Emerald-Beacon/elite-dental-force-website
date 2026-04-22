---
name: Mobile Responsive Audit Patterns
description: Approved approach for adding responsive CSS to inline style blocks on EDF website pages
type: feedback
---

Always append responsive @media rules inside the page's existing inline `<style>` block just before the closing `</style>` tag — never touch `css/styles.css`.

**Why:** The global styles.css handles nav, hero split layout, grids, footer, trust bar, and CTA band. Page-specific inline styles handle only unique components (PIA floating cards, tab explorers, founder editorial cards, investor grids, etc.).

**How to apply:**
- Audit all CSS classes with: fixed `grid-template-columns: repeat(N,...)`, large fixed `padding`/`min-height`, `position:absolute` floating cards, fixed pixel widths.
- Watch for inline `style=""` attributes in the HTML body — CSS class rules cannot override these without `!important` or attribute selectors like `[style*="repeat(4"]`.
- Add responsive blocks at 768px and 480px.
- Forms: always set `font-size: 16px` on inputs/selects/textareas to prevent iOS auto-zoom.
- Minimum touch target: `min-height: 48px` on all buttons and interactive elements.
- PIA floating card layout (index.html) collapses gracefully — hide `.pia-c3` at 480px rather than breaking the grid.
- EDiFi tab explorer: at 480px allow horizontal scroll via `overflow-x: auto` on `.ep-tabs`.
- company.html `.co-stat-strip` had `min-width: 580px` — existing 768px breakpoint already overrides to `min-width: 0; width: 100%`.
