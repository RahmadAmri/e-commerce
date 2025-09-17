import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc"]).optional(),
  q: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.format() },
      { status: 400 }
    );
  }
  const { page, pageSize, category, sort, q } = parsed.data;

  const where: Prisma.ProductWhereInput = {};
  if (category) where.category = { slug: category };
  if (q)
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];

  let orderBy: Prisma.ProductOrderByWithRelationInput | undefined;
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else orderBy = { createdAt: "desc" };

  const [rawItems, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Normalize Decimal to number for client convenience
  const items = rawItems.map((p) => ({ ...p, price: Number(p.price) }));

  return NextResponse.json({ items, total, page, pageSize, categories });
}
