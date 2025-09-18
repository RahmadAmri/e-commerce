"use client";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import Image from "next/image";
import { useToast } from "@/components/Toast";

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

function fmtPrice(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

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
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const add = useCart((s) => s.addItem);
  const cartCount = useCart((s) =>
    s.items.reduce((sum: number, it) => sum + (it.quantity ?? 1), 0)
  );
  const { success } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [category, debouncedQ, sort, minPrice, maxPrice]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", String(pageSize));
      if (category) sp.set("category", category);
      if (sort) sp.set("sort", sort);
      if (debouncedQ) sp.set("q", debouncedQ);
      if (minPrice != null) sp.set("minPrice", String(minPrice));
      if (maxPrice != null) sp.set("maxPrice", String(maxPrice));
      const res = await fetch(`/api/products?${sp.toString()}`, {
        cache: "no-store",
      });
      const json: ApiResponse = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [page, pageSize, category, sort, debouncedQ, minPrice, maxPrice]);

  const totalPages = useMemo(
    () => (data ? Math.ceil(data.total / data.pageSize) : 1),
    [data]
  );

  return (
    <div className="space-y-6">
      {/* Header / Hero */}
      <div className="rounded-xl border bg-gradient-to-br from-neutral-900 via-neutral-900/80 to-neutral-800 p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Discover products you’ll love
            </h1>
            <p className="text-sm text-white/60">
              Search, filter by category, and sort to find the best deals.
            </p>
          </div>
          <div className="text-sm px-3 py-1 rounded-full bg-white/10 border border-white/10">
            Cart: <span className="font-semibold">{cartCount}</span> item
            {cartCount === 1 ? "" : "s"}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Search</label>
            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full border border-white/10 bg-white/5 placeholder:text-white/40 text-white rounded px-3 py-2 outline-none focus:ring-2 ring-white/20"
                placeholder="Search products"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Categories chips */}
              <div className="flex gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  className={[
                    "px-3 py-1.5 rounded-full text-sm border transition-colors",
                    !category
                      ? "bg-white text-black border-white"
                      : "border-white/15 text-white hover:bg-white/10",
                  ].join(" ")}
                  onClick={() => setCategory(undefined)}
                >
                  All
                </button>
                {data?.categories.map((c) => {
                  const active = category === c.slug;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCategory(active ? undefined : c.slug)}
                      className={[
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        active
                          ? "bg-white text-black border-white"
                          : "border-white/15 text-white hover:bg-white/10",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs text-white/60 mb-1">Sort</label>
                <select
                  value={sort ?? ""}
                  onChange={(e) => setSort(e.target.value || undefined)}
                  className="border border-white/10 bg-white/5 text-white rounded px-3 py-2 outline-none focus:ring-2 ring-white/20"
                >
                  <option value="">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">
                Min Price
              </label>
              <input
                type="number"
                min={0}
                value={minPrice ?? ""}
                onChange={(e) =>
                  setMinPrice(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full border border-white/10 bg-white/5 text-white rounded px-3 py-2 outline-none focus:ring-2 ring-white/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">
                Max Price
              </label>
              <input
                type="number"
                min={0}
                value={maxPrice ?? ""}
                onChange={(e) =>
                  setMaxPrice(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full border border-white/10 bg-white/5 text-white rounded px-3 py-2 outline-none focus:ring-2 ring-white/20"
                placeholder="999"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="rounded border border-white/10 p-3">
              <div className="h-32 rounded skeleton mb-3" />
              <div className="h-4 w-2/3 skeleton mb-2" />
              <div className="h-3 w-1/3 skeleton mb-4" />
              <div className="h-8 w-full skeleton rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          aria-live="polite"
        >
          {data?.items.map((p, i) => (
            <div
              key={p.id}
              className="group border border-white/10 rounded-xl p-3 flex flex-col bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-[2px] animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="relative w-full h-36 mb-3 rounded-md overflow-hidden bg-white/5">
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-medium line-clamp-1">{p.name}</div>
                <span className="text-xs px-2 py-0.5 rounded-full border border-white/15 text-white/80">
                  {p.category.name}
                </span>
              </div>

              <p className="text-xs text-white/50 line-clamp-2 mb-3">
                {p.description}
              </p>

              <div className="mt-auto flex items-center justify-between">
                <div className="font-bold">${fmtPrice(p.price)}</div>
                <button
                  className="text-sm border border-white/15 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 active:scale-[0.97] transition-all"
                  onClick={() => {
                    add({
                      productId: p.id,
                      name: p.name,
                      price: Number(p.price), // ensure number
                      imageUrl: p.imageUrl,
                    });
                    success(`Added “${p.name}” to cart`);
                  }}
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-2 justify-center">
        <button
          className="border border-white/15 px-3 py-1.5 rounded bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Prev
        </button>
        <div className="text-sm px-3 py-1.5 rounded border border-white/10 bg-white/5">
          Page {page} / {totalPages}
        </div>
        <button
          className="border border-white/15 px-3 py-1.5 rounded bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
