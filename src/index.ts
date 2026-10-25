// Tailwind 3 for MSFS 2024's Coherent GT, the engine of the sim's panels, EFB, and toolbar.
// The engine drops CSS it can't read without an error, and Tailwind 3 writes some of it:
// utilities for properties the engine lacks, and colors in a form it doesn't read. So the
// preset turns off the core plugins whose every utility the engine drops, and `plugins()`
// runs Tailwind with autoprefixer and a step that writes its colors in a form the engine keeps
// (Dual Input, record/areas/interface/decisions.md, "Tailwind 3 reaches the kit through
// msfs-tailwind, a preset of our own for Coherent GT").

import autoprefixer from "autoprefixer"
import type { AcceptedPlugin } from "postcss"
import tailwindcss, { type Config } from "tailwindcss"

import { output } from "./output.ts"

export { output, withCommas } from "./output.ts"

/**
 * The core plugins whose every utility Coherent GT drops, by the Coherent GT check over each
 * plugin's whole output (test/preset.test.ts), so they make no CSS, and a browser shows what
 * the sim shows. `scrollSnapType` is among them, since the only utilities of it the engine
 * keeps, `snap-mandatory` and `snap-proximity`, set a custom property its dropped ones read.
 */
export const DROPPED_PLUGINS = [
  "accentColor",
  "aspectRatio",
  "backdropBlur",
  "backdropBrightness",
  "backdropContrast",
  "backdropFilter",
  "backdropGrayscale",
  "backdropHueRotate",
  "backdropInvert",
  "backdropOpacity",
  "backdropSaturate",
  "backdropSepia",
  "caretColor",
  "contain",
  "forcedColorAdjust",
  "gap",
  "overscrollBehavior",
  "scrollBehavior",
  "scrollMargin",
  "scrollPadding",
  "scrollSnapAlign",
  "scrollSnapStop",
  "scrollSnapType",
  "textDecorationThickness",
  "textUnderlineOffset",
  "textWrap",
] as const

/**
 * The preset. Preflight goes too: the engine drops parts of it, such as its `:where()` rules,
 * and an EFB app that brought it would restyle the EFB around itself.
 */
const preset: Partial<Config> = {
  corePlugins: Object.fromEntries([["preflight", false], ...DROPPED_PLUGINS.map((name) => [name, false])]),
}
export default preset

/**
 * The browsers autoprefixer writes for. Coherent GT's user agent names Chrome 49, and its
 * makers last placed it near Safari 10.1, so autoprefixer adds the `-webkit-` forms the engine
 * keeps where it drops the plain one, such as `-webkit-user-select` (Dual Input,
 * record/areas/architecture/log.md, "2026-10-09: Coherent GT's makers last placed its engine
 * near Safari 10.1, the MSFS Avionics Framework and FlyByWire compile to ES2017, nobody
 * maintains a rule set for the engine, and Working Title ships its own pinned copy of the
 * framework").
 */
export const BROWSERS = ["chrome 49", "safari 10"]

/**
 * The PostCSS plugins that build a stylesheet for Coherent GT from a Tailwind config: Tailwind,
 * autoprefixer, and `output()`, which rewrites each declaration before autoprefixer copies it.
 */
export function plugins(config: Config): AcceptedPlugin[] {
  return [tailwindcss(config), autoprefixer({ overrideBrowserslist: BROWSERS }), output()]
}

/**
 * A theme color held as an RGB triplet in a custom property, such as `--primary: 116, 212, 255`,
 * which Tailwind's opacity modifiers then write as `rgba(var(--primary), 0.8)`.
 */
export function colorVar(name: string): string {
  return `rgba(var(--${name}), <alpha-value>)`
}
