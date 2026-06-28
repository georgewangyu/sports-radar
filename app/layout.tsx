import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Radar",
  description:
    "A daily top five of funny sports internet finds, comments, lore, and group-chat fuel.",
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
