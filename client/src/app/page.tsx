"use client";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import Image from "next/image";

type Category = { id: number; name: string; slug: string };
type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  category: Category;
};

type ApiResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
};

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<string | undefined>();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const add = useCart((s) => s.addItem);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", String(pageSize));
      if (category) sp.set("category", category);
      if (sort) sp.set("sort", sort);
      if (debouncedQ) sp.set("q", debouncedQ);
      const res = await fetch(`/api/products?${sp.toString()}`, {
        cache: "no-store",
      });
      const json: ApiResponse = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [page, pageSize, category, sort, debouncedQ]);

  const totalPages = useMemo(
    () => (data ? Math.ceil(data.total / data.pageSize) : 1),
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border px-2 py-1 rounded"
            placeholder="Search products"
          />
        </div>
        <div>
          <label className="block text-sm">Category</label>
          <select
            value={category ?? ""}
            onChange={(e) => setCategory(e.target.value || undefined)}
            className="border px-2 py-1 rounded"
          >
            <option value="">All</option>
            {data?.categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Sort</label>
          <select
            value={sort ?? ""}
            onChange={(e) => setSort(e.target.value || undefined)}
            className="border px-2 py-1 rounded"
          >
            <option value="">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading && <div>Loading…</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.items.map((p) => (
          <div key={p.id} className="border rounded p-3 flex flex-col">
            <div className="relative w-full h-32 mb-2">
              <Image
                src={p.imageUrl}
                alt={p.name}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-gray-500">{p.category.name}</div>
            <div className="mt-auto flex items-center justify-between">
              <div className="font-bold">${p.price.toFixed(2)}</div>
              <button
                className="text-sm border px-2 py-1 rounded hover:bg-gray-50"
                onClick={() =>
                  add({
                    productId: p.id,
                    name: p.name,
                    price: p.price,
                    imageUrl: p.imageUrl,
                  })
                }
              >
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="border px-2 py-1 rounded"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>
        <div>
          Page {page} / {totalPages}
        </div>
        <button
          className="border px-2 py-1 rounded"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
