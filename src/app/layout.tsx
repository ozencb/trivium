import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Trivium",
  description: "Master the prerequisites. Unlock what's next.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const links = [
    { href: "/", label: "Home" },
    { href: "/session", label: "Session" },
    { href: "/browse", label: "Browse" },
    { href: "/graph", label: "Graph" },
    { href: "/progress", label: "Progress" },
  ];
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${mono.variable} font-mono antialiased`}>
        <ThemeProvider>
          <nav className="border-b border-border/50 px-4 py-4">
            <div className="max-w-2xl mx-auto flex items-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <ThemeToggle />
            </div>
          </nav>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
