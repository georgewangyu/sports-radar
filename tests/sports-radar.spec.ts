import { expect, test } from "@playwright/test";
import { moments } from "../lib/sports";

test.describe("Sports Radar", () => {
  test("catalog renders and lead unlock reveals the install command", async ({ page, context }) => {
    const payloads: Array<Record<string, unknown>> = [];

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.route("**/api/leads", async (route) => {
      payloads.push(JSON.parse(route.request().postData() || "{}") as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/");

    await expect(page).toHaveTitle("Sports Radar");
    await expect(page.getByRole("heading", { name: "Sports Radar", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top 5", level: 2 })).toBeVisible();
    await expect(page.getByText("Use Sports Radar in your agent.")).toBeVisible();
    await expect(page.getByText("npx skills add georgewangyu/sports-radar")).toBeHidden();

    await page.getByLabel("Name").fill("Example User");
    await page.getByRole("region", { name: "Use Sports Radar in your agent." })
      .getByLabel("Email")
      .fill("person@example.com");
    await page.getByRole("button", { name: "Unlock install command" }).click();
    await expect(page.getByRole("link", { name: "Star the repo" })).toHaveAttribute(
      "href",
      "https://github.com/georgewangyu/sports-radar",
    );
    await page.getByRole("button", { name: "Copy command" }).click();
    await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "npx skills add georgewangyu/sports-radar --skill sports-radar -g",
    );
    expect(payloads[0]).toMatchObject({ name: "Example User", email: "person@example.com" });
  });

  test("archive filters and submit form work", async ({ page }) => {
    await page.route("**/api/submit", async (route) => {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        submissionType: "submit-find",
        visibility: "public",
        title: "Mascot argument",
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, issueNumber: 42 }),
      });
    });

    await page.goto("/");

    await page.getByPlaceholder("Search burners, refs, fantasy apologies...").fill(moments[0].title);
    await expect(page.getByText(moments[0].title).first()).toBeVisible();

    await page.getByPlaceholder("Short title").fill("Mascot argument");
    await page
      .getByPlaceholder("Why does this belong on Sports Radar?")
      .fill("It has a clear sports internet punchline and enough context to summarize.");
    await page
      .getByPlaceholder("Drop the quote, joke, thread context, or rough explanation.")
      .fill("The moment has a specific quote and a funny fan reaction.");
    await page.locator(".submit-form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
    });

    await expect(page.getByText("Find sent for review.")).toBeVisible();
  });

  test("mobile layout has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    await expect(page.getByRole("link", { name: "Skill" })).toBeVisible();
  });
});
