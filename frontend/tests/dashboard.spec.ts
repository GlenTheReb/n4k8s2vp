import { test, expect } from "@playwright/test";

test("dashboard, cutoff changes, interval audit, CSV, navigation and January boundary", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Wind generation", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".metric").first()).toContainText("24");
  const original = await page.locator(".metrics").innerText();
  await page.getByLabel("Cutoff time (UK)", { exact: true }).fill("06:00");
  await page.getByRole("button", { name: "Apply cutoff" }).click();
  await expect(page.locator(".applied-context")).toContainText("06:00");
  await expect(page.locator(".metrics")).not.toHaveText(original);
  await page.getByLabel("Decision date", { exact: true }).fill("2026-01-31");
  await page.getByRole("button", { name: "Apply cutoff" }).click();
  await expect(page.locator(".applied-context")).toContainText("01 Feb 2026");
  await page.getByLabel("Include missing forecasts").check();
  await page.getByRole("button", { name: "Inspect 01 Feb, 00:30" }).click();
  await expect(page.getByLabel("Selected delivery interval")).toHaveValue(
    "2026-02-01T00:30:00Z",
  );
  await expect(page.locator(".inspector")).toContainText("Unavailable");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("2026-01-31");
  await page
    .getByRole("link", { name: "Forecast Accuracy", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Daily accuracy", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".sample-caption")).toContainText("744 matched");
  await page
    .getByLabel("From decision date", { exact: true })
    .fill("2026-01-10");
  await page.getByLabel("To decision date", { exact: true }).fill("2026-01-12");
  await page.getByRole("button", { name: "Apply cutoff" }).click();
  await expect(page.locator(".sample-caption")).toContainText("72 matched");
  await page
    .getByRole("link", { name: "Decision Insights", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Direction of forecast error" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Source, coverage & assumptions" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Three timestamps. One auditable decision.",
    }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
  expect(errors).toEqual([]);
});

test("loading, failed API, retry and empty observations", async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/analysis?**", async (route) => {
    await gate;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Historical data cache is unavailable." }),
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Reconstructing the decision" }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", { name: "Historical data could not be loaded" }),
  ).toBeVisible();
  await page.unroute("**/api/analysis?**");
  await page.getByRole("button", { name: "Retry data request" }).click();
  await expect(
    page.getByRole("heading", { name: "Wind generation", exact: true }),
  ).toBeVisible();
  // Test-only response transformation. The production application always uses Elexon data.
  await page.route("**/api/analysis?**", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.intervals = data.intervals.map((r: Record<string, unknown>) => ({
      ...r,
      forecast_mw: null,
      publish_time: null,
      error_mw: null,
      forecast_age_hours: null,
      lead_time_hours: null,
    }));
    data.metrics = {
      ...data.metrics,
      sample_count: 0,
      eligible_forecasts: 0,
      coverage_percent: 0,
      eligible_match_percent: null,
      mae_mw: null,
      rmse_mw: null,
      bias_mw: null,
      p90_absolute_error_mw: null,
    };
    await route.fulfill({ response, json: data });
  });
  await page.getByRole("button", { name: "Apply cutoff" }).click();
  // A fresh cutoff causes the request, rather than submitting unchanged state.
  await page.getByLabel("Cutoff time (UK)", { exact: true }).fill("00:01");
  await page.getByRole("button", { name: "Apply cutoff" }).click();
  await expect(
    page.getByText(
      "No matched forecast and actual observations at this cutoff.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("No eligible forecasts at this cutoff.", { exact: false }),
  ).toBeVisible();
});

test("mobile layout, keyboard access and cleared dates stay usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Wind generation", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.getByLabel("Decision date", { exact: true }).fill("");
  await expect(page.getByText("Select a date")).toBeVisible();
  await page.getByLabel("Decision date", { exact: true }).fill("2026-01-01");
  await page.getByRole("button", { name: "Apply cutoff" }).click();
  await expect(page.locator(".applied-context")).toContainText("01 Jan 2026");
  await page
    .getByRole("link", { name: "Forecast Accuracy", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Daily accuracy", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
