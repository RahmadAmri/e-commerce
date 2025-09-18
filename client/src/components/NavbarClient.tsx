"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { listenSessionChange, emitSessionChange } from "@/lib/session-events";
import { useCart } from "@/store/cart";

type User = { id: string; email: string; name?: string | null } | null;

function cn(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export default function NavbarClient({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(!!user);
  const cartCount = useCart((s) =>
    s.items.reduce((sum: number, it) => sum + (it.quantity ?? 1), 0)
  );
  const menuRef = useRef<HTMLDivElement | null>(null);

  async function checkSession() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      setLoggedIn(Boolean(j?.user));
    } catch {
      setLoggedIn(false);
    }
  }

  useEffect(() => {
    checkSession();
  }, [pathname]);

  useEffect(() => {
    const onFocus = () => checkSession();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    return listenSessionChange((isIn) => {
      setLoggedIn(isIn);
      router.refresh();
    });
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
    } finally {
      setLoggedIn(false);
      emitSessionChange(false);

      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    }
  }

  const initials = (
    user?.name
      ?.trim()
      ?.split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2) ||
    user?.email?.slice(0, 2) ||
    ""
  ).toUpperCase();

  const NavLink = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 rounded-md text-sm transition-colors",
        pathname === href
          ? "bg-white text-black"
          : "text-white/85 hover:bg-white/10 border border-transparent hover:border-white/10"
      )}
      aria-current={pathname === href ? "page" : undefined}
    >
      {children}
    </Link>
  );

  // Optional: close any open user/menu popover when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-white"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Mini E-Commerce
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/orders">Orders</NavLink>
            <Link
              href="/cart"
              className="relative px-3 py-2 rounded-md text-sm text-white/85 hover:bg-white/10 border border-white/10 transition-colors"
              aria-label={`Cart with ${cartCount} item${
                cartCount === 1 ? "" : "s"
              }`}
            >
              Cart
              <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-5 px-1 rounded-full text-xs font-medium bg-white text-black">
                {cartCount}
              </span>
            </Link>
          </nav>

          {/* Desktop user area */}
          <div className="hidden md:flex items-center gap-2">
            {!loggedIn ? (
              <>
                <Link
                  href={`/login?next=${encodeURIComponent(pathname || "/")}`}
                  className="px-3 py-2 rounded-md text-sm text-white/85 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href={`/register?next=${encodeURIComponent(pathname || "/")}`}
                  className="px-3 py-2 rounded-md text-sm bg-white text-black hover:opacity-90 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <div ref={menuRef} className="relative">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 bg-white text-black hover:opacity-90 transition"
                >
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-black/10 text-black text-xs font-semibold">
                    {initials}
                  </span>
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggles */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/cart"
              className="relative px-3 py-2 rounded-md text-sm text-white/85 hover:bg-white/10 border border-white/10 transition-colors"
              aria-label={`Cart with ${cartCount} item${
                cartCount === 1 ? "" : "s"
              }`}
            >
              Cart
              <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-5 px-1 rounded-full text-xs font-medium bg-white text-black">
                {cartCount}
              </span>
            </Link>
            <button
              className="px-3 py-2 rounded-md border border-white/10 text-white/85 hover:bg-white/10"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-3 animate-fade-in-up">
            <div className="grid gap-2">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/orders">Orders</NavLink>
              {!loggedIn ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname || "/")}`}
                    className="text-center px-3 py-2 rounded-md text-sm text-white/85 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/register?next=${encodeURIComponent(
                      pathname || "/"
                    )}`}
                    className="text-center px-3 py-2 rounded-md text-sm bg-white text-black hover:opacity-90 transition"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-md text-sm text-red-300/90 hover:bg-white/10 border border-white/10 transition-colors text-left"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
