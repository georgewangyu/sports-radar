import sportsMoments from "@/data/sports-moments.json";

export type CommentHighlight = {
  label: string;
  summary: string;
  whyFunny: string;
  sourceUrl?: string;
};

export type SportsMoment = {
  id: string;
  rank: number;
  title: string;
  league: "NBA" | "NFL" | "Soccer" | "MLB" | "Tennis" | "College";
  source: "Reddit" | "ESPN" | "X" | "YouTube" | "Broadcast" | "Group chat";
  status: "today" | "archive" | "submitted";
  date: string;
  heat: number;
  summary: string;
  whyFunny: string;
  quote: string;
  sourceUrl?: string;
  commentHighlights?: CommentHighlight[];
  tags: string[];
  markdown: string;
};

export const moments = sportsMoments as SportsMoment[];

export const leagues = Array.from(new Set(moments.map((moment) => moment.league))).sort();
export const sources = Array.from(new Set(moments.map((moment) => moment.source))).sort();

export function momentById(id: string) {
  return moments.find((moment) => moment.id === id);
}

export function getTodaysMoments() {
  return moments.filter((moment) => moment.status === "today").slice(0, 5);
}
