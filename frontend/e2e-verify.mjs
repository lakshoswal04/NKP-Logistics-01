import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const OUT = process.env.OUT;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

// 1. Home
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(2200); // let hero animation finish
await page.screenshot({ path: OUT + "/01-home.png" });

// 2. Tracking happy path via the hero input
await page.fill("#hero-track", "NKP2026A1B2");
await page.click("#hero-track >> xpath=../button");
await page.waitForURL("**/track?id=NKP2026A1B2");
await page.waitForSelector("text=In transit on planned route", { timeout: 10000 });
await page.screenshot({ path: OUT + "/02-track.png" });
console.log("TRACK OK:", await page.textContent("h2.font-display"));

// 3. Tracking not-found probe
await page.goto(BASE + "/track?id=NKPDOESNOTEXIST", { waitUntil: "networkidle" });
await page.waitForSelector("text=No shipment found", { timeout: 10000 });
console.log("NOTFOUND OK");

// 4. Contact form with instant quote
await page.goto(BASE + "/contact?service=B2B%20Transportation", { waitUntil: "networkidle" });
const svc = await page.inputValue("#service");
console.log("PREFILL:", svc);
await page.fill("#full_name", "Playwright Tester");
await page.fill("#email", "pw@test.example");
await page.fill("#origin_city", "Mumbai");
await page.fill("#destination_city", "Bengaluru");
await page.fill("#weight_kg", "750");
await page.selectOption("#shipment_type", "express");
await page.fill("#message", "E2E verification run");
await page.click("button[type=submit]");
await page.waitForSelector("text=Request received", { timeout: 10000 });
const range = await page.textContent("p.font-display");
console.log("QUOTE:", range?.trim());
await page.screenshot({ path: OUT + "/03-contact-success.png" });

// 5. Mobile viewport probe on home
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto(BASE + "/", { waitUntil: "networkidle" });
await mob.click("button[aria-label='Open menu']");
await mob.screenshot({ path: OUT + "/04-mobile-menu.png" });
console.log("MOBILE OK");

await browser.close();
console.log("E2E DONE");
