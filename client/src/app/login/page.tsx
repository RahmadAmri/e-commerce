"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { emitSessionChange } from "@/lib/session-events";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type Form = z.infer<typeof Schema>;

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [form, setForm] = useState<Form>({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!alive) return;
      if (j?.user) router.replace(next);
    })();
    return () => {
      alive = false;
    };
  }, [router, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      setError("Enter a valid email and password");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        let msg = "Wrong email or password";
        try {
          const j = await res.json();
          if (j?.error) msg = String(j.error);
        } catch {}
        setError(msg);
        setForm((f) => ({ ...f, password: "" }));
        setSubmitting(false);
        return;
      }

      emitSessionChange(true);
      router.replace(next);
    } catch {
      setError("Unable to sign in. Check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="w-full max-w-sm">
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 shadow-lg">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-12 w-12 rounded-xl bg-white text-black grid place-items-center shadow">
            🔐
          </div>
          <h1 className="mt-6 text-center text-xl font-semibold">Login</h1>
          <p className="text-center text-sm text-white/60 mb-6">
            Sign in to continue your checkout.
          </p>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label
                className="block text-xs text-white/60 mb-1"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((s) => ({ ...s, email: e.target.value }))
                }
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 ring-white/20"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                className="block text-xs text-white/60 mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, password: e.target.value }))
                  }
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 pr-10 text-white outline-none focus:ring-2 ring-white/20"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error ? (
              <div className="text-sm text-red-400" role="alert">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md border border-white/10 bg-white text-black py-2 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-white/70">
            Don’t have an account?{" "}
            <Link
              className="underline underline-offset-4 hover:text-white"
              href={`/register?next=${encodeURIComponent(next)}`}
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
