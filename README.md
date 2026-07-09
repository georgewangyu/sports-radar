# Sports Radar

Sports Radar is a Next.js website entry for a daily sports internet feed: funny comments, lore, clips, fan threads, social moments, and group-chat-worthy sports culture.

Live site: https://sportsradar.snackoverflowgeorge.com

Design contract: [DESIGN.md](DESIGN.md)

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` only when testing GitHub issue submission
or install-command lead capture locally. Keep server tokens server-side and
never prefix them with `NEXT_PUBLIC_`.

## Source Data

Public-ready source finds live in the sibling private source repo:

```text
../georgesports/finds/<find-id>.md
```

Reddit candidates are pulled privately from `georgesports` first:

```bash
(cd ../georgesports && npm run collect:reddit)
```

That command writes raw review files under `../georgesports/inbox/reddit/`,
which is intentionally gitignored. Promote only rewritten, public-safe items
into `../georgesports/finds/`.

Sync them into the public app data with:

```bash
npm run sync:sports
```

Generated public data lives in:

```text
data/sports-moments.json
```

Do not edit generated sports moment content by hand in
`data/sports-moments.json`. Edit `georgesports/finds/*.md`, then run:

```bash
npm run validate:sports
npm run sync:sports
npm run typecheck
npm run build
```

`npm run validate:sports` checks whether generated public data is current
without rewriting `data/sports-moments.json`.

## Source Strategy

Sports Radar is Reddit-led by default, with curated non-Reddit lanes for
YouTube, sports-specific X search, Instagram/TikTok review paths, official
feeds, and manual submissions. The product is not trying to be a general
sports-news feed, betting board, or score tracker. The value is a short edited
Top 5 of sports-culture moments that are funny, lore-heavy, or
group-chat-worthy.

Primary source:

- Reddit sports communities and team/fan subreddits.

Secondary sources when a moment earns it:

- YouTube public search and official/team/creator channels
- X sports searches from a dedicated sports/secondary account only
- Instagram and TikTok bot/manual review lanes
- Broadcast clips
- ESPN or public media graphics
- Public social posts
- Private notes rewritten into public-safe commentary

George's primary/current X account is not a Sports Radar source. Add X only
through an intentional sports account/source list, not as ambient xbot input.

## Product Shape

- Daily Top 5 sports-culture finds
- Selectable detail pane for the current featured moment
- Searchable archive with league and source filters
- Email subscription, installable agent skill, and GitHub-backed submit-a-find
  form

The initial visual concept is stored at `public/concepts/sports-radar-concept.png`.

## Installable Skill

```sh
npx skills add georgewangyu/sports-radar --skill sports-radar -g
```

Then ask your agent to use Sports Radar for today's sports internet pick,
archive search, or a compact summary of a group-chat-worthy moment.

The homepage install card asks for name and email before revealing the copyable
install command. Submissions are saved server-side into a shared Supabase table
called `radar_leads`; no Supabase key is exposed to the browser.

Create or update the table with:

```sh
psql "$SUPABASE_DB_URL" -f docs/radar-leads-supabase.sql
```

Required deployment environment variables:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-side-service-role-key>
```

## GitHub Request Intake

The bottom-page submit form creates GitHub issues from the server route at
`/api/submit`.

Required environment variables:

```env
GITHUB_TOKEN=<server-side-github-token>
GITHUB_OWNER=georgewangyu
GITHUB_REPO=audience-request-form
GITHUB_PRIVATE_REPO=audience-private-intake
```

Public submissions create issues in `georgewangyu/audience-request-form`.
Private submissions create issues in `georgewangyu/audience-private-intake`.
Sports Radar adds `sports-radar` and `source-repo:sports-radar` labels so the
shared queue remains triageable.

Optional:

```env
GITHUB_API_VERSION=2022-11-28
SPORTS_RADAR_REQUEST_ALLOWED_ORIGIN=https://your-domain.example
```
