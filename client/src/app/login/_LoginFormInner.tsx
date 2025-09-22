"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { emitSessionChange } from "@/lib/session-events";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type Form = z.infer<typeof Schema>;

export default function LoginFormInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [form, setForm] = useState<Form>({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setSubmitting(false); // allow retry without refresh
        return;
      }

      emitSessionChange(true); // update navbar instantly
      router.replace(next);
    } catch {
      setError("Unable to sign in. Check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-12 max-w-sm space-y-3">
      <div className="text-xl font-semibold text-center">Login</div>

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => {
          setForm((f) => ({ ...f, email: e.target.value }));
          if (error) setError(null);
        }}
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        autoComplete="email"
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => {
          setForm((f) => ({ ...f, password: e.target.value }));
          if (error) setError(null);
        }}
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        autoComplete="current-password"
      />

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
  );
}
