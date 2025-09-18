import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const page = Number(q.get("page") ?? 1);
  const pageSize = Number(q.get("pageSize") ?? 8);
  const category = q.get("category") ?? undefined;
  const search = q.get("q") ?? undefined;
  const minPrice = q.get("minPrice") ? Number(q.get("minPrice")) : undefined;
  const maxPrice = q.get("maxPrice") ? Number(q.get("maxPrice")) : undefined;

  const where: Prisma.ProductWhereInput = {
    ...(category ? { category: { slug: category } } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(minPrice != null || maxPrice != null
      ? {
          price: {
            ...(minPrice != null ? { gte: minPrice } : {}),
            ...(maxPrice != null ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const [rawItems, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const items = rawItems.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  return NextResponse.json({ items, total, page, pageSize, categories });
}
