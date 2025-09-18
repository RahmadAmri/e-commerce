"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useCart } from "@/store/cart";

const CheckoutSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  address: z.string().min(3),
  city: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
});

type FormState = z.infer<typeof CheckoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart((s) => s);
  const [form, setForm] = useState<FormState>({
    email: "",
    fullName: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!alive) return;
      if (!j?.user) {
        router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const total = items.reduce(
    (sum: number, i: { price: number; quantity: number }) =>
      sum + i.price * i.quantity,
    0
  );

  async function submit() {
    setError(null);
    const parsed = CheckoutSchema.safeParse(form);
    if (!parsed.success) {
      setError("Please fill the form correctly");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Checkout failed");
      setLoading(false);
      return;
    }
    const order = await res.json();
    clear();
    setSuccess(order.id);
    setLoading(false);
  }

  if (!ready) return null;

  if (success) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Order Confirmed</h1>
        <p>Your order #{success} has been placed successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {(
            [
              "email",
              "fullName",
              "address",
              "city",
              "country",
              "postalCode",
            ] as Array<keyof FormState>
          ).map((k: keyof FormState) => (
            <div key={String(k)}>
              <label className="block text-sm capitalize">{String(k)}</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={form[k]}
                onChange={(e) =>
                  setForm((f: FormState) => ({ ...f, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            disabled={loading}
            onClick={submit}
            className="border rounded px-3 py-1"
          >
            {loading ? "Submitting…" : "Place Order"}
          </button>
        </div>
        <div>
          <h2 className="font-medium mb-2">Order Summary</h2>
          <ul className="space-y-1">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between text-sm">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 font-semibold">Total: ${total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
