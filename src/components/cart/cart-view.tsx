"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_QUANTITY_PER_ITEM, useCart } from "@/components/cart/cart-provider";
import { useTable } from "@/components/table/table-provider";
import { createClient } from "@/lib/supabase/client";
import { describeOrderError } from "@/lib/order-errors";
import { formatKes } from "@/lib/format";

type PlacedOrder = { id: string; orderNumber: number | null; totalKes: number | null };

export function CartView() {
  const { lines, hydrated, subtotalKes, setQuantity, clear } = useCart();
  const { table, hydrated: tableHydrated } = useTable();
  const [supabase] = useState(() => createClient());

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  async function placeOrder() {
    if (placing || !table || lines.length === 0) return;
    setPlacing(true);
    setError(null);

    try {
      // Customers are anonymous: they get a session only now, at the moment they order.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          setError("We couldn't start your session. Please try again.");
          return;
        }
      }

      const trimmedNotes = notes.trim();

      // Only item ids and quantities are sent. The server looks up the real prices.
      const { data: orderId, error: rpcError } = await supabase.rpc("create_order", {
        p_table_token: table.token,
        p_items: lines.map((line) => ({ item_id: line.itemId, quantity: line.quantity })),
        p_payment_method: "cash",
        p_notes: trimmedNotes === "" ? undefined : trimmedNotes,
      });

      if (rpcError || !orderId) {
        setError(describeOrderError(rpcError?.message ?? ""));
        return;
      }

      // Show the real number and total as confirmed by the server
      const { data: order } = await supabase
        .from("orders")
        .select("order_number, total_kes")
        .eq("id", orderId)
        .maybeSingle();

      clear();
      setNotes("");
      setPlaced({
        id: orderId,
        orderNumber: order?.order_number ?? null,
        totalKes: order?.total_kes ?? null,
      });
    } catch {
      setError("We couldn't place your order. Please check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (placed) {
    return (
      <div className="space-y-4 rounded-2xl border border-[#A855F7]/40 bg-[#251A37] p-6 text-center">
        <h2 className="font-serif text-xl text-[#D6B779]">Order received</h2>
        {placed.orderNumber !== null && (
          <p className="text-3xl font-semibold">#{placed.orderNumber}</p>
        )}
        {placed.totalKes !== null && (
          <p className="text-sm text-[#B8B2C5]">
            Total to pay: <span className="font-semibold text-white">{formatKes(placed.totalKes)}</span>{" "}
            (cash)
          </p>
        )}
        <p className="text-sm text-[#B8B2C5]">
          A waiter will confirm your order shortly. Please keep your order number handy.
        </p>
        <Link
          href="/menu"
          className="inline-block rounded-full bg-[#A855F7] px-5 py-2 text-sm font-medium text-white hover:bg-[#9333EA]"
        >
          Back to the menu
        </Link>
      </div>
    );
  }

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

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#251A37] p-4">
        {/* Table confirmation */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-[#A855F7]" />
          {!tableHydrated ? (
            <span className="text-[#B8B2C5]">Checking your table...</span>
          ) : table ? (
            <span>
              Ordering for <span className="font-semibold">Table {table.label}</span>
            </span>
          ) : (
            <span className="text-amber-300">
              Scan the QR code on your table to place an order.
            </span>
          )}
        </div>

        {/* Optional note */}
        <div className="space-y-1">
          <label htmlFor="order-notes" className="text-xs text-[#B8B2C5]">
            Note for the waiter (optional)
          </label>
          <textarea
            id="order-notes"
            rows={2}
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="For example: no ice, extra lemon"
            className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#B8B2C5] focus:outline-none focus:ring-2 focus:ring-[#A855F7]"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-[#B8B2C5]">Subtotal</span>
          <span className="text-lg font-semibold text-[#D6B779]">{formatKes(subtotalKes)}</span>
        </div>

        <p className="text-xs text-[#B8B2C5]">
          Payment: cash at your table. M-Pesa is coming soon. Final prices are confirmed by our
          system when you place your order.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <Button
          className="w-full bg-[#A855F7] text-white hover:bg-[#9333EA]"
          disabled={placing || !table}
          onClick={placeOrder}
        >
          {placing ? "Placing your order..." : "Place order"}
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
