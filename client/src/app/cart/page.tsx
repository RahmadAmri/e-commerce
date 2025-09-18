"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/cart";
import type { CartItem } from "@/store/cart";
import { useToast } from "@/components/Toast";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const removeItemAnimated = useCart((s) => s.removeItemAnimated);
  const removingIds = useCart((s) => s.removingIds);
  const { info } = useToast();

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
          <div className="space-y-3">
            {items.map((it) => {
              const isRemoving = removingIds.includes(it.productId);
              return (
                <div
                  key={it.productId}
                  className={[
                    "cart-row rounded-lg border border-white/10 bg-white/5 p-3 flex items-center gap-3 transition-all",
                    isRemoving ? "cart-row--removing" : "",
                  ].join(" ")}
                >
                  <div className="relative h-16 w-16 shrink-0 rounded bg-white/10 overflow-hidden">
                    <Image
                      src={it.imageUrl}
                      alt={it.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-white/60">
                      ${it.price.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        updateQty(
                          it.productId,
                          Math.max(1, Number(e.target.value))
                        )
                      }
                      className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-right"
                    />
                    <button
                      className="rounded-md border border-white/10 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm transition"
                      onClick={() => {
                        removeItemAnimated(it.productId);
                        info("Removed from cart");
                      }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

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
