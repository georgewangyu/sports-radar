import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sportsradar.snackoverflowgeorge.com"),
  title: "Sports Radar",
  description:
    "A daily top five of funny sports internet finds, comments, lore, and group-chat fuel.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "Sports Radar",
    description:
      "A daily top five of funny sports internet finds, comments, lore, and group-chat fuel.",
    url: "https://sportsradar.snackoverflowgeorge.com",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
