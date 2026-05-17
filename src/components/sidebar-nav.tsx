"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  List,
  Network,
  BarChart3,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/session", label: "Study", icon: BookOpen },
  { href: "/browse", label: "Browse", icon: List },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal top bar */}
      <header className="flex md:hidden items-center h-12 border-b border-border bg-sidebar px-3 gap-1">
        <span className="text-sm font-bold tracking-tight text-foreground lowercase mr-auto">
          trivium
        </span>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`p-2 rounded-md transition-colors ${
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
            </Link>
          );
        })}
        <ThemeToggle compact />
      </header>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[220px] border-r border-border bg-sidebar flex-col">
        <div className="h-12 flex items-center px-5">
          <span className="text-sm font-bold tracking-tight text-foreground lowercase">
            trivium
          </span>
        </div>
        <nav className="flex-1 px-2.5 pt-1">
          <ul className="space-y-0.5">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors ${
                      active
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <Icon
                      size={15}
                      strokeWidth={active ? 2 : 1.5}
                      className="shrink-0"
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="px-5 py-3 border-t border-border">
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
