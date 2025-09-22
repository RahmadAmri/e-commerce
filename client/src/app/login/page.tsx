"use client";

import { Suspense } from "react";
import LoginFormInner from "./_LoginFormInner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-white/60">Loading…</div>}
    >
      <LoginFormInner />
    </Suspense>
  );
}
