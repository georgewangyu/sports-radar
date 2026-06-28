# Sports Radar

Sports Radar is a Next.js website entry for a daily sports internet feed: funny comments, lore, clips, fan threads, and group-chat-worthy moments.

## Local Development

```bash
npm install
npm run dev
```

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
- Email subscription and submit-a-find forms with local success states

The initial visual concept is stored at `public/concepts/sports-radar-concept.png`.
