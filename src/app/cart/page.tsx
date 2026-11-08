import type { Metadata } from "next";
import { CustomerShell } from "@/components/customer/customer-shell";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <CustomerShell>
      <h1 className="mb-4 font-serif text-2xl text-[#D6B779]">Your cart</h1>
      <CartView />
    </CustomerShell>
  );
}
