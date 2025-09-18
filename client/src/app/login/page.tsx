"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useToast } from "@/components/Toast";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormState = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // If already logged in, skip to next
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

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const parsed = LoginSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Invalid form";
      setErr(first);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const msg = j?.error ?? "Login failed";
      setErr(msg);
      toastError(msg);
      return;
    }
    success("Welcome back!");
    router.replace(next);
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
                ref={emailRef}
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
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, password: e.target.value }))
                  }
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 pr-10 text-white outline-none focus:ring-2 ring-white/20"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-white/70 hover:text-white/90"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {err && <div className="text-sm text-red-400">{err}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-white text-black py-2 font-medium hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-30"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Login"
              )}
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
