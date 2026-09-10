"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/lib/content";

export default function Header({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0a10]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ff808b] font-serif text-lg font-bold text-white">
            MM
          </span>
          <span className="font-serif text-lg tracking-wide">MM Digital</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "text-[#ff808b]" : "text-white/80 hover:text-white"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {loggedIn ? (
            <button onClick={logout} className="btn-ghost !min-h-11 !px-5 text-sm">
              Logout
            </button>
          ) : (
            <Link href="/login/" className="btn-pink !min-h-11 !px-5 text-sm">
              Client Login
            </Link>
          )}
        </div>

        <button
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="text-xl">{open ? "×" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3 text-sm font-semibold">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            {loggedIn ? (
              <button onClick={logout} className="text-left text-[#ff808b]">
                Logout
              </button>
            ) : (
              <Link href="/login/" className="text-[#ff808b]" onClick={() => setOpen(false)}>
                Client Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
