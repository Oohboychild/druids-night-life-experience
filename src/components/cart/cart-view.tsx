"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_QUANTITY_PER_ITEM, useCart } from "@/components/cart/cart-provider";
import { formatKes } from "@/lib/format";

export function CartView() {
  const { lines, hydrated, subtotalKes, setQuantity, clear } = useCart();
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (!hydrated) {
    return <p className="text-sm text-[#B8B2C5]">Loading your cart...</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#251A37] p-6 text-center">
        <p className="text-sm text-[#B8B2C5]">Your cart is empty.</p>
        <Link
          href="/menu"
          className="inline-block rounded-full bg-[#A855F7] px-5 py-2 text-sm font-medium text-white hover:bg-[#9333EA]"
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {lines.map((line) => {
          const lineTotal = (Math.round(line.priceKes * 100) * line.quantity) / 100;
          return (
            <li
              key={line.itemId}
              className="space-y-3 rounded-2xl border border-white/10 bg-[#251A37] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{line.name}</p>
                  <p className="text-xs text-[#B8B2C5]">{formatKes(line.priceKes)} each</p>
                </div>
                <p className="font-semibold text-[#D6B779]">{formatKes(lineTotal)}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Remove one ${line.name}`}
                    onClick={() => setQuantity(line.itemId, line.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Add one ${line.name}`}
                    disabled={line.quantity >= MAX_QUANTITY_PER_ITEM}
                    onClick={() => setQuantity(line.itemId, line.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${line.name} from the cart`}
                  onClick={() => setQuantity(line.itemId, 0)}
                  className="text-[#B8B2C5] hover:text-red-400"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-[#251A37] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#B8B2C5]">Subtotal</span>
          <span className="text-lg font-semibold text-[#D6B779]">{formatKes(subtotalKes)}</span>
        </div>
        <p className="text-xs text-[#B8B2C5]">
          Final prices are confirmed by our system when you place your order.
        </p>
        <Button disabled className="w-full">
          Place order (opens soon)
        </Button>
      </div>

      <div className="text-center">
        {confirmingClear ? (
          <div className="space-y-3">
            <p className="text-sm text-[#B8B2C5]">Remove everything from your cart?</p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  clear();
                  setConfirmingClear(false);
                }}
              >
                Yes, clear cart
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingClear(false)}>
                Keep items
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="text-sm text-[#B8B2C5] underline hover:text-white"
          >
            Clear cart
          </button>
        )}
      </div>
    </div>
  );
}
