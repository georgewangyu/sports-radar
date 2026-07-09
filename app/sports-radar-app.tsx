"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BrandMark } from "./brand-mark";
import type { SportsMoment } from "@/lib/sports";
import { getTodaysMoments, leagues, sources } from "@/lib/sports";

type Props = {
  moments: SportsMoment[];
};

type SortMode = "today" | "heat" | "newest" | "title";
type Notice = "idle" | "copied" | "subscribed" | "submitted";
type FormStatus = "idle" | "submitting" | "success" | "error";

type ErrorResponse = {
  error?: string;
  issues?: Record<string, string[] | undefined>;
};

const submissionTypes = [
  ["submit-find", "Submit find"],
  ["request-coverage", "Request coverage"],
  ["improve-note", "Improve note"],
] as const;

const sortOptions: Array<[SortMode, string]> = [
  ["today", "Radar order"],
  ["heat", "Heat"],
  ["newest", "Newest"],
  ["title", "A-Z"],
];

const sourceCards = [
  {
    label: "Primary source",
    value: "Reddit-first",
    detail: "Fan threads, lore, reactions, and jokes that beat normal headlines.",
  },
  {
    label: "Private repo",
    value: "georgesports",
    detail: "Raw links and notes get rewritten before anything becomes public.",
  },
  {
    label: "Public output",
    value: "Daily Top 5",
    detail: "Five sports-culture finds worth sending to the group chat.",
  },
];

const issueLabels: Record<string, string> = {
  title: "Find or topic",
  outcome: "Why this belongs",
  notes: "Rough note",
  context: "Link or source",
  handle: "Handle",
};

const skillInstallCommand = "npx skills add georgewangyu/sports-radar --skill sports-radar -g";
const skillRepoUrl = "https://github.com/georgewangyu/sports-radar";
const leadStorageKey = "sports-radar-install-unlocked";
const pageSize = 3;

const leadLabels: Record<string, string> = {
  email: "Email",
  name: "Name",
  website: "Website",
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      <path d="m21 21-4.3-4.3" />
      <circle cx="10.8" cy="10.8" r="6.6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      <rect height="12" rx="2" width="12" x="8" y="8" />
      <path d="M4 16.2V5.8C4 4.8 4.8 4 5.8 4h10.4" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function sortMoments(items: SportsMoment[], sortMode: SortMode) {
  if (sortMode === "heat") {
    return [...items].sort((left, right) => right.heat - left.heat);
  }

  if (sortMode === "newest") {
    return [...items].sort((left, right) => right.date.localeCompare(left.date));
  }

  if (sortMode === "title") {
    return [...items].sort((left, right) =>
      left.title.localeCompare(right.title, undefined, { sensitivity: "base" }),
    );
  }

  return [...items].sort((left, right) => left.rank - right.rank);
}

async function errorMessageFor(response: Response) {
  if (response.status !== 400) {
    return "Something went wrong. Try again or send the find another way.";
  }

  const body = (await response.json().catch(() => null)) as ErrorResponse | null;
  const fieldMessages = Object.entries(body?.issues || {}).flatMap(
    ([field, messages]) =>
      (messages || []).map((message) => `${issueLabels[field] || field}: ${message}`),
  );

  return fieldMessages.length > 0
    ? fieldMessages.join(" ")
    : body?.error || "Please check the form and try again.";
}

async function leadErrorMessageFor(response: Response) {
  if (response.status !== 400) {
    return "Could not unlock the install command. Try again in a moment.";
  }

  const body = (await response.json().catch(() => null)) as ErrorResponse | null;
  const fieldMessages = Object.entries(body?.issues || {}).flatMap(
    ([field, messages]) =>
      (messages || []).map((message) => `${leadLabels[field] || field}: ${message}`),
  );

  return fieldMessages.length > 0
    ? fieldMessages.join(" ")
    : body?.error || "Please check your email and try again.";
}

export function SportsRadarApp({ moments }: Props) {
  const todaysMoments = getTodaysMoments();
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState("All");
  const [source, setSource] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("today");
  const [notice, setNotice] = useState<Notice>("idle");
  const [submissionType, setSubmissionType] = useState("submit-find");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [leadStatus, setLeadStatus] = useState<FormStatus>("idle");
  const [leadUnlocked, setLeadUnlocked] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [page, setPage] = useState(1);

  const selectedMoment = todaysMoments[0] || moments[0];

  const filteredMoments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return moments.filter((moment) => {
      const matchesLeague = league === "All" || moment.league === league;
      const matchesSource = source === "All" || moment.source === source;
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

      return (
        matchesLeague &&
        matchesSource &&
        (!normalizedQuery || haystack.includes(normalizedQuery))
      );
    });
  }, [league, moments, query, source]);

  const sortedMoments = useMemo(
    () => sortMoments(filteredMoments, sortMode),
    [filteredMoments, sortMode],
  );
  const pageCount = Math.max(1, Math.ceil(sortedMoments.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sortedMoments.length);
  const visibleMoments = sortedMoments.slice(pageStart, pageEnd);

  useEffect(() => {
    setLeadUnlocked(window.localStorage.getItem(leadStorageKey) === "true");
  }, []);

  useEffect(() => {
    setPage(1);
  }, [league, query, sortMode, source]);

  function flash(nextNotice: Notice) {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice("idle"), 1800);
  }

  async function copyMoment(moment: SportsMoment) {
    await navigator.clipboard.writeText(
      `${moment.title}\n\n${moment.summary}\n\nWhy it works: ${moment.whyFunny}`,
    );
    flash("copied");
  }

  async function copySetupCommand() {
    await navigator.clipboard.writeText(skillInstallCommand);
    setCopiedCommand(true);
    window.setTimeout(() => setCopiedCommand(false), 1400);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const payload = Object.fromEntries(new FormData(formElement).entries());

    setLeadStatus("submitting");
    setLeadError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setLeadStatus("error");
        setLeadError(await leadErrorMessageFor(response));
        return;
      }

      window.localStorage.setItem(leadStorageKey, "true");
      setLeadUnlocked(true);
      setLeadStatus("success");
      formElement.reset();
    } catch {
      setLeadStatus("error");
      setLeadError("Could not unlock the install command. Try again in a moment.");
    }
  }

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    flash("subscribed");
  }

  async function handleSubmitFind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormStatus("submitting");
    setError("");

    const form = new FormData(formElement);
    const payload = {
      submissionType: String(form.get("submissionType") || submissionType),
      visibility: String(form.get("visibility") || "public"),
      title: String(form.get("title") || ""),
      outcome: String(form.get("outcome") || ""),
      notes: String(form.get("notes") || ""),
      context: String(form.get("context") || ""),
      handle: String(form.get("handle") || ""),
      website: String(form.get("website") || ""),
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setFormStatus("error");
        setError(await errorMessageFor(response));
        return;
      }

      formElement.reset();
      setSubmissionType("submit-find");
      setFormStatus("success");
      flash("submitted");
    } catch {
      setFormStatus("error");
      setError("Something went wrong. Try again or send the find another way.");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          <BrandMark />
          <span>Sports Radar</span>
        </a>
        <nav className="nav-links" aria-label="Page navigation">
          <a href="#today">Today</a>
          <a href="#top-five">Top 5</a>
          <a href="#archive">Archive</a>
          <a href="#skill">Skill</a>
          <a href="#submit">Submit</a>
        </nav>
        <a className="primary nav-cta" href="#subscribe">
          Get daily top 5
        </a>
      </header>

      <section className="hero" id="today" aria-labelledby="page-title">
        <div className="hero-copy">
          <h1 id="page-title">Sports Radar</h1>
          <p className="hero-line">
            Reddit-first sports culture, edited into five moments worth sending
            before they disappear into the group chat.
          </p>
          <form className="subscribe-form" id="subscribe" onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" placeholder="you@example.com" type="email" required />
            <button className="primary" type="submit">
              <SendIcon />
              Send me the Top 5
            </button>
          </form>
          <div className="quick-stats" aria-label="Radar contents">
            <span>Reddit-first</span>
            <span>Private notes → public finds</span>
            <span>NBA / NFL / Soccer / more</span>
          </div>
          <div className="source-grid" aria-label="Source strategy">
            {sourceCards.map((card) => (
              <div className="source-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="daily-board" id="top-five" aria-labelledby="top-five-title">
          <div className="section-heading">
            <span>Today</span>
            <h2 id="top-five-title">Today&apos;s Five</h2>
          </div>
          <div className="top-five-list">
            {todaysMoments.map((moment) => (
              <Link
                className={`top-five-row ${selectedMoment.id === moment.id ? "is-active" : ""}`}
                href={`/moments/${moment.id}`}
                key={moment.id}
              >
                <span className="rank">{moment.rank}</span>
                <span className="thumb-cell" aria-hidden="true">
                  {moment.league.slice(0, 3)}
                </span>
                <span className="row-main">
                  <strong>{moment.title}</strong>
                  <small className="row-meta">
                    <span>{moment.league} / {moment.source}</span>
                    <span className="heat-pill">Heat <strong>{moment.heat}</strong></span>
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="feature-detail" aria-label="Featured sports find">
        <div className="poster-tile">
          <span>{selectedMoment.league}</span>
          <strong>{selectedMoment.rank.toString().padStart(2, "0")}</strong>
          <small>{selectedMoment.source}</small>
        </div>
        <article className="detail-copy">
          <div className="detail-meta">
            <span>{selectedMoment.date}</span>
            <span>{selectedMoment.status}</span>
            <span>Heat {selectedMoment.heat}</span>
          </div>
          <h2>{selectedMoment.title}</h2>
          <p>{selectedMoment.summary}</p>
          <blockquote>{selectedMoment.quote}</blockquote>
          <div className="why-box">
            <span>Why it makes the cut</span>
            <p>{selectedMoment.whyFunny}</p>
          </div>
          <Link className="text-link" href={`/moments/${selectedMoment.id}`}>
            Open full page
          </Link>
          {(selectedMoment.commentHighlights || []).length > 0 && (
            <section className="comment-highlights" aria-label="Comment highlights">
              <div className="section-heading compact">
                <span>Comment read</span>
                <h3>What the thread adds</h3>
              </div>
              <div className="comment-list">
                {selectedMoment.commentHighlights?.map((comment) => (
                  <article className="comment-card" key={`${selectedMoment.id}-${comment.label}`}>
                    <div>
                      <span>{comment.label}</span>
                      {comment.sourceUrl && (
                        <a href={comment.sourceUrl} target="_blank" rel="noreferrer">
                          Open comment
                        </a>
                      )}
                    </div>
                    <p>{comment.summary}</p>
                    <small>{comment.whyFunny}</small>
                  </article>
                ))}
              </div>
            </section>
          )}
          <div className="tag-row">
            {selectedMoment.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </article>
        <div className="detail-actions">
          <button className="icon-button" onClick={() => copyMoment(selectedMoment)} type="button">
            <CopyIcon />
            <span>Copy</span>
          </button>
          <a className="icon-button" href="#submit">
            <SendIcon />
            <span>Send a find</span>
          </a>
          {selectedMoment.sourceUrl && (
            <a className="icon-button source-link" href={selectedMoment.sourceUrl} target="_blank" rel="noreferrer">
              Open Reddit
            </a>
          )}
        </div>
      </section>

      <section className="agent-setup" id="skill" aria-labelledby="skill-title">
        <div>
          <div className="section-heading">
            <span>Agent skill</span>
            <h2 id="skill-title">Use Sports Radar in your agent.</h2>
          </div>
          <p>
            Install the skill to ask for today's sports internet pick, search the
            archive, or turn a weird moment into a concise shareable summary.
          </p>
        </div>
        {leadUnlocked ? (
          <div className="setup-command">
            <code>{skillInstallCommand}</code>
            <div className="setup-actions">
              <button className="primary" onClick={copySetupCommand} type="button">
                {copiedCommand ? "Copied" : "Copy command"}
              </button>
              <a href={skillRepoUrl}>Star the repo</a>
            </div>
            <p>Star Sports Radar to save it and support the project.</p>
          </div>
        ) : (
          <form className="unlock-form" onSubmit={submitLead}>
            <label>
              Name
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="honeypot" />
            <button className="primary" disabled={leadStatus === "submitting"} type="submit">
              <SendIcon />
              {leadStatus === "submitting" ? "Unlocking..." : "Unlock install command"}
            </button>
            <p>Unlocks the skill command and occasional updates. No spam.</p>
            {leadStatus === "error" && <p className="error">{leadError}</p>}
          </form>
        )}
      </section>

      <section className="archive-section" id="archive" aria-labelledby="archive-title">
        <div className="archive-head">
          <div className="section-heading">
            <span>Archive</span>
            <h2 id="archive-title">Search the sports-culture file</h2>
          </div>
          <p>
            Built for moments that are too specific for headlines and too good to
            leave trapped in Reddit threads, broadcasts, or private notes.
          </p>
        </div>

        <div className="filters" aria-label="Archive filters">
          <label className="search-control">
            <SearchIcon />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search burners, refs, fantasy apologies..."
              type="search"
              value={query}
            />
          </label>
          <label>
            <span>League</span>
            <select onChange={(event) => setLeague(event.target.value)} value={league}>
              <option>All</option>
              {leagues.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Source</span>
            <select onChange={(event) => setSource(event.target.value)} value={source}>
              <option>All</option>
              {sources.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              value={sortMode}
            >
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="archive-meta">
          <span>
            {sortedMoments.length} matching finds
            {sortedMoments.length > 0 ? ` / showing ${pageStart + 1}-${pageEnd}` : ""}
          </span>
        </div>

        <div className="archive-table" role="list">
          {visibleMoments.map((moment) => (
            <Link
              className="archive-row"
              href={`/moments/${moment.id}`}
              key={moment.id}
            >
              <span className="rank mini">{moment.rank}</span>
              <span className="archive-main">
                <strong>{moment.title}</strong>
                <small>{moment.summary}</small>
              </span>
              <span className="archive-chip">{moment.league}</span>
              <span className="archive-chip">{moment.source}</span>
              <span className="heat-pill archive-heat">Heat <strong>{moment.heat}</strong></span>
            </Link>
          ))}
        </div>
        {sortedMoments.length > pageSize ? (
          <nav className="pagination" aria-label="Sports find pagination">
            <button
              className="page-button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="page-status">
              Page {currentPage} of {pageCount}
            </span>
            <button
              className="page-button"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              type="button"
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>

      <section className="submit-section" id="submit" aria-labelledby="submit-title">
        <div>
          <div className="section-heading">
            <span>Submit</span>
            <h2 id="submit-title">Found something the group chat needs?</h2>
          </div>
          <p>
            Drop the Reddit thread, clip, quote, or messy context. Sports Radar
            works best when the explanation is almost as good as the moment.
          </p>
        </div>
        <form className="submit-form" onSubmit={handleSubmitFind}>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="honeypot" />
          <div className="segmented" role="group" aria-label="Submission type">
            {submissionTypes.map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="submissionType"
                  value={value}
                  checked={submissionType === value}
                  onChange={() => setSubmissionType(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <input name="title" placeholder="Short title" required />
          <textarea
            name="outcome"
            placeholder="Why does this belong on Sports Radar?"
            required
            rows={3}
          />
          <textarea
            name="notes"
            placeholder="Drop the quote, joke, thread context, or rough explanation."
            required
            rows={4}
          />
          <input name="context" placeholder="Link or source" />
          <input name="handle" placeholder="Your handle, optional" />
          <fieldset>
            <legend>Visibility</legend>
            <label>
              <input type="radio" name="visibility" value="public" defaultChecked />
              Public issue
            </label>
            <label>
              <input type="radio" name="visibility" value="private" />
              Private review
            </label>
          </fieldset>
          <button className="primary" type="submit" disabled={formStatus === "submitting"}>
            <SendIcon />
            {formStatus === "submitting" ? "Sending..." : "Submit find"}
          </button>
          {formStatus === "success" && <p className="success">Find sent for review.</p>}
          {formStatus === "error" && <p className="error">{error}</p>}
        </form>
      </section>

      <footer className="footer">
        <span>Sports Radar</span>
        <span>Daily sports internet, edited for humans.</span>
      </footer>

      <div className={`toast ${notice !== "idle" ? "is-visible" : ""}`} role="status">
        {notice === "copied" && "Copied for the group chat."}
        {notice === "subscribed" && "You are on the daily Top 5 list."}
        {notice === "submitted" && "Find submitted for review."}
      </div>
    </main>
  );
}
