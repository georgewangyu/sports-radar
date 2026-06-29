import type { SportsSubmission } from "./submission-schema";

const sourceRepo = "sports-radar";

const typeLabels: Record<SportsSubmission["submissionType"], string> = {
  "submit-find": "type:submit-find",
  "request-coverage": "type:request-coverage",
  "improve-note": "type:improve-note",
};

const typeTitles: Record<SportsSubmission["submissionType"], string> = {
  "submit-find": "Submit find",
  "request-coverage": "Request coverage",
  "improve-note": "Improve note",
};

function compactTitle(input: string) {
  const singleLine = input.replace(/\s+/g, " ").trim();
  return singleLine.length > 78 ? `${singleLine.slice(0, 75)}...` : singleLine;
}

export function issueTitle(submission: SportsSubmission) {
  return `[sports-radar:${submission.submissionType}] ${compactTitle(submission.title)}`;
}

export function issueLabels(submission: SportsSubmission) {
  return [
    sourceRepo,
    `source-repo:${sourceRepo}`,
    "status:needs-triage",
    typeLabels[submission.submissionType],
    `visibility:${submission.visibility}`,
  ];
}

export function issueBody(submission: SportsSubmission) {
  const handle = submission.handle || "_Anonymous / not provided_";
  const context = submission.context || "_Not provided_";
  const visibility =
    submission.visibility === "private" ? "Private review issue" : "Public GitHub issue";

  return [
    "## Sports Radar submission",
    "",
    `**Type:** ${typeTitles[submission.submissionType]}`,
    `**Source repo:** ${sourceRepo}`,
    `**Visibility:** ${visibility}`,
    `**Handle:** ${handle}`,
    "",
    "## Find or topic",
    "",
    submission.title,
    "",
    "## Why this belongs",
    "",
    submission.outcome,
    "",
    "## Rough note or context",
    "",
    submission.notes,
    "",
    "## Link or source",
    "",
    context,
    "",
    "## Triage checklist",
    "",
    "- [ ] Check whether this is already in the public archive",
    "- [ ] Verify the source link, quote, and public-safe framing",
    "- [ ] Decide whether it belongs in the daily Top 5, archive, or backlog",
    "- [ ] Add league, source, heat, tags, and why-it-works notes before publishing",
  ].join("\n");
}

export async function createGitHubIssue(submission: SportsSubmission) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo =
    submission.visibility === "private"
      ? process.env.GITHUB_PRIVATE_REPO
      : process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub issue environment configuration.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": process.env.GITHUB_API_VERSION || "2022-11-28",
      },
      body: JSON.stringify({
        title: issueTitle(submission),
        body: issueBody(submission),
        labels: issueLabels(submission),
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub issue creation failed: ${response.status} ${body}`);
  }

  return (await response.json()) as { html_url: string; number: number };
}
