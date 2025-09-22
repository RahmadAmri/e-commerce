"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { emitSessionChange } from "@/lib/session-events";

const RegisterSchema = z.object({
  name: z.string().min(1, "Enter your name").max(60),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Please enter password min 6 letters"),
});
type FormState = z.infer<typeof RegisterSchema>;

export default function RegisterFormInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = RegisterSchema.safeParse(form);
    if (!parsed.success) {
      setError("Please fill all fields correctly");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        let msg = "Registration failed";
        try {
          const j = await res.json();
          if (j?.error) msg = String(j.error);
        } catch {}
        setError(msg);
        setSubmitting(false);
        return;
      }

      emitSessionChange(true);
      router.replace(next);
    } catch {
      setError("Unable to register. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-12 max-w-sm space-y-3">
      <div className="text-xl font-semibold text-center">Register</div>

      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => {
          setForm((f) => ({ ...f, name: e.target.value }));
          if (error) setError(null);
        }}
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        autoComplete="name"
      />

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
        autoComplete="new-password"
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
        {submitting ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
