import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/app/brand-mark";
import { MomentCopyButton } from "@/app/moment-actions";
import { momentById, moments } from "@/lib/sports";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return moments.map((moment) => ({ id: moment.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const moment = momentById(id);

  if (!moment) {
    return {
      title: "Moment not found - Sports Radar",
    };
  }

  return {
    title: `${moment.title} - Sports Radar`,
    description: moment.summary,
  };
}

export default async function MomentPage({ params }: PageProps) {
  const { id } = await params;
  const moment = momentById(id);

  if (!moment) notFound();

  return (
    <main className="shell moment-page">
      <header className="topbar">
        <Link className="brand" href="/">
          <BrandMark />
          <span>Sports Radar</span>
        </Link>
        <nav className="nav-links" aria-label="Moment navigation">
          <Link href="/">Home</Link>
          <Link href="/#top-five">Top 5</Link>
          <Link href="/#archive">Archive</Link>
          <Link href="/#skill">Skill</Link>
          <Link href="/#submit">Submit</Link>
        </nav>
      </header>

      <section className="moment-hero" aria-labelledby="moment-title">
        <div className="poster-tile">
          <span>{moment.league}</span>
          <strong>{moment.rank.toString().padStart(2, "0")}</strong>
          <small>{moment.source}</small>
        </div>
        <div className="moment-brief-main">
          <div className="detail-meta">
            <span>{moment.date}</span>
            <span>{moment.status}</span>
            <span>Heat {moment.heat}</span>
          </div>
          <h1 id="moment-title">{moment.title}</h1>
          <p>{moment.summary}</p>
          <blockquote>{moment.quote}</blockquote>
          <div className="quick-stats" aria-label="Moment tags">
            {moment.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="detail-actions moment-actions">
            <MomentCopyButton moment={moment} />
            <Link className="icon-button" href="/#submit">
              Send a find
            </Link>
            {moment.sourceUrl && (
              <a className="icon-button source-link" href={moment.sourceUrl}>
                Open source
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="moment-section" aria-labelledby="why-title">
        <div className="section-heading feed-section-head">
          <span>Why it makes the cut</span>
          <h2 id="why-title">The sports-internet read</h2>
        </div>
        <div className="moment-section-body">
          <p>{moment.whyFunny}</p>
        </div>
      </section>

      {(moment.commentHighlights || []).length > 0 && (
        <section className="moment-section" aria-labelledby="comments-title">
          <div className="section-heading feed-section-head">
            <span>Comment read</span>
            <h2 id="comments-title">What the thread adds</h2>
            <p>Short public-safe summaries of the reply patterns that made the find work.</p>
          </div>
          <div className="feed-card-grid">
            {moment.commentHighlights?.map((comment) => (
              <article className="feed-card" key={`${moment.id}-${comment.label}`}>
                <div className="feed-card-meta">{comment.label}</div>
                <p>{comment.summary}</p>
                <small>{comment.whyFunny}</small>
                {comment.sourceUrl && (
                  <a className="source-link" href={comment.sourceUrl}>
                    Open comment
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {moment.sourceUrl && (
        <section className="moment-section" aria-labelledby="source-title">
          <div className="section-heading feed-section-head">
            <span>Source receipt</span>
            <h2 id="source-title">Original thread</h2>
          </div>
          <div className="receipt-list">
            <a href={moment.sourceUrl}>
              <strong>{moment.source}</strong>
              <span>{moment.sourceUrl}</span>
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
