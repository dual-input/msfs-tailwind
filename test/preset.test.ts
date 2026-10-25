// Dual Input's probe p17, rebuilt on the preset: Tailwind 3's every utility and each of its
// variants, graded by the Coherent GT check, which passes only what Dual Input's probe p14
// measured the engine keeping (read in Dual Input, experiments/areas/interface/p17-tailwind3).
// p17's third run, over shadcn's components, isn't here, since they're Tailwind 4's.

import assert from "node:assert/strict"
import { test } from "node:test"

import { checkCss } from "coherent-checks"
import postcss from "postcss"
import type { Config } from "tailwindcss"

import preset, { colorVar, DROPPED_PLUGINS, plugins, withCommas } from "../src/index.ts"

const ALL = "@tailwind base;\n@tailwind components;\n@tailwind utilities;"

async function build(config: Omit<Config, "content"> & { content?: string }, input = ALL): Promise<string> {
  const { content = "", ...rest } = config
  const full = { presets: [preset], ...rest, content: [{ raw: content, extension: "html" }] } as Config
  return (await postcss(plugins(full)).process(input, { from: undefined })).css
}

/** Each finding's message without the rule it sits in, once each. */
function reasons(css: string): string[] {
  return [...new Set(checkCss(css).map((f) => f.message.replace(/, in [^,]*$/, "")))].sort()
}

const UNTESTED = "is untested in Coherent GT, so count on it nowhere until a probe measures it"

// What the check fails of the preset's whole output: utilities of plugins the engine
// otherwise keeps, which a developer meets by name in the check's findings.
const RESIDUE = [
  // ms-, me-, ps-, pe-, start-, end-, and inset-, with autoprefixer's -webkit- forms
  "margin-inline-start is dropped by Coherent GT",
  "margin-inline-end is dropped by Coherent GT",
  `-webkit-margin-start ${UNTESTED}`,
  `-webkit-margin-end ${UNTESTED}`,
  "padding-inline-start is dropped by Coherent GT",
  "padding-inline-end is dropped by Coherent GT",
  `-webkit-padding-start ${UNTESTED}`,
  `-webkit-padding-end ${UNTESTED}`,
  "inset is dropped by Coherent GT",
  "inset-inline-start is dropped by Coherent GT",
  "inset-inline-end is dropped by Coherent GT",
  // rounded-s, rounded-e, and their corners; border-s and border-e, with their colors
  "border-start-start-radius is dropped by Coherent GT",
  "border-start-end-radius is dropped by Coherent GT",
  "border-end-start-radius is dropped by Coherent GT",
  "border-end-end-radius is dropped by Coherent GT",
  "border-inline-start-width is dropped by Coherent GT",
  "border-inline-end-width is dropped by Coherent GT",
  "border-inline-start-color is dropped by Coherent GT",
  "border-inline-end-color is dropped by Coherent GT",
  // float-start, float-end, clear-start, clear-end
  "float: inline-start is dropped by Coherent GT",
  "float: inline-end is dropped by Coherent GT",
  "clear: inline-start is dropped by Coherent GT",
  "clear: inline-end is dropped by Coherent GT",
  // h-dvh, w-svw, and the rest of the newer viewport units
  "the dvh unit is dropped by Coherent GT",
  "the lvh unit is dropped by Coherent GT",
  "the svh unit is dropped by Coherent GT",
  "the dvw unit is dropped by Coherent GT",
  "the lvw unit is dropped by Coherent GT",
  "the svw unit is dropped by Coherent GT",
  // flow-root, contents, grid-cols-subgrid, overflow-clip, whitespace-break-spaces, line-clamp-none, touch-none
  "display: flow-root is dropped by Coherent GT",
  "display: contents parses in Coherent GT and then computes as inline",
  "grid-template-columns: subgrid is dropped by Coherent GT",
  "grid-template-rows: subgrid is dropped by Coherent GT",
  "overflow: clip is dropped by Coherent GT",
  "overflow-x: clip is dropped by Coherent GT",
  "overflow-y: clip is dropped by Coherent GT",
  "white-space: break-spaces is dropped by Coherent GT",
  "-webkit-line-clamp: none is dropped by Coherent GT",
  "touch-action: none is dropped by Coherent GT",
].sort()

test("the check passes every utility the preset makes, but the logical ones and a few values of kept plugins", async () => {
  const css = await build({ content: "", safelist: [{ pattern: /.*/ }] })
  assert.deepEqual(reasons(css), RESIDUE)
})

// p17's variants, with each one the engine drops for a selector or media query it can't read.
const VARIANTS = ["hover", "focus", "focus-visible", "focus-within", "active", "visited", "disabled", "enabled", "checked", "indeterminate", "required", "invalid", "read-only", "placeholder-shown", "empty", "target", "first", "last", "only", "odd", "even", "first-of-type", "group-hover", "peer-checked", "placeholder", "file", "marker", "selection", "before", "after", "open", "aria-checked", "aria-[expanded=true]", "data-[state=open]", "has-[:checked]", "group-has-[:checked]", "supports-[display:grid]", "motion-safe", "motion-reduce", "contrast-more", "forced-colors", "dark", "print", "portrait", "landscape", "rtl", "ltr", "sm", "md", "lg", "xl", "2xl", "max-md", "min-[400px]", "*"]
const DROPPED_VARIANTS = new Set(["focus-visible", "file", "marker", "has-[:checked]", "group-has-[:checked]", "contrast-more", "forced-colors", "dark", "rtl", "ltr"])

test("the check passes every variant p17 kept, and fails focus-visible, has-, dark, and the rest it dropped", async () => {
  const wrong: string[] = []
  for (const variant of VARIANTS) {
    const failed = reasons(await build({ content: `${variant}:underline` }, "@tailwind utilities;")).length > 0
    if (failed !== DROPPED_VARIANTS.has(variant)) wrong.push(`${variant}: the check ${failed ? "failed" : "passed"} it`)
  }
  assert.deepEqual(wrong, [])
})

test("each plugin the preset turns off makes only what Coherent GT drops", async () => {
  // snap-mandatory and snap-proximity set only the custom property snap-x and snap-y read.
  const feeders = new Set([".snap-mandatory", ".snap-proximity"])
  const kept: string[] = []
  for (const name of DROPPED_PLUGINS) {
    const css = await build({ presets: [], corePlugins: [name], safelist: [{ pattern: /.*/ }], content: "" }, "@tailwind utilities;")
    postcss.parse(css).each((node) => {
      if (node.type === "rule" && feeders.has(node.selector)) return
      if (!checkCss(node.toString()).length) kept.push(`${name}: ${node.toString().replace(/\s+/g, " ")}`)
    })
  }
  assert.deepEqual(kept, [])
})

test("every color comes out with commas, from the palette, an arbitrary value, a custom property, and Tailwind's own defaults", async () => {
  const content = "bg-sky-300/80 bg-[#123456]/50 bg-primary/50 shadow-md ring-2 from-transparent to-sky-300 drop-shadow-md select-none"
  const css = await build({ content, theme: { extend: { colors: { primary: colorVar("primary") } } } })
  for (const color of ["rgba(125, 211, 252, 0.8)", "rgba(18, 52, 86, 0.5)", "rgba(var(--primary), 0.5)", "rgba(0, 0, 0, 0.1)", "rgba(59, 130, 246, 0.5)", "-webkit-user-select: none"]) {
    assert.ok(css.includes(color), `the stylesheet holds no ${color}`)
  }
  assert.deepEqual(reasons(css), [])
})

test("the output step writes rgb() and hsl() with commas, and takes out only Tailwind's ::backdrop defaults", async () => {
  assert.equal(withCommas("rgb(1 2 3 / 50%)"), "rgba(1, 2, 3, 0.5)")
  assert.equal(withCommas("0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"), "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)")
  assert.equal(withCommas("rgb(0 0 0 / var(--tw-bg-opacity, 1))"), "rgba(0, 0, 0, var(--tw-bg-opacity, 1))")
  assert.equal(withCommas("hsl(120 50% 50%)"), "hsl(120, 50%, 50%)")
  assert.equal(withCommas("rgba(1, 2, 3, 0.5)"), "rgba(1, 2, 3, 0.5)")
  const css = await build({ content: "underline" }, `${ALL}\n.dialog::backdrop { background: black }`)
  assert.ok(!/(^|\n)::backdrop/.test(css), "Tailwind's ::backdrop defaults are still there")
  assert.deepEqual(reasons(css), ["::backdrop is dropped by Coherent GT, which drops the whole rule"])
})
