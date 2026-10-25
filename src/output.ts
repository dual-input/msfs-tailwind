// The step after Tailwind and autoprefixer, which fixes what Tailwind 3 writes and Coherent GT
// can't read. Tailwind writes each color as `rgb()` with spaces and a slash, such as
// `rgb(59 130 246 / 0.5)`, for its palette, its ring and shadow defaults, and its gradients'
// transparent stops, and the engine drops that form while it keeps `rgba()` with commas, so
// this writes every `rgb()` and `hsl()` with commas. Tailwind also writes a rule of `--tw-`
// defaults for `::backdrop`, a selector the engine drops whole, which this takes out (Dual
// Input, record/areas/architecture/log.md, "2026-10-25: Coherent GT keeps 304 of the 554 CSS
// properties Chromium 152 keeps, and lays out flexbox and grid as Chromium does but for `gap`,
// `justify-content: end`, and subgrid").

import type { Plugin } from "postcss"
import valueParser from "postcss-value-parser"

export function output(): Plugin {
  return {
    postcssPlugin: "msfs-tailwind",
    Declaration(decl) {
      if (/\b(rgb|hsl)a?\(/i.test(decl.value)) decl.value = withCommas(decl.value)
    },
    Rule(rule) {
      // Only Tailwind's own: a ::backdrop rule of the page's stays, for the Coherent GT check to fail.
      if (rule.selector.trim() === "::backdrop" && rule.nodes.every((n) => n.type === "decl" && n.prop.startsWith("--tw-"))) rule.remove()
    },
  }
}

/** A value with each `rgb(1 2 3 / 0.5)` written as `rgba(1, 2, 3, 0.5)`, and each `hsl()` likewise. */
export function withCommas(value: string): string {
  const parsed = valueParser(value)
  parsed.walk((node) => {
    if (node.type !== "function" || !/^(rgb|hsl)a?$/i.test(node.value)) return
    if (node.nodes.some((n) => n.type === "div" && n.value === ",")) return
    const channels: string[] = []
    let alpha: string | undefined
    for (const n of node.nodes) {
      if (n.type === "space") continue
      if (n.type === "div" && n.value === "/") alpha = ""
      else if (alpha === "") alpha = valueParser.stringify(n)
      else channels.push(valueParser.stringify(n))
    }
    // An alpha as a percent is a form the engine drops too, so it becomes a number.
    if (alpha?.endsWith("%")) alpha = String(parseFloat(alpha) / 100)
    const name = node.value.toLowerCase().replace(/a$/, "")
    node.value = alpha ? `${name}a` : name
    node.nodes = valueParser([...channels, ...(alpha ? [alpha] : [])].join(", ")).nodes
  })
  return parsed.toString()
}
