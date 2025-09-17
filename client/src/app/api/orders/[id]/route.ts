import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (Number.isNaN(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...order,
    total: Number(order.total),
    items: order.items.map((it) => ({
      ...it,
      unitPrice: Number(it.unitPrice),
    })),
  });
}
