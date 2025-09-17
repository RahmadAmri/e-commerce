"use client";
import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  product: { name: string };
};
type Order = {
  id: number;
  email: string;
  createdAt: string;
  total: number;
  items: OrderItem[];
};

export default function OrderDetail({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((j) => {
        setData(j);
        setLoading(false);
      });
  }, [params.id]);
  if (loading) return <div>Loading…</div>;
  if (!data) return <div>Not found</div>;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Order #{data.id}</h1>
      <div className="text-sm text-gray-500">
        {data.email} • {new Date(data.createdAt).toLocaleString()}
      </div>
      <ul className="space-y-2">
        {data.items.map((it: OrderItem) => (
          <li key={it.id} className="flex justify-between">
            <div>
              {it.product.name} × {it.quantity}
            </div>
            <div>${Number(it.unitPrice).toFixed(2)}</div>
          </li>
        ))}
      </ul>
      <div className="font-semibold">
        Total ${Number(data.total).toFixed(2)}
      </div>
    </div>
  );
}
