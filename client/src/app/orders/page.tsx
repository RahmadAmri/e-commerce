"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { z } from "zod";

type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: { id: number; name: string; imageUrl: string } | null;
};

type Order = {
  id: number;
  createdAt: string | Date;
  total: number;
  items: OrderItem[];
};

const ZOrderItem = z.object({
  id: z.number(),
  productId: z.number(),
  quantity: z.number(),
  price: z.number(),
  product: z
    .object({
      id: z.number(),
      name: z.string(),
      imageUrl: z.string(),
    })
    .nullable(),
});

const ZOrder = z.object({
  id: z.number(),
  createdAt: z.union([z.string(), z.date()]),
  total: z.number(),
  items: z.array(ZOrderItem),
});

const ZOrdersResponse = z.object({ orders: z.array(ZOrder) });

function fmt(n: unknown) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(signal?: AbortSignal) {
    const res = await fetch("/api/orders", {
      cache: "no-store",
      signal,
      headers: { "cache-control": "no-store" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const parsed = ZOrdersResponse.safeParse(json);
    if (!parsed.success) {
      console.warn("Invalid /api/orders response:", parsed.error.flatten());
      return [];
    }
    return parsed.data.orders as Order[];
  }

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    const ctrl = new AbortController();

    const refresh = async () => {
      try {
        const list = await load(ctrl.signal);
        if (!alive) return;
        setOrders(list);
        setError(null);
      } catch (e: unknown) {
        if (!alive) return;
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "string"
            ? e
            : "Failed to load";
        setError(msg);
        setOrders((prev) => prev ?? []);
      }
    };

    // initial load
    refresh();

    // revalidate when window/tab gets focus or becomes visible
    const onFocus = () => refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    // light polling while visible
    const startPolling = () => {
      stopPolling();
      if (document.visibilityState !== "visible") return;
      timer = window.setInterval(refresh, 5000); // 5s; adjust if needed
    };
    const stopPolling = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };
    startPolling();
    document.addEventListener("visibilitychange", startPolling);

    return () => {
      alive = false;
      ctrl.abort();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("visibilitychange", startPolling);
      if (timer) window.clearInterval(timer);
    };
  }, []);

  if (orders === null) return <div>Loading…</div>;
  if (error)
    return (
      <div className="text-red-400 text-sm">Failed to load orders: {error}</div>
    );
  if (orders.length === 0) return <div>No orders yet.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Orders</h1>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id} className="border border-white/10 rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Order #{o.id}</div>
                <div className="text-xs text-white/60">
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="font-semibold">${fmt(o.total)}</div>
            </div>

            <div className="mt-3 grid gap-2">
              {o.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 text-sm">
                  <div className="relative h-10 w-10 overflow-hidden rounded bg-white/10">
                    {it.product?.imageUrl ? (
                      <Image
                        src={it.product.imageUrl}
                        alt={it.product.name}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="line-clamp-1">
                      {it.product?.name ?? "Product"}
                    </div>
                    <div className="text-white/60">
                      Qty {it.quantity} • ${fmt(it.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
