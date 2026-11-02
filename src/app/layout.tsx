import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Druids Lounge",
    template: "%s | Druids Lounge",
  },
  description:
    "Order drinks and food, and request songs from your table at Druids Lounge, Nairobi.",
};

export const viewport: Viewport = {
  themeColor: "#100D19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${body.variable} ${display.variable} bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}