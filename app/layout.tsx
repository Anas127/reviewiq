import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewIQ — Build code-review judgment",
  description: "Practice reviewing realistic pull requests, see what you catch and miss, and sharpen your engineering judgment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
