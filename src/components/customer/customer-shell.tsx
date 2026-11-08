import { SiteHeader } from "@/components/customer/site-header";
import { BottomNav } from "@/components/customer/bottom-nav";
import { CartBar } from "@/components/cart/cart-bar";

// Common frame for customer pages: header, content, floating cart bar, bottom nav.
export function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#100D19] text-white">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 pb-44 pt-6">{children}</main>
      <CartBar />
      <BottomNav />
    </div>
  );
}
