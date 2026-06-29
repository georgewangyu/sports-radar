# Sports Radar

Sports Radar is a Next.js website entry for a daily sports internet feed: funny comments, lore, clips, fan threads, and group-chat-worthy moments.

Live site: https://sportsradar.snackoverflowgeorge.com

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
