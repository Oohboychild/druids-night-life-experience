"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatKes } from "@/lib/format";

// Floating bar above the bottom navigation. Hidden while the cart is empty.
export function CartBar() {
  const { hydrated, itemCount, subtotalKes } = useCart();

  if (!hydrated || itemCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 px-4">
      <Link
        href="/cart"
        className="mx-auto flex max-w-md items-center justify-between rounded-2xl bg-[#A855F7] px-4 py-3 text-white shadow-lg shadow-black/40"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShoppingBag className="h-5 w-5" />
          View cart ({itemCount} {itemCount === 1 ? "item" : "items"})
        </span>
        <span className="text-sm font-semibold">{formatKes(subtotalKes)}</span>
      </Link>
    </div>
  );
}
