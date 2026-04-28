"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Marquee from "./Marquee";

const NAV = [
  {
    label: "Manage",
    items: [
      { href: "/dashboard", label: "Concerts" },
      { href: "/manage",    label: "Live Room" },
    ],
  },
  {
    label: "Attend",
    items: [
      { href: "/",                 label: "Join (QR)" },
      { href: "/UserOnboarding",   label: "User Onboarding" },
      { href: "/livefeed",         label: "Live Feed" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/onboard_page", label: "Sign In / Up" },
    ],
  },
];

export default function ConsoleShell({ children, activeHref }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = activeHref || pathname;

  const isActive = (href) => {
    if (href === "/") return current === "/";
    return current === href || current.startsWith(href + "/") || current.startsWith(href + "?");
  };

  return (
    <>
      <Marquee />
      <div className="cc-shell">
        <aside className="cc-sidebar">
          <div className="cc-logo">
            <span className="cc-logo__slash">//</span>
            Concert Companion
          </div>

          {NAV.map((section) => (
            <div className="cc-nav-section" key={section.label}>
              <div className="cc-section-label">{section.label}</div>
              <nav className="cc-nav">
                {section.items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`cc-nav__item${isActive(it.href) ? " is-active" : ""}`}
                  >
                    {it.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          <div className="cc-sidebar__footer">© 2026 Concert Companion</div>
        </aside>

        <main className="cc-main">{children}</main>
      </div>
    </>
  );
}
