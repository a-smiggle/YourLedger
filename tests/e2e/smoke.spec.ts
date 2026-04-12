import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", heading: /Understand your borrowing position with clear, conservative home loan planning\./i },
  { path: "/dashboard", heading: /Borrowing power, cashflow, and loan planning in one local-first workspace\./i },
  { path: "/scenarios", heading: /Deal fit comparison/i },
  { path: "/results", text: /Saved scenarios/i },
  { path: "/data-management", heading: /Local data controls/i },
];

for (const route of routes) {
  test(`renders ${route.path}`, async ({ page }) => {
    await page.goto(route.path);

    if ("heading" in route) {
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible({ timeout: 15000 });
      return;
    }

    await expect(page.getByText(route.text)).toBeVisible({ timeout: 15000 });
  });
}