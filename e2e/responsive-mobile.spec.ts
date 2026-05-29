import { expect, test, type Page, type TestInfo } from "@playwright/test";

const pagesToScreenshot = [
  { name: "home", path: "/" },
  { name: "marketplace", path: "/marketplace" },
  { name: "submit", path: "/submit" },
  { name: "dashboard", path: "/dashboard" },
  { name: "wallet", path: "/" },
];

async function screenshotPage(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`${testInfo.project.name}-${name}.png`),
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
}

async function expectTouchTargets(page: Page) {
  const tooSmall = await page
    .locator("nav button:visible, nav a:visible, main button:visible, main input:visible, main select:visible, main textarea:visible")
    .evaluateAll((elements) =>
      elements
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const label =
            element.getAttribute("aria-label") ||
            element.textContent?.trim() ||
            element.getAttribute("placeholder") ||
            element.tagName;
          return { label, width: Math.round(rect.width), height: Math.round(rect.height) };
        })
        .filter((target) => target.width < 44 || target.height < 44),
    );

  expect(tooSmall).toEqual([]);
}

test.describe("mobile responsive layout", () => {
  test("navigation menu collapses and expands", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Open navigation menu").click();
    await expect(page.locator("#mobile-navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await page.getByLabel("Close navigation menu").click();
    await expect(page.locator("#mobile-navigation")).toBeHidden();
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);
    await screenshotPage(page, testInfo, "navigation");
  });

  test("marketplace layout fits mobile cards or empty state", async ({ page }, testInfo) => {
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /invoice marketplace/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);
    await screenshotPage(page, testInfo, "marketplace");
  });

  test("invoice form remains usable on mobile", async ({ page }, testInfo) => {
    await page.goto("/submit", { waitUntil: "domcontentloaded" });
    await expect(page.getByPlaceholder("G...")).toBeVisible();
    await expect(page.getByPlaceholder("5000.00").first()).toBeVisible();
    await expect(page.getByLabel("Due date").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);
    await screenshotPage(page, testInfo, "invoice-form");
  });

  test("dashboard table stays horizontally scrollable", async ({ page }, testInfo) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const tableScroller = page.locator(".overflow-x-auto").first();
    await expect(tableScroller).toBeVisible();
    await expect(tableScroller).toHaveCSS("overflow-x", "auto");
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);
    await screenshotPage(page, testInfo, "dashboard-table");
  });

  test("wallet connection modal opens from mobile menu", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Open navigation menu").click();
    await page.getByRole("button", { name: /connect wallet/i }).click();
    await expect(page.getByRole("button", { name: /freighter/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /walletconnect/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);
    await screenshotPage(page, testInfo, "wallet-modal");
  });

  for (const target of pagesToScreenshot) {
    test(`captures ${target.name} screenshot artifact`, async ({ page }, testInfo) => {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      if (target.name === "wallet") {
        await page.getByLabel("Open navigation menu").click();
      }
      await screenshotPage(page, testInfo, target.name);
    });
  }
});
