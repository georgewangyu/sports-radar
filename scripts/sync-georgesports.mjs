import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceDir = path.resolve(rootDir, "../georgesports/finds");
const outFile = path.resolve(rootDir, "data/sports-moments.json");
const checkOnly = process.argv.includes("--check");

const requiredFields = [
  "id",
  "rank",
  "title",
  "league",
  "source",
  "status",
  "date",
  "heat",
  "tags",
  "public_ready",
];

function parseScalar(value) {
  const trimmed = value.trim();

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFrontmatter(markdown, filePath) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    throw new Error(`${filePath}: missing frontmatter`);
  }

  const fields = {};
  const lines = match[1].split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);

    if (!keyMatch) {
      throw new Error(`${filePath}: cannot parse frontmatter line "${line}"`);
    }

    const [, key, rawValue = ""] = keyMatch;

    if (rawValue.trim() === "") {
      const list = [];
      while (lines[index + 1]?.startsWith("  - ")) {
        index += 1;
        list.push(parseScalar(lines[index].slice(4)));
      }
      fields[key] = list;
      continue;
    }

    fields[key] = parseScalar(rawValue);
  }

  return { fields, body: markdown.slice(match[0].length) };
}

function section(body, heading, filePath) {
  const headingLine = `## ${heading}`;
  const start = body.indexOf(headingLine);

  if (start === -1) {
    throw new Error(`${filePath}: missing section "${heading}"`);
  }

  const contentStart = body.indexOf("\n", start + headingLine.length);
  const nextHeading = body.indexOf("\n## ", contentStart + 1);
  const contentEnd = nextHeading === -1 ? body.length : nextHeading;

  return body.slice(contentStart + 1, contentEnd).trim();
}

function optionalSection(body, heading) {
  const headingLine = `## ${heading}`;
  const start = body.indexOf(headingLine);

  if (start === -1) {
    return "";
  }

  const contentStart = body.indexOf("\n", start + headingLine.length);
  const nextHeading = body.indexOf("\n## ", contentStart + 1);
  const contentEnd = nextHeading === -1 ? body.length : nextHeading;

  return body.slice(contentStart + 1, contentEnd).trim();
}

function bulletBlocks(sectionText) {
  const blocks = [];
  let current = [];

  for (const line of sectionText.split("\n")) {
    if (line.startsWith("- ")) {
      if (current.length > 0) blocks.push(current.join("\n"));
      current = [line];
    } else if (current.length > 0 && (line.startsWith("  ") || line.trim() === "")) {
      current.push(line);
    }
  }

  if (current.length > 0) blocks.push(current.join("\n"));
  return blocks;
}

function valueFrom(block, label) {
  const pattern = new RegExp(`^\\s*(?:-\\s*)?${label}:\\s*(.+)$`, "m");
  return block.match(pattern)?.[1]?.trim() || "";
}

function sourceUrlFrom(body) {
  return optionalSection(body, "Source Notes").match(/^- Source URL:\s*(.+)$/m)?.[1]?.trim() || "";
}

function commentHighlightsFrom(body) {
  return bulletBlocks(optionalSection(body, "Comment Highlights"))
    .map((block) => ({
      label: valueFrom(block, "Label"),
      summary: valueFrom(block, "Summary"),
      whyFunny: valueFrom(block, "Why funny"),
      sourceUrl: valueFrom(block, "Source URL"),
    }))
    .filter((item) => item.label && item.summary && item.whyFunny);
}

function validateMoment(moment, filePath) {
  for (const field of requiredFields) {
    if (moment[field] === undefined || moment[field] === "") {
      throw new Error(`${filePath}: missing required field "${field}"`);
    }
  }

  if (moment.public_ready !== true) {
    throw new Error(`${filePath}: public_ready must be true before syncing`);
  }

  if (!Array.isArray(moment.tags) || moment.tags.length === 0) {
    throw new Error(`${filePath}: tags must be a non-empty list`);
  }

  if (!["today", "archive", "submitted"].includes(moment.status)) {
    throw new Error(`${filePath}: status must be today, archive, or submitted`);
  }

  if (moment.quote.split(/\s+/).length > 30) {
    throw new Error(`${filePath}: quote is too long for public use`);
  }

  if (moment.source === "Reddit" && !moment.sourceUrl) {
    throw new Error(`${filePath}: Reddit finds must include a Source URL`);
  }
}

async function main() {
  const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".md")).sort();
  const moments = [];

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const markdown = await readFile(filePath, "utf8");
    const { fields, body } = parseFrontmatter(markdown, filePath);
    const moment = {
      ...fields,
      summary: section(body, "Summary", filePath),
      whyFunny: section(body, "Why It Is Funny", filePath),
      quote: section(body, "Quote", filePath),
      sourceUrl: sourceUrlFrom(body),
      commentHighlights: commentHighlightsFrom(body),
      markdown,
    };

    validateMoment(moment, filePath);
    moments.push(moment);
  }

  moments.sort((left, right) => left.rank - right.rank || left.title.localeCompare(right.title));

  const generated = `${JSON.stringify(moments, null, 2)}\n`;

  if (checkOnly) {
    const current = await readFile(outFile, "utf8").catch(() => "");

    if (current !== generated) {
      throw new Error(`${path.relative(rootDir, outFile)} is out of date; run npm run sync:sports`);
    }

    console.log(`Validated ${moments.length} sports finds in ${path.relative(rootDir, outFile)}`);
    return;
  }

  await writeFile(outFile, generated);
  console.log(`Synced ${moments.length} sports finds to ${path.relative(rootDir, outFile)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
