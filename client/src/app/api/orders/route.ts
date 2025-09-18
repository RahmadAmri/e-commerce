import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { CheckoutPayload } from "@/types";
import { getUserBySessionToken } from "@/lib/auth";

const OrderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1),
});

const OrderSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  address: z.string().min(3),
  city: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
  items: z.array(OrderItemSchema).min(1),
});

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });
  const normalized = orders.map((o) => ({
    ...o,
    total: Number(o.total),
    items: o.items.map((it) => ({ ...it, unitPrice: Number(it.unitPrice) })),
  }));
  return NextResponse.json(normalized);
}

export async function POST(req: NextRequest) {
  // Require session
  const token = req.cookies.get("session_token")?.value ?? "";
  const user = await getUserBySessionToken(token);
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const data: CheckoutPayload = await req.json();
  const parsed = OrderSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { email, fullName, address, city, country, postalCode, items } =
    parsed.data;

  // Fetch products to get current prices and validate availability
  const productIds = items.map((i: { productId: number }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap: Map<number, (typeof products)[number]> = new Map(
    products.map((p: (typeof products)[number]) => [p.id, p])
  );

  let total = 0;
  const orderItems = items.map((i: { productId: number; quantity: number }) => {
    const p = productMap.get(i.productId);
    if (!p) throw new Error(`Product ${i.productId} not found`);
    if (p.stock < i.quantity)
      throw new Error(`Insufficient stock for ${p.name}`);
    const line = Number(p.price) * i.quantity;
    total += line;
    return { productId: p.id, quantity: i.quantity, unitPrice: p.price };
  });

  const order = await prisma.order.create({
    data: {
      email,
      fullName,
      address,
      city,
      country,
      postalCode,
      total,
      items: { create: orderItems },
      userId: user.id, // link order to logged-in user
    },
    include: {
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
