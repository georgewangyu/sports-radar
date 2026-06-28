import { SportsRadarApp } from "./sports-radar-app";
import { moments } from "@/lib/sports";

export default function Home() {
  return <SportsRadarApp moments={moments} />;
}
