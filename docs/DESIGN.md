# Design: themes

Operator ships five themes from one token contract: two measured from Linear, three
exploring typesafe.ai. Pick one from the palette menu in the panel header.

| Theme | Mode | Idea |
|---|---|---|
| Linear Light / Dark | light / dark | Product restraint, measured from linear.app (below) |
| Jev Sky | light | typesafe.ai's hero: dithered cloud sky, retro ink windows, spectrum data |
| Jev Riso | light | typesafe.ai's chart sections: pink paper, ink linework, halftone fields |
| Jev Night | dark | The radical one: aurora, spectrum-revealing dot-matrix marks, glowing line |

## How theming works
- `app/globals.css` holds the **contract**: every semantic token components may use. Themes
  only set values. Files: `app/themes/linear.css`, `app/themes/jev.css`.
- `<html data-theme>` picks the palette and `data-mode` its lightness (`dark:` utilities key off
  `data-mode`). An inline `<head>` script applies the saved theme before first paint.
- Beyond color, themes control fonts (`--sans-font`, `--chrome-font` for titles and labels,
  `--display-font` for big numbers), the radius roles (`--r-*`), art layers (`--canvas-art`
  behind the page, `--plot-art` behind charts), window title bars (`--window-bar`), and
  tracks behind bars (`--track`).
- Structural flourishes that tokens can't express target `data-slot` hooks (`panel`,
  `window-bar`, `window-title`, `plot`, `mark`, `track`, `chip`, `alt-chip`, `bubble`, `tag`,
  `axis`, `trend-line`, `trend-area`), scoped to one theme in its own file. Bars expose
  `--fill` (their share of the maximum) so a theme can map value to a gradient.

## Linear

Source of truth for the Linear themes. Values were measured from linear.app's production
stylesheet (`data-theme="dark"`, Oct 2026), cross-checked against the Refero breakdown at
styles.refero.design. We borrow the design language, not the brand: the Operator name,
Jev mark, and layout stay ours.

All values live as tokens in `app/globals.css`. Components use semantic names only, so a
reskin should mean editing that file alone.

## Principles
- **Depth by lightness, not shadow.** Surfaces step up in small lightness increments and are
  separated by 1px borders. Shadows are reserved for floating layers (menus, tooltips).
- **Hierarchy by text level.** Four grays carry hierarchy; color carries meaning.
- **One accent.** Indigo marks Jev's voice and the primary action. Other hues are data.
- **Meaning never depends on color alone.** Deltas carry ▲/▼, "You" is an inverted pill,
  "Code" is a neutral tag.
- **Quiet scaffolding.** Gridlines dashed, axis labels in the faintest text level.

## Color
| Token | Value | Linear name | Use |
|---|---|---|---|
| `background` / `canvas` | #08090a | bg-level-0 | Page |
| `card` | #0f1011 | bg-panel / level-1 | Chat panel, cards |
| `popover` | #1c1c1f | bg-secondary | Menus, tooltips |
| `secondary` / `muted` | #ffffff0d | bg-translucent | Chips, hover rows, tags |
| `border` | #23252a | border-primary | All dividers |
| `input` | #ffffff14 | border-translucent-strong | Field borders |
| `foreground` | #f7f8f8 | text-primary | Primary text |
| `secondary-foreground` | #d0d6e0 | text-secondary | Chip and button text |
| `muted-foreground` | #8a8f98 | text-tertiary | Labels, body copy in summaries |
| `faint` | #62666d | text-quaternary | Axis labels, metadata |
| `primary` | #5e6ad2 | brand-bg | Primary action (Send) |
| `signal` | #7170ff | accent | Jev mark, confidence meters, alternative chips |
| `signal-soft` | #18182f | accent-tint | Hover wash for signal elements |
| `you` / `you-foreground` | #e5e5e6 / #08090a | (sign-up pill) | "You" badge, inverted |
| `positive` | #27a644 | green | Up deltas |
| `destructive` | #eb5757 | red | Down deltas, errors |
| `ring` | #5e69d1 | focus-ring-color | Focus outlines |

Chart series, in catalog order (an entity keeps its color everywhere):
teal #00b8cc, blue #4ea7fc, green #27a644, orange #fc7840, yellow #f0bf00, gray #62666d.
Indigo is excluded from charts so it stays Jev's.

## Type
- **Inter Variable**, features `cv01`, `ss03`, `zero` (slashed zero for data).
- Weights: 400 regular, **510 medium**, **590 semibold**. Nothing at 700+.
- UI text 13px (`text-sm`), labels 12px (`text-xs`), tags 11px (`text-2xs`), axis 10px (`text-3xs`).
- Headings tight: -0.012em at 20–32px, -0.022em at 48px+.
- **Geist Mono** for metadata (latency, cost, model) and tabular figures.

## Shape
A tight scale, tighter than Linear's own (they use 6/12), for a more modern feel. Radii are
roles, so "how round" is one token decision, not a component edit.

| Radius | Value | Use |
|---|---|---|
| `sm` | 3px | Tags and badges |
| `md` | 4px | Buttons, inputs, rows |
| `lg` | 6px | Small surfaces |
| `xl` | 8px | Cards and the chat panel (max) |
| `pill` | 4px | Chips and the You badge (set to 9999px for true pills) |
| `bar` | 2px | Data marks: bars, segments, meters |

Shadow: `--shadow-popover` = 0 7px 32px #00000059 (Linear shadow-high), floating layers only.

## Themes
Both themes come from Linear's own token sets. `<html data-theme>` holds the theme; an inline
`<head>` script applies the saved choice (or the system setting) before first paint, and the
header toggle saves the choice in localStorage. `dark:` utilities key off `data-theme`.

Light values (where they differ from the dark table above):
| Token | Light | Note |
|---|---|---|
| `background` / `canvas` | #f4f4f5 | Linear bg-tint; panels are white |
| `card` / `popover` | #ffffff | |
| `foreground` / `secondary-foreground` | #282a30 / #3c4149 | Linear text-primary / secondary |
| `muted-foreground` / `faint` | #6f6e77 / #86848d | Linear text-tertiary / quaternary |
| `border` | #e4e2e4 | Linear border-secondary |
| `secondary`, `muted`, `hover` | #0000000a, #00000012 | Translucent ink instead of translucent white |
| `signal` / `signal-soft` | #5e6ad2 / #f1f1ff | Deeper indigo for contrast on white |
| `you` | #282a30 on #ffffff | Inverted pill flips to dark |
| `positive` / `destructive` | #18823a / #d23f3f | Deepened from Linear's to reach contrast on white |
| Chart series | #0097a7, #2f86e0, #1f9a3d, #f06a2c, #d9a300, #86848d | Same hues, deepened |

## Jev (exploration)
Measured from typesafe.ai: ink #1e1e1e, pink #f386a1, magenta #e551ba, green #03aa5c,
hyperlink blue #0000ee, 0px corners, and a dithered cloud sky sampled at
sky #6badcd → periwinkle #7e7fde → violet #8b63e6 → purple #9e5ae8 → magenta #f554c4.
Its fonts (Die Grotesk, LisaTerminal) are commercial; Inter Tight and VT323 stand in.

- **Sky:** clouds as stacked radial gradients under a white halftone screen and SVG grain.
  White windows with ink title bars in VT323, 5px hard ink shadow on the panel, chips as
  white nav tabs, alternatives as underlined #0000ee hyperlinks. Data: magenta, purple,
  cobalt, sky, pink, ink.
- **Riso:** flat pink paper with a light halftone screen; ink title bars with pink type;
  ranking and funnel bars all ink on segmented tracks (the site's error-rate chart); series
  colors from the site's label tags (ink, blue, green, rust, crimson).
- **Night:** violet-black with a halftone aurora; marks print as 3px dot matrix; ranking and
  funnel bars reveal the spectrum in proportion to value (`background-size: 100% / --fill`);
  the trend line is the spectrum with a magenta glow; primary action in magenta.

## Motion
150ms ease-out for hover and state changes; 320ms card enter; honor reduced motion.
