# msfs-tailwind

msfs-tailwind is Tailwind 3 for MSFS 2024's Coherent GT, the engine of the sim's cockpit panels, EFB, toolbar, in-game panels, and menu.
Coherent GT drops CSS it can't read without an error, and Tailwind 3 writes some of it: utilities for properties the engine lacks, such as `gap`, and every color as `rgb()` with spaces, such as `rgb(59 130 246 / 0.5)`, which the engine drops where it keeps `rgba()` with commas.
msfs-tailwind turns off what the engine drops whole and rewrites what it can, and [coherent-checks](https://github.com/dual-input/coherent-checks) fails the rest where you write it.
We built it for Dual Input, a shared cockpit for MSFS 2024, and publish it as it is, without support.

## Install

```bash
npm install --save-dev github:dual-input/msfs-tailwind postcss
```

npm's lockfile pins the commit it installed, and `npm update msfs-tailwind` takes the newest on `main`.
npm builds the package as it installs it, and fetches coherent-checks for its tests, so the first install of each commit takes a little longer.
It needs Node 22.18 or later.

## Use

```ts
import postcss from "postcss"
import msfsTailwind, { colorVar, plugins } from "msfs-tailwind"

const config = {
  presets: [msfsTailwind],
  content: ["src/**/*.tsx"],
  theme: { extend: { colors: { primary: colorVar("primary") } } },
}
const input = "@tailwind base;\n@tailwind components;\n@tailwind utilities;"
const { css } = await postcss(plugins(config)).process(input, { from: undefined })
```

- **The preset**, the default export, turns off Tailwind's preflight, and the 26 core plugins whose every utility Coherent GT drops, so their classes make no CSS, and a browser shows what the sim shows.
  `DROPPED_PLUGINS` lists them: `accentColor`, `aspectRatio`, the 10 `backdrop` plugins, `caretColor`, `contain`, `forcedColorAdjust`, `gap`, `overscrollBehavior`, `scrollBehavior`, `scrollMargin`, `scrollPadding`, the 3 `scrollSnap` plugins, `textDecorationThickness`, `textUnderlineOffset`, and `textWrap`.
- **`plugins(config)`** gives the PostCSS plugins in order: Tailwind with your config, autoprefixer for Chrome 49 and Safari 10, which adds the `-webkit-` forms the engine keeps where it drops the plain one, such as `-webkit-user-select`, and `output()`.
- **`output()`** writes every `rgb()` and `hsl()` with commas, so `bg-sky-300/80` comes out as `rgba(125, 211, 252, 0.8)`, and so do Tailwind's ring and shadow defaults, its gradients' transparent stops, and your arbitrary values.
  It also takes out the rule of `--tw-` defaults Tailwind writes for `::backdrop`, a selector the engine drops whole.
- **`colorVar(name)`** is a theme color held as an RGB triplet in a custom property, `--primary: 116, 212, 255`, which Tailwind's opacity modifiers then write as `rgba(var(--primary), 0.8)`.

With preflight off, `@tailwind base` writes only Tailwind's `--tw-` defaults, so bring a reset of your own.
In the EFB, scope it to your app's root, since a reset on the whole document would restyle the EFB around your app.

## What to write instead

A class of a plugin the preset turns off makes no CSS.
The rest that Coherent GT doesn't draw fail coherent-checks, each by its class's rule, when you run it on what you build, as msfs-tailwind's tests do:

```bash
npx coherent-check dist/app.css
```

| Doesn't draw in the sim | Instead |
| --- | --- |
| `gap-*` in a flex row, which makes no CSS | `space-x-*` and `space-y-*`, which space items with margins |
| `gap-*` in a grid, which makes no CSS | an arbitrary property, `[grid-gap:1rem]`, which the engine keeps in a grid |
| `inset-0`, `start-*`, and `end-*`, which fail | `inset-x-0 inset-y-0`, `left-*`, and `right-*` |
| `ms-*`, `me-*`, `ps-*`, `pe-*`, `rounded-s`, `rounded-e`, `border-s`, `border-e`, `float-start`, and `clear-start`, which fail | their left and right forms, such as `ml-*` and `rounded-l` |
| `flow-root`, `overflow-clip`, `whitespace-break-spaces`, and `h-dvh` with the other new viewport units, which fail | `block`, `overflow-hidden`, `whitespace-pre-wrap`, and `h-screen` |
| `contents`, `grid-cols-subgrid`, `line-clamp-none`, and `touch-none`, which fail | no class of Tailwind 3's does what these do |
| the variants `focus-visible:`, `has-[...]:`, `group-has-[...]:`, `marker:`, `file:`, `dark:`, `rtl:`, `ltr:`, `contrast-more:`, and `forced-colors:`, which fail | `focus:`, and for the rest a class or attribute your code sets |

## Where the measurements come from

Dual Input's probe p14 tried every CSS property, keyword, function, unit, selector, and at-rule MDN's mdn-data 2.37.2 lists, in MSFS 2024, Steam build 26058316, at the main menu on 2026-10-25, and coherent-checks passes only what it saw the engine keep.
Dual Input's probe p17 graded Tailwind 3's whole output against p14, and msfs-tailwind's tests rebuild it on the preset: every utility Tailwind 3 makes, each of its variants, and each plugin the preset turns off, graded by coherent-checks.
A test fails when what the check fails of that output changes, or when a plugin the preset turns off makes anything the engine keeps.

## Known gaps

- Tailwind 3 sets `--tw-ring-inset`, the filter defaults such as `--tw-blur`, and the gradient positions to an empty value, and rings, filters, and gradients rest on them; no probe has tried an empty custom property in Coherent GT.
- A keyword Tailwind puts in a custom property escapes the check, as `touch-pan-x` writes `--tw-pan-x: pan-x`, a keyword the engine drops where `touch-action` reads it.
- The check reads what the engine keeps and lays out, not what it paints, which only a screenshot in the sim shows.

## Develop

```bash
npm install
```

```bash
npm test
```

`npm test` type-checks the sources and tests, then runs the tests, which take about 20 seconds.
