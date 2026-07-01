---
version: "alpha"
name: "Sports Radar"
description: "Public sports-culture radar site using George Design Language research-desk mode with a Reddit-first source stance."
colors:
  primary: "#B93D22"
  ink: "#141414"
  muted: "#64615A"
  page: "#E9E4DC"
  paper: "#FBFAF6"
  surface: "#FFFFFF"
  line: "#D7D0C1"
  field: "#176E45"
  blue: "#1457FF"
  signal: "#D7FF55"
typography:
  h1:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "88px"
    fontWeight: "900"
    lineHeight: "0.9"
    letterSpacing: "0em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "1.55"
    letterSpacing: "0em"
  label:
    fontFamily: "SFMono-Regular, SF Mono, Consolas, monospace"
    fontSize: "11px"
    fontWeight: "900"
    lineHeight: "1.2"
    letterSpacing: "0.08em"
rounded:
  panel: "0px"
  control: "8px"
  pill: "999px"
spacing:
  shell: "32px"
  panel: "36px"
  gap: "18px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
    padding: "11px 14px"
---

## Overview

Sports Radar uses George Design Language's `Research Desk` mode, tuned for
sports culture rather than sports news. It should feel like a public scouting
desk for the funny, lore-heavy, group-chat-worthy sports internet.

## Source Positioning

Default source stance: Reddit-first. Other sources are allowed only when the
moment earns its way into the Top 5: broadcast clips, YouTube, ESPN graphics,
or public social posts. X is not a default source because George's X feed is
mostly tech.

Private source repo: `georgesports`.
Public app repo: `sports-radar`.

## Layout

The first viewport should show:

- what Sports Radar is
- why Reddit/source curation matters
- today's Top 5
- the private-to-public source pipeline

The page should not look like a generic sports-news site. It is a culture radar,
not scores, betting, fantasy projections, or league reporting.

## Do's and Don'ts

Do:

- Keep the Top 5 visible above the fold.
- Make source discipline visible.
- Use short summaries and commentary, not copied comment dumps.
- Preserve the Builder Radar sibling structure.

Don't:

- Pretend this is comprehensive sports coverage.
- Default to X as a sports source.
- Publish raw Reddit comments or long excerpts.
- Use betting language or odds framing.
