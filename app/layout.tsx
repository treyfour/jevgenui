import type { Metadata } from "next";
import { Geist_Mono, Inter, Inter_Tight, VT323 } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { themeScript } from "@/lib/theme";
import "./globals.css";

// Variable font: the theme uses Inter's 510 and 590 weights.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Jev themes: stand-ins for typesafe.ai's commercial Die Grotesk and LisaTerminal.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Operator · Jev GenUI",
  description: "Ask about your pipeline. Jev picks the view.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme and data-mode are replaced before paint by the head script; the DOM wins on hydration.
    <html
      lang="en"
      data-theme="linear-dark"
      data-mode="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${interTight.variable} ${vt323.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* text/plain on the client: only the server-rendered copy runs, so React doesn't warn. */}
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
