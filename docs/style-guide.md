# Daedalus Sky — Style Guide: Technical Renaissance

Dark-first product chrome inspired by **drafting tables and blueprints**: precision, depth, and calm contrast. Clinical and operational data should read like instrumentation, not marketing chrome.

## Principles

1. **Dark mode default** — Reduce eye strain for control-room and night-flight contexts; light mode may appear later as an optional variant.
2. **Blueprint structure** — Subtle grid and hairline rules suggest scale and accountability without clutter.
3. **Typography** — Sans for navigation and labels; **monospace** for IDs, times, coordinates, weights, and certification codes.
4. **Restraint** — One accent hue for primary actions; reserve warm hues for warnings only.
5. **Accessibility** — Maintain WCAG contrast for text and focus rings; never rely on color alone for state.

## Color tokens (reference)

| Token              | Role                                      |
|--------------------|-------------------------------------------|
| `--background`     | Deep slate / near-black base              |
| `--surface`        | Elevated panels                           |
| `--grid`           | Low-contrast blueprint grid lines         |
| `--foreground`     | Primary text                              |
| `--muted`          | Secondary labels                          |
| `--accent`         | Primary interactive (cyan / cold blue)  |
| `--accent-muted`   | Hover / outline                           |
| `--danger`         | Destructive / critical alerts             |

Implement these as CSS variables in `src/app/globals.css` and map into Tailwind `@theme` for components.

## Layout

- **8px grid** for spacing; generous vertical rhythm on debrief and guideline readers.
- **Hairline borders** (`1px`) with translucent white or accent at low opacity.
- **Cards** use inset shadow or border — avoid heavy drop shadows.

## Iconography and data

- Prefer **stroke** icons at 1.5px weight to match technical drawings.
- Align numeric columns right; use tabular nums (`font-variant-numeric: tabular-nums`).

## Motion

- Short, linear transitions (120–180ms) for hover and panel expand; avoid playful easing on safety-critical flows.

## Content

- Voice: **direct, operational** — short imperatives for actions; sentence case for headings.
- Avoid anthropomorphic copy in mission-critical paths.
