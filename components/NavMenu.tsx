"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthButton from "./AuthButton";

export default function NavMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const links = [
    { href: "/", label: "Movies" },
    ...(loggedIn
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/profile", label: "Profile" },
        ]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-white/10 transition-colors hover:bg-white/10"
      >
        <span className="h-0.5 w-5 rounded bg-white" />
        <span className="h-0.5 w-5 rounded bg-white" />
        <span className="h-0.5 w-5 rounded bg-white" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-white/10 px-1 pt-2">
            <AuthButton loggedIn={loggedIn} />
          </div>
        </div>
      )}
    </div>
  );
}