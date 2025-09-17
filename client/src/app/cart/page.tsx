"use client";
import Link from "next/link";
import { useCart, type CartItem } from "@/store/cart";
import Image from "next/image";

export default function CartPage() {
  const { items, removeItem, updateQty } = useCart((s) => s);
  const total = items.reduce(
    (sum: number, i: CartItem) => sum + i.price * i.quantity,
    0
  );
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Cart</h1>
      {items.length === 0 ? (
        <div>Your cart is empty.</div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((i: CartItem) => (
              <li
                key={i.productId}
                className="flex items-center gap-3 border p-2 rounded"
              >
                <div className="relative w-12 h-12">
                  <Image
                    src={i.imageUrl}
                    alt={i.name}
                    fill
                    sizes="48px"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-sm text-gray-500">
                    ${i.price.toFixed(2)}
                  </div>
                </div>
                <input
                  type="number"
                  value={i.quantity}
                  min={1}
                  className="w-20 border px-2 py-1 rounded"
                  onChange={(e) =>
                    updateQty(i.productId, Math.max(1, Number(e.target.value)))
                  }
                />
                <button
                  className="text-sm border px-2 py-1 rounded"
                  onClick={() => removeItem(i.productId)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              Total: ${total.toFixed(2)}
            </div>
            <Link href="/checkout" className="border px-3 py-1 rounded">
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
