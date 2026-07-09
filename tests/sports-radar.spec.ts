import { expect, test } from "@playwright/test";
import { moments } from "../lib/sports";

const archivePageSize = 3;

function momentMatchesQuery(moment: (typeof moments)[number], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const haystack = [
    moment.title,
    moment.league,
    moment.source,
    moment.status,
    moment.summary,
    moment.whyFunny,
    moment.quote,
    moment.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

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
    await expect(page.getByRole("heading", { name: "Today's Five", level: 2 })).toBeVisible();
    await expect(
      page.locator(".top-five-list").getByRole("link", { name: new RegExp(moments[0].title) }),
    ).toHaveAttribute("href", `/moments/${moments[0].id}`);
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

  test("moment rows navigate to standalone detail pages", async ({ page }) => {
    await page.goto("/");

    await page
      .locator(".top-five-list")
      .getByRole("link", { name: new RegExp(moments[0].title) })
      .click();
    await expect(page).toHaveURL(new RegExp(`/moments/${moments[0].id}$`));
    await expect(page.getByRole("heading", { name: moments[0].title, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What the thread adds", level: 2 })).toBeVisible();

    await page.goto("/");
    await page.getByPlaceholder("Search burners, refs, fantasy apologies...").fill(moments[1].title);
    await page
      .locator(".archive-table")
      .getByRole("link", { name: new RegExp(moments[1].title) })
      .click();
    await expect(page).toHaveURL(new RegExp(`/moments/${moments[1].id}$`));
  });

  test("archive pagination moves through finds and resets for search", async ({ page }) => {
    const secondPageEnd = Math.min(archivePageSize * 2, moments.length);
    const uniqueQuery =
      moments.find((moment) => moments.filter((item) => momentMatchesQuery(item, moment.title)).length === 1)
        ?.title || moments[0].title;
    const uniqueQueryCount = moments.filter((moment) => momentMatchesQuery(moment, uniqueQuery)).length;

    await page.goto("/");

    await expect(page.getByText(`Page 1 of ${Math.ceil(moments.length / archivePageSize)}`)).toBeVisible();
    await expect(page.getByText(`showing 1-${archivePageSize}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Page 2 of")).toBeVisible();
    await expect(page.getByText(`showing ${archivePageSize + 1}-${secondPageEnd}`)).toBeVisible();

    await page.getByPlaceholder("Search burners, refs, fantasy apologies...").fill(uniqueQuery);
    await expect(page.getByText(`${uniqueQueryCount} matching finds`)).toBeVisible();
    await expect(page.getByText("Page 1 of")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
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
