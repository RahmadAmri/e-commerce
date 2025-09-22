"use client";

import { Suspense } from "react";
import RegisterFormInner from "./_RegisterFormInner";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-white/60">Loading…</div>}
    >
      <RegisterFormInner />
    </Suspense>
  );
}
