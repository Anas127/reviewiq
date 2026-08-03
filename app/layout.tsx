import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewIQ",
  description: "Practice code review like a senior engineer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}