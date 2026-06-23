import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Universe",
  description: "A little universe made just for you, filled with everything I feel.",
  keywords: "A little universe made just for you, filled with everything I feel.",
  authors: [{ name: "ELLL" }],
  icons: { icon: [{ url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">❤️</text></svg>' }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
