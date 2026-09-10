#!/usr/bin/env node
/**
 * Fail on a reference to a design-system utility or CSS variable that no longer
 * exists.
 *
 * Tailwind emits nothing for an unknown utility and reports no error. A rename
 * in globals.css (`hero-scrim-soft` -> `cine-scrim-soft`) therefore removed a
 * hero's entire scrim silently, and it shipped. This checks the two things that
 * fail that way: our own named utilities, and var(--color-*) / var(--radius-*)
 * references inside inline SVG.
 *
 * It deliberately does NOT try to validate every Tailwind class — that needs
 * Tailwind's own resolver, and a hand-rolled approximation produces false
 * positives that get ignored, which is worse than no check.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");

const utilities = new Set([...css.matchAll(/@utility\s+([a-z0-9-]+)/g)].map((m) => m[1]));
const cssVars = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

/** Our utilities are named with these stems; anything matching must resolve. */
const OWN = /^(cine-|hero-|corner-cut|glass-|photo-|rule-|chip-|band-|eyebrow$|animate-(ticker|ken-burns|fade-up))/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if ([".tsx", ".ts"].includes(extname(entry))) yield full;
  }
}

const problems = [];

for (const file of [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))]) {
  const lines = readFileSync(file, "utf8").split("\n");

  lines.forEach((line, i) => {
    const where = `${relative(ROOT, file)}:${i + 1}`;

    // Our own named utilities — only inside className values, so that an image
    // path such as "/media/hero-dock.jpg" is not mistaken for a `hero-` utility.
    for (const attr of line.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const blob = attr[1] ?? attr[2] ?? "";
      for (const m of blob.matchAll(/[\w-]+/g)) {
        const token = m[0];
        if (!OWN.test(token) || utilities.has(token)) continue;
        problems.push({ where, token, why: "no matching @utility in globals.css" });
      }
    }

    // CSS variables used from inline SVG or style attributes.
    for (const m of line.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      if (!cssVars.has(m[1])) {
        problems.push({ where, token: m[0], why: "variable is not defined in globals.css" });
      }
    }
  });
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} dead design-system reference(s):\n`);
  for (const p of problems) console.error(`  ${p.where}\n      ${p.token} — ${p.why}\n`);
  process.exit(1);
}
console.log(`✓ design tokens resolve (${utilities.size} utilities, ${cssVars.size} variables)`);
