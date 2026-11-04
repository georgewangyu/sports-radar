import { describe, expect, test } from "vitest";
import { issueBody, issueLabels, issueTitle } from "@/lib/github-issue";
import { parseSportsSubmission, type SportsSubmission } from "@/lib/submission-schema";

function parsed(overrides: Record<string, unknown> = {}): SportsSubmission {
  const result = parseSportsSubmission({
    submissionType: "request-coverage",
    title: "  Bench mob celebrates a half-court buzzer beater  ",
    outcome: "The whole thread lost it within minutes.",
    notes: "Clip is on the league channel already.",
    ...overrides,
  });
  if (!result.success) throw new Error(JSON.stringify(result.issues));
  return result.data;
}

describe("parseSportsSubmission", () => {
  test("trims fields and defaults visibility, context, handle and honeypot", () => {
    expect(parsed()).toEqual({
      submissionType: "request-coverage",
      visibility: "public",
      title: "Bench mob celebrates a half-court buzzer beater",
      outcome: "The whole thread lost it within minutes.",
      notes: "Clip is on the league channel already.",
      context: "",
      handle: "",
      website: "",
    });
  });

  test("unknown type and visibility fall back to submit-find and public", () => {
    const data = parsed({ submissionType: "hack", visibility: "secret" });
    expect(data.submissionType).toBe("submit-find");
    expect(data.visibility).toBe("public");
  });

  test("reports length and honeypot violations by field", () => {
    const result = parseSportsSubmission({
      title: "x",
      outcome: "short",
      notes: "short",
      context: "c".repeat(1001),
      handle: "h".repeat(121),
      website: "bot",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.issues).sort()).toEqual(
      ["context", "handle", "notes", "outcome", "title", "website"],
    );
    expect(result.issues.website).toEqual(["Leave this field empty."]);
  });
});

describe("issue formatting", () => {
  test("title is prefixed by type and compacted to 78 chars", () => {
    const title = issueTitle(parsed({ title: "word ".repeat(20) }));
    expect(title.startsWith("[sports-radar:request-coverage] ")).toBe(true);
    expect(title.endsWith("...")).toBe(true);
    expect(title.length).toBe("[sports-radar:request-coverage] ".length + 78);
  });

  test("labels carry repo, triage, type and visibility", () => {
    expect(issueLabels(parsed({ visibility: "private" }))).toEqual([
      "sports-radar",
      "source-repo:sports-radar",
      "status:needs-triage",
      "type:request-coverage",
      "visibility:private",
    ]);
  });

  test("body shows placeholders for missing handle and context", () => {
    const body = issueBody(parsed());
    expect(body).toContain("**Type:** Request coverage");
    expect(body).toContain("**Handle:** _Anonymous / not provided_");
    expect(body).toContain("## Link or source\n\n_Not provided_");
    expect(body).toContain("## Find or topic\n\nBench mob celebrates a half-court buzzer beater");
    expect(body).toContain("## Rough note or context\n\nClip is on the league channel already.");
    expect(body).toContain("**Visibility:** Public GitHub issue");
  });
});
