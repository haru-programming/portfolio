---
version: 1.0
name: Haruna-Takeda-Portfolio
description: >
  Front-end engineer's portfolio. A Bugatti-derived typographic discipline
  rebuilt on a light-spring (イエベ春ライト) pastel palette. Ivory canvas,
  uppercase wide-tracked Jost display, mincho/Garamond serif body, IBM Plex
  Mono for every label. The single non-typographic element is a slow WebGL
  watercolour gradient that occupies the slot Bugatti reserves for
  photography. No gradients elsewhere, no shadows, no bold weights,
  0px corners on everything.

colors:
  # canvas & structure
  canvas: "#FDFBF7"
  hairline: "#EFE4DA"
  hairline-strong: "#DFD0C2"
  frame-fill: "#FFFFFF"
  placeholder: "#F2ECE7"
  # text
  ink: "#3A322D"
  body: "#635850"
  meta: "#756A61"
  # accent (single, scarce)
  accent: "#E8A697"
  on-accent: "#3A322D"
  # gradient palette — WebGL hero only
  grad-white: "#FFFFFF"
  grad-lemon: "#FAEC8A"
  grad-aqua: "#A8E5DC"
  grad-pink: "#FCAFC0"
  grad-peach: "#FFC9A8"
  # wash palette — flat full-bleed section fills only
  wash-aqua: "#ECF7F2"
  wash-peach: "#FDF1E7"
  wash-pink: "#FDECEC"
  wash-lemon: "#FCF8E1"

typography:
  wordmark:
    fontFamily: "Jost, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: 6px
    textTransform: uppercase
  display-xl:
    fontFamily: "Jost, sans-serif"
    fontSize: 64px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: 4px
    textTransform: uppercase
  display-lg:
    fontFamily: "Jost, sans-serif"
    fontSize: 44px
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: 3px
    textTransform: uppercase
  display-md:
    fontFamily: "Jost, sans-serif"
    fontSize: 28px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 2px
    textTransform: uppercase
  display-sm:
    fontFamily: "Jost, sans-serif"
    fontSize: 24px
    fontWeight: 300
    lineHeight: 1.3
    letterSpacing: 1.5px
    textTransform: uppercase
  number-display:
    fontFamily: "Jost, sans-serif"
    fontSize: 64px
    fontWeight: 300
    lineHeight: 1.0
    letterSpacing: -1px
  body-lg:
    fontFamily: "EB Garamond, Zen Old Mincho, serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 2.15
    letterSpacing: 0
  body-md:
    fontFamily: "EB Garamond, Zen Old Mincho, serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 2.0
    letterSpacing: 0
  label-mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 2px
    textTransform: uppercase
  label-mono-sm:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: 10px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 2px
    textTransform: uppercase
  nav-mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: 12px
    fontWeight: 400
    letterSpacing: 2px
    textTransform: uppercase
  button-mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: 2.5px
    textTransform: uppercase
  link-mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: 12px
    fontWeight: 400
    letterSpacing: 2.5px
    textTransform: uppercase

rounded:
  none: 0px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  band: 140px
  band-tall: 160px

components:
  top-nav:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.nav-mono}"
    height: 56px
    layout: "MENU left / wordmark centred / CONTACT right"
  wordmark:
    textColor: "{colors.ink}"
    typography: "{typography.wordmark}"
  stage-gl:
    backgroundColor: "webgl"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    height: 100vh
  stage-work:
    backgroundColor: "{colors.wash-*}"
    textColor: "{colors.ink}"
    typography: "{typography.display-lg}"
    height: 100vh
  frame:
    backgroundColor: "{colors.frame-fill}"
    borderColor: "{colors.hairline-strong}"
    rounded: "{rounded.none}"
    width: "min(860px, 92vw)"
  frame-bar:
    height: 30px
    borderBottomColor: "{colors.hairline}"
    textColor: "{colors.meta}"
    typography: "{typography.label-mono-sm}"
    padding: "0 {spacing.sm}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    borderColor: "{colors.accent}"
    typography: "{typography.button-mono}"
    rounded: "{rounded.none}"
    padding: "15px 32px"
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.button-mono}"
    rounded: "{rounded.none}"
    padding: "15px 32px"
  text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    borderBottomColor: "{colors.hairline-strong}"
    typography: "{typography.link-mono}"
  spec-cell:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.number-display}"
    labelTypography: "{typography.label-mono-sm}"
    borderColor: "{colors.hairline-strong}"
    padding: "44px 0"
  list-row:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.display-sm}"
    borderBottomColor: "{colors.hairline}"
    padding: "26px 0"
  job-row:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.display-sm}"
    borderBottomColor: "{colors.hairline-strong}"
    padding: "40px 0"
    layout: "180px period column / 1fr content"
  band:
    backgroundColor: "{colors.canvas}"
    padding: "{spacing.band} {spacing.xl}"
  band-wash:
    backgroundColor: "{colors.wash-*}"
    padding: "{spacing.band} {spacing.xl}"
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.meta}"
    borderTopColor: "{colors.hairline}"
    typography: "{typography.label-mono}"
    padding: "{spacing.xxl} {spacing.xl}"
---

## Overview

This is a front-end engineer's portfolio built on Bugatti's typographic
discipline with Ferrari's sharp geometry, transplanted onto a light-spring
pastel palette. The lineage matters because it explains what is *not* here:
no shadows, no bold weights, no rounded corners, no second accent colour,
no decorative element of any kind. Emphasis is produced by size, letter-spacing,
case, and typeface role — never by weight.

The one deliberate departure from the source systems is the hero background.
Bugatti's rule is not literally "use photography" — it is "exactly one
non-typographic element carries all the emotion, and nothing else competes."
Here that element is a slow WebGL watercolour gradient. It occupies the slot
photography occupies at Bugatti, and it earns the same exclusivity: gradients
appear nowhere else in the system.

**Key characteristics**

- Ivory canvas (`{colors.canvas}` `#FDFBF7`) — warm, never neutral grey, never white.
- Three typefaces split by role and never crossed: **Jost** (uppercase display,
  wordmark), **EB Garamond / Zen Old Mincho** (serif and mincho body copy),
  **IBM Plex Mono** (every label, caption, nav item, button, and link).
- **Positive** letter-spacing at display sizes (2–6px), the inverse of the
  negative-tracking convention. The wordmark carries the widest at 6px.
- Weight 300–400 only. The system has no bold.
- `{rounded.none}` 0px everywhere — cards, frames, buttons, inputs. No exceptions.
- Elevation is hairline borders only. No shadow tier exists.
- Accent (`{colors.accent}` `#E8A697`) appears **once per page**, on the primary CTA.
- Work sections are flat pastel washes; project screenshots sit framed on top
  rather than bleeding full-width.

## Colors

### Canvas & structure

- **Canvas** (`{colors.canvas}` — `#FDFBF7`): the only page background. A warm
  ivory. Pure white is reserved for the frame fill so framed screenshots
  separate from the page.
- **Hairline** (`{colors.hairline}` — `#EFE4DA`): default 1px divider — footers,
  section tops, frame bars.
- **Hairline Strong** (`{colors.hairline-strong}` — `#DFD0C2`): emphasised
  divider — spec cells, career rows, frame outlines, link underlines.
- **Frame Fill** (`{colors.frame-fill}` — `#FFFFFF`): the interior of screenshot
  and portrait frames. The only pure white surface.
- **Placeholder** (`{colors.placeholder}` — `#F2ECE7`): empty image area before
  real assets are in.

### Text

- **Ink** (`{colors.ink}` — `#3A322D`): all headings and primary text. A warm
  dark brown, not black — pure black fights the pastel and reads cold.
- **Body** (`{colors.body}` — `#635850`): running body copy.
- **Meta** (`{colors.meta}` — `#756A61`): mono labels, captions, footer links,
  periods, tech stacks.

Contrast against `{colors.canvas}`: ink 12.1, body 6.6, meta 4.9 — all AA.

### Accent

- **Accent** (`{colors.accent}` — `#E8A697`) with **On-Accent** (`{colors.on-accent}`
  — `#3A322D`), ratio 6.17. The only saturated colour outside the gradient and
  the washes. It is deliberately *darker* than the pastel palette so it still
  registers as a signal; lightening it to match the washes makes it disappear.

### Gradient palette — WebGL hero only

Five stops, spread across the hue wheel so they stay distinguishable when
blended. Hue separation is the whole point: adjacent hues blur into one colour.

| Token | Hex | Hue | Saturation |
|---|---|---|---|
| `{colors.grad-white}` | `#FFFFFF` | — | — |
| `{colors.grad-lemon}` | `#FAEC8A` | 53° | 92% |
| `{colors.grad-aqua}` | `#A8E5DC` | 171° | 54% |
| `{colors.grad-pink}` | `#FCAFC0` | 347° | 93% |
| `{colors.grad-peach}` | `#FFC9A8` | 23° | 100% |

White is an active element here, not a base tint — it is painted **on top** as
a final layer to carve negative space between the colour pools, the way blooms
work in watercolour.

### Wash palette — flat fills only

Each gradient colour mixed 80% with the ivory canvas — not with pure white.
Mixing toward white keeps the chroma and lifts the wash off the ivory ground;
mixing toward the canvas drops the saturation (aqua 0.54 → 0.39) and reads as
a tint laid over the same paper. Used exclusively as full-bleed flat
section backgrounds, where the undiluted colour would overwhelm.

| Token | Hex | Derived from |
|---|---|---|
| `{colors.wash-aqua}` | `#ECF7F2` | grad-aqua |
| `{colors.wash-peach}` | `#FDF1E7` | grad-peach |
| `{colors.wash-pink}` | `#FDECEC` | grad-pink |
| `{colors.wash-lemon}` | `#FCF8E1` | grad-lemon |

The split between `grad-*` and `wash-*` is functional, not decorative: the same
hex behaves completely differently as a soft bloom versus a 100vh flat fill.
Never use a `grad-*` token as a section background.

## Typography

### Families

Three faces, split by role. The split is absolute.

1. **Jost** (weight 300, 400) — every display heading and the wordmark. Always
   uppercase, always positively tracked. A geometric sans in the Futura lineage.
2. **EB Garamond** + **Zen Old Mincho** — all running body copy. Sentence case,
   no tracking. The serif/mincho body is what keeps the system from reading as
   a tech product page; it is the single most important choice in the palette.
3. **IBM Plex Mono** — every label, eyebrow, caption, nav item, button label,
   text link, period, and metadata line. Always uppercase, tracked 2–2.5px.

Never set a button in Jost. Never set body copy in mono. Never set a label in
the serif.

### Hierarchy

| Token | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| `{typography.wordmark}` | 14px | 400 | 6px | Centred nav wordmark, footer mark |
| `{typography.display-xl}` | 64px | 300 | 4px | Hero name |
| `{typography.display-lg}` | 44px | 300 | 3px | Project titles, closing CTA heading |
| `{typography.display-md}` | 28px | 300 | 2px | Section headings (Lab, Career) |
| `{typography.display-sm}` | 24px | 300 | 1.5px | Row titles, company names |
| `{typography.number-display}` | 64px | 300 | −1px | Spec cell values |
| `{typography.body-lg}` | 17px | 400 | 0 | Profile prose |
| `{typography.body-md}` | 15px | 400 | 0 | Descriptions, list items |
| `{typography.label-mono}` | 11px | 400 | 2px | Eyebrows, meta, stacks |
| `{typography.label-mono-sm}` | 10px | 400 | 2px | Spec labels, frame bars |
| `{typography.nav-mono}` | 12px | 400 | 2px | Nav items |
| `{typography.button-mono}` | 14px | 400 | 2.5px | Button labels |
| `{typography.link-mono}` | 12px | 400 | 2.5px | Underlined text links |

### Principles

- **Positive tracking is the signature.** 6px on the wordmark down to 1.5px at
  24px. Tightening it collapses the whole voice.
- **No bold.** Emphasis comes from size, tracking, case, and family contrast.
- **Japanese body copy runs at line-height 2.0–2.15.** Mincho at tight leading
  becomes unreadable; the generous leading is not optional.
- **Mono is always uppercase.** Lowercase mono reads as code, not as a label.
  The one exception is a URL inside a frame bar.

### Substitutes

Jost → Outfit or Futura. EB Garamond → Cormorant Garamond. Zen Old Mincho →
Shippori Mincho. IBM Plex Mono → JetBrains Mono.

## Layout

### Spacing

Base unit 4px. Ladder: 4 / 8 / 12 / 16 / 24 / 40 / 64 / 140 / 160.

- Page gutter: `{spacing.xl}` 40px desktop, 20px mobile.
- Editorial band padding: `{spacing.band}` 140px vertical.
- Max content width: 1180–1280px, centred. Stages and washes go full-bleed.

### Rhythm

The page alternates full-viewport stages with canvas bands. A stage is either
the WebGL gradient or a flat pastel wash; a band is always ivory or a wash, and
holds the reading content. Stage → band → stage is the breathing pattern
inherited from Bugatti's photo → whitespace → photo.

### Grids

- Profile: 360px frame / 1fr prose, 72px gap.
- Spec cells: 4-up desktop, 2-up mobile.
- Career rows: 180px period / 1fr content, 40px gap.
- Capabilities: 220px term / 1fr definition.

## Elevation & Shape

| Level | Treatment |
|---|---|
| Flat | No border, no shadow. Stages, bands, footer. |
| Hairline | 1px `{colors.hairline}` — dividers, frame bars. |
| Hairline strong | 1px `{colors.hairline-strong}` — frames, spec cells, career rows. |
| Wash | Flat `{colors.wash-*}` fill. Colour, not depth. |

There is no shadow tier and no elevated surface. Every corner is
`{rounded.none}` 0px. This includes buttons — Ferrari's sharp geometry is used
rather than Bugatti's pill, because the centred layout reads tighter with
right angles.

## Components

**`top-nav`** — Fixed, transparent, 56px. Three-column grid: `MENU` left,
wordmark centred, `CONTACT` right. No background, no border, no blur. It floats
over whatever the stage beneath it is.

**`stage-gl`** — Full-viewport section whose background is the WebGL canvas.
Content is centred: mono eyebrow → display heading → optional CTA. Used exactly
twice per page (opening and closing) as bookends.

**`stage-work`** — Full-viewport section on a flat `{colors.wash-*}` fill. Content
centred: mono year/role → project title → `frame` → mono tech stack →
`text-link`. A running `01 / 06` counter sits top-right in mono.

**`frame`** — The screenshot container. 1px `{colors.hairline-strong}` outline,
`{colors.frame-fill}` white interior, 0px corners, `min(860px, 92vw)` wide, with
a 30px `frame-bar` carrying the domain in mono. No traffic-light dots, no
rounded corners, no shadow — the frame is a hairline rectangle that happens to
hold a website. Image area clamps to `min(52vh, 520px)` so the stage always
fits one viewport.

**`button-primary`** — `{colors.accent}` fill, `{colors.on-accent}` label,
0px corners. **One per page.** This is the entire accent budget.

**`button-outline`** — Transparent, 1px `{colors.ink}` border, 0px corners.

**`text-link`** — Mono uppercase with a 1px `{colors.hairline-strong}` underline
and 3px of descender clearance. Used instead of a second button wherever a
boxed CTA would put two rectangles next to each other.

**`spec-cell`** — Ferrari's spec block: a 64px Jost number over a 10px mono
uppercase label, hairline-strong above and below, no fill. Carries the
quantitative credibility (years, sites shipped, Lighthouse, LCP).

**`job-row`** — Career entry. 180px mono period column, then company name in
`display-sm`, role in mono, and responsibilities as a bulleted list whose
markers are 6px hairline dashes rather than bullets.

**`list-row`** — Lab entries. Grid of index / title / stack / arrow, hairline
divided, no fill.

**`footer`** — Ivory, hairline top border. Mono links left, wordmark right.

## The WebGL background

A single fragment shader, no library, ~4KB. Fullscreen triangle, no vertex data
beyond three points.

**Construction.** Two domain-warp octaves of value-noise fbm produce a warp
field; five offset samples of that field drive five independent masks. Colours
are layered with sequential `mix()` — translucent glazes, the way watercolour
actually works — in the order lemon → aqua → pink → peach, then a white bloom
layer on top, then a soft white lift toward the centre so centred display type
sits on a calmer field.

**Motion.** Two opposing drift vectors at `u_t * 0.075`. The colour masses
travel diagonally rather than shimmering in place. Slow enough to read as calm,
fast enough to be visibly alive.

**Constraints.**

- `prefers-reduced-motion: reduce` → renders one frozen frame at `t = 12.0`.
- `IntersectionObserver` halts drawing when the canvas leaves the viewport.
- Device pixel ratio capped at 1.5.
- fbm limited to 3 octaves.
- Falls back to a CSS `linear-gradient` with the same five stops if WebGL is
  unavailable.
- A ±0.005 hash dither is added at the end to prevent banding on 8-bit displays.

**Legibility.** The darkest reachable pixel is `{colors.grad-pink}`, which gives
`{colors.ink}` a 7.19 ratio. All text over the gradient uses ink — never
`{colors.meta}`, which fails on the saturated stops.

## Do's and Don'ts

### Do

- Keep the canvas `{colors.canvas}` ivory. Warm, never neutral grey.
- Set every display heading in uppercase Jost 300 with positive tracking.
- Keep body copy in the serif/mincho stack at line-height 2.0+.
- Use mono uppercase for every label, caption, button, and link.
- Use `{colors.accent}` exactly once per page, on the primary CTA.
- Frame project screenshots. Let the wash be the stage and the screenshot the exhibit.
- Keep 140px between editorial bands and give each stage a full viewport.
- Use `{colors.grad-*}` only inside the shader and `{colors.wash-*}` only as flat fills.

### Don't

- Don't add a gradient anywhere except the two WebGL stages.
- Don't add a shadow to anything. Hairlines carry all separation.
- Don't use a font weight above 400.
- Don't round any corner. 0px is the entire radius scale.
- Don't bleed project screenshots full-width — another designer's colours will
  overrun the palette and the type will lose its background.
- Don't tighten the display tracking. The positive spacing is the voice.
- Don't put `{colors.meta}` text on the gradient or on a saturated wash.
- Don't introduce a second accent colour, a semantic palette, or a status colour.
- Don't add traffic-light dots or browser chrome to the frame.
- Don't place two boxed buttons adjacent — the second becomes a `text-link`.

## Responsive

| Breakpoint | Changes |
|---|---|
| < 900px | Gutter 40 → 20px. display-xl 64 → 34px, display-lg 44 → 26px. Frame image height → `min(40vh, 360px)`. Spec cells 4-up → 2-up. Profile, career, and capabilities grids collapse to single column. Band padding 140 → 88px. |
| ≥ 900px | Full layout. |

Touch targets: buttons render 46px tall; nav and text links are padded to meet
44×44px.

Stages stay 100vh at every breakpoint. On short viewports the frame clamp is
what protects the layout — never let the stage scroll internally.

## Agent prompt guide

### Quick reference

```
Canvas          #FDFBF7   ivory, the only page background
Ink             #3A322D   warm dark brown, all headings
Body            #635850   running copy
Meta            #756A61   mono labels
Hairline        #EFE4DA / #DFD0C2
Accent          #E8A697   once per page, on the primary CTA only
Washes          #ECF7F2 / #FDF1E7 / #FDECEC / #FCF8E1
Display         Jost 300, UPPERCASE, +2–6px tracking
Body            EB Garamond / Zen Old Mincho, line-height 2.0+
Labels          IBM Plex Mono, UPPERCASE, +2–2.5px tracking
Radius          0px everywhere
Shadows         none
```

### Example prompts

**Project stage** — "Build a 100vh section on a flat `#ECF7F2` background.
Centre a column: an 11px IBM Plex Mono uppercase line with 2px tracking reading
the year and role, then a 44px Jost weight-300 uppercase title with 3px
tracking, then a 860px-wide white rectangle with a 1px `#DFD0C2` border and a
30px top bar holding a domain in 10px mono, then the tech stack in mono, then
an uppercase mono text link with a 1px underline. No shadows, no rounded
corners. A `01 / 06` mono counter sits top-right."

**Career row** — "A row with a 180px left column holding the period in 11px
mono uppercase, and a right column with the company in 24px Jost 300 uppercase
with 1.5px tracking, the role in mono below, and responsibilities as a list
whose markers are 6px-wide 1px `#DFD0C2` dashes. 40px vertical padding, 1px
`#DFD0C2` bottom border."

**Spec band** — "Four equal columns on `#ECF7F2`, each with a 64px Jost 300
number and a 10px mono uppercase label beneath, separated by 1px `#DFD0C2`
lines top and bottom. No fill on the cells, no borders between them."

### Iteration guide

1. Start from the canvas, ink, and the three typefaces. Get the tracking right
   before anything else — it is the whole identity.
2. Add hairlines for structure. Resist reaching for a card or a shadow.
3. Add a wash only when a section needs to be a distinct stage.
4. Add the accent last, once, and only on the primary CTA.
5. If a screen feels flat, the answer is more whitespace or larger type — never
   a shadow, a gradient, or a second colour.
