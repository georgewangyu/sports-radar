"use client";

import { FormEvent, useMemo, useState } from "react";
import type { SportsMoment } from "@/lib/sports";
import { getTodaysMoments, leagues, sources } from "@/lib/sports";

type Props = {
  moments: SportsMoment[];
};

type SortMode = "today" | "heat" | "newest" | "title";
type Notice = "idle" | "copied" | "subscribed" | "submitted";

const sortOptions: Array<[SortMode, string]> = [
  ["today", "Radar order"],
  ["heat", "Heat"],
  ["newest", "Newest"],
  ["title", "A-Z"],
];

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

export function SportsRadarApp({ moments }: Props) {
  const todaysMoments = getTodaysMoments();
  const [selectedId, setSelectedId] = useState(todaysMoments[0]?.id || moments[0]?.id);
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState("All");
  const [source, setSource] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("today");
  const [notice, setNotice] = useState<Notice>("idle");

  const selectedMoment =
    moments.find((moment) => moment.id === selectedId) || todaysMoments[0] || moments[0];

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

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    flash("subscribed");
  }

  function handleSubmitFind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    flash("submitted");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">SR</span>
          <span>Sports Radar</span>
        </a>
        <nav className="nav-links" aria-label="Page navigation">
          <a href="#today">Today</a>
          <a href="#top-five">Top 5</a>
          <a href="#archive">Archive</a>
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
            The best sports internet finds, before they disappear into the group chat.
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
            <span>Daily picks</span>
            <span>NBA / NFL / Soccer / more</span>
            <span>Reddit, ESPN, X, broadcasts</span>
          </div>
        </div>

        <section className="daily-board" id="top-five" aria-labelledby="top-five-title">
          <div className="section-heading">
            <span>Today</span>
            <h2 id="top-five-title">Top 5</h2>
          </div>
          <div className="top-five-list">
            {todaysMoments.map((moment) => (
              <button
                className={`top-five-row ${selectedMoment.id === moment.id ? "is-active" : ""}`}
                key={moment.id}
                onClick={() => setSelectedId(moment.id)}
                type="button"
              >
                <span className="rank">{moment.rank}</span>
                <span className="thumb-cell" aria-hidden="true">
                  {moment.league.slice(0, 3)}
                </span>
                <span className="row-main">
                  <strong>{moment.title}</strong>
                  <small>
                    {moment.league} / {moment.source} / Heat {moment.heat}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="feature-detail" aria-label="Selected sports find">
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
            <span>Why it is funny</span>
            <p>{selectedMoment.whyFunny}</p>
          </div>
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
        </div>
      </section>

      <section className="archive-section" id="archive" aria-labelledby="archive-title">
        <div className="archive-head">
          <div className="section-heading">
            <span>Archive</span>
            <h2 id="archive-title">Search the funny file</h2>
          </div>
          <p>
            Built for the stuff that is too specific for headlines and too good to
            leave trapped in a thread.
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

        <div className="archive-table" role="list">
          {sortedMoments.map((moment) => (
            <button
              className="archive-row"
              key={moment.id}
              onClick={() => setSelectedId(moment.id)}
              role="listitem"
              type="button"
            >
              <span className="rank mini">{moment.rank}</span>
              <span className="archive-main">
                <strong>{moment.title}</strong>
                <small>{moment.summary}</small>
              </span>
              <span className="archive-chip">{moment.league}</span>
              <span className="archive-chip">{moment.source}</span>
              <span className="heat">Heat {moment.heat}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="submit-section" id="submit" aria-labelledby="submit-title">
        <div>
          <div className="section-heading">
            <span>Submit</span>
            <h2 id="submit-title">Found something the group chat needs?</h2>
          </div>
          <p>
            Drop the link, the quote, or the messy context. Sports Radar works best
            when the explanation is almost as funny as the moment.
          </p>
        </div>
        <form className="submit-form" onSubmit={handleSubmitFind}>
          <input name="title" placeholder="Short title" required />
          <input name="context" placeholder="Link or source" required />
          <textarea name="why" placeholder="Why is this funny?" required rows={4} />
          <button className="primary" type="submit">
            <SendIcon />
            Submit find
          </button>
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
