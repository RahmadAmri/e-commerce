"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Order = { id: number; email: string; createdAt: string; total: number };

export default function OrdersPage() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((j) => {
        setData(j);
        setLoading(false);
      });
  }, []);
  if (loading) return <div>Loading…</div>;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Orders</h1>
      <ul className="space-y-2">
        {data?.map((o) => (
          <li key={o.id} className="border rounded p-2">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">Order #{o.id}</div>
                <div className="text-sm text-gray-500">
                  {o.email} • {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="font-semibold">${Number(o.total).toFixed(2)}</div>
            </div>
            <Link href={`/orders/${o.id}`} className="text-sm underline">
              View details
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
