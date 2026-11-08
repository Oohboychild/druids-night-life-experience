"use client";

import { Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MAX_QUANTITY_PER_ITEM, useCart } from "@/components/cart/cart-provider";
import { formatKes } from "@/lib/format";
import type { MenuItem } from "@/lib/menu";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { hydrated, quantityOf, addItem, setQuantity } = useCart();
  const quantity = hydrated ? quantityOf(item.id) : 0;
  const soldOut = !item.isAvailable;

  return (
    <li className="flex gap-3 rounded-2xl border border-white/10 bg-[#251A37] p-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#A855F7]/30 to-[#100D19]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate font-medium text-white">{item.name}</h3>
        {item.description ? (
          <p className="line-clamp-2 text-xs text-[#B8B2C5]">{item.description}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-semibold text-[#D6B779]">{formatKes(item.priceKes)}</span>

          {soldOut ? (
            <Badge variant="outline" className="border-white/20 text-[#B8B2C5]">
              Sold out
            </Badge>
          ) : quantity === 0 ? (
            <Button
              size="sm"
              className="bg-[#A855F7] text-white hover:bg-[#9333EA]"
              onClick={() =>
                addItem({ itemId: item.id, name: item.name, priceKes: item.priceKes })
              }
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label={`Remove one ${item.name}`}
                onClick={() => setQuantity(item.id, quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Add one ${item.name}`}
                disabled={quantity >= MAX_QUANTITY_PER_ITEM}
                onClick={() => setQuantity(item.id, quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
