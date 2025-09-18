import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserBySessionToken } from "@/lib/auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const itemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1),
});

const baseShipping = z.object({
  fullName: z.string().min(2),
  address: z.string().min(3),
  city: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
});
const guestShipping = baseShipping.extend({ email: z.string().email() });
const userShipping = baseShipping.extend({
  email: z.string().email().optional(),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value ?? "";
    const user = await getUserBySessionToken(token);

    if (!user) return NextResponse.json({ orders: [] }, { status: 200 });

    const ordersRaw = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitPrice: true,
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    const orders = ordersRaw.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      total: Number(o.total as unknown),
      items: o.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        price: Number(it.unitPrice as unknown),
        product: it.product
          ? {
              id: it.product.id,
              name: it.product.name,
              imageUrl: it.product.imageUrl,
            }
          : null,
      })),
    }));

    return NextResponse.json(
      { orders },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err: unknown) {
    console.error("GET /api/orders failed:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  try {
    const token = req.cookies.get("session_token")?.value ?? "";
    const user = await getUserBySessionToken(token);

    const body = await req.json().catch(() => ({}));

    const itemsParsed = z.array(itemSchema).safeParse(body.items);
    if (!itemsParsed.success || itemsParsed.data.length === 0) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    const shippingParsed = (user ? userShipping : guestShipping).safeParse(
      body
    );
    if (!shippingParsed.success) {
      return NextResponse.json(
        { error: shippingParsed.error.flatten() },
        { status: 400 }
      );
    }
    const shipping = shippingParsed.data;

    const productIds = itemsParsed.data.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const priceMap = new Map(dbProducts.map((p) => [p.id, Number(p.price)]));

    if (priceMap.size !== new Set(productIds).size) {
      return NextResponse.json(
        { error: "Some products not found" },
        { status: 400 }
      );
    }

    const normalized = itemsParsed.data.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      price: priceMap.get(i.productId)!, // number
    }));
    const total = normalized.reduce((s, i) => s + i.quantity * i.price, 0);

    const baseOrderData = {
      total,
      email: user?.email ?? shipping.email!,
      fullName: shipping.fullName,
      address: shipping.address,
      city: shipping.city,
      country: shipping.country,
      postalCode: shipping.postalCode,
      ...(user ? { user: { connect: { id: user.id } } } : {}),
    } satisfies Omit<Prisma.OrderCreateInput, "items">;

    const order = await prisma.order.create({
      data: {
        ...baseOrderData,
        items: {
          create: normalized.map((i) => ({
            quantity: i.quantity,
            unitPrice: i.price, // schema field
            product: { connect: { id: i.productId } },
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(
      { id: order.id },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    console.error("POST /api/orders failed:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Failed to create order";
    return NextResponse.json(
      { error: isDev ? message : "Failed to create order" },
      { status: 500 }
    );
  }
}
