import { Suspense } from "react";
import type { Metadata } from "next";
import { CustomerShell } from "@/components/customer/customer-shell";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { getMenu } from "@/lib/menu";

export const metadata: Metadata = { title: "Menu" };

async function MenuContent() {
  const menu = await getMenu();

  if (!menu.ok) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-white/10 bg-[#251A37] p-4 text-sm text-[#B8B2C5]"
      >
        {menu.error}
      </p>
    );
  }

  return <MenuBrowser categories={menu.categories} items={menu.items} />;
}

function MenuSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className="h-26 animate-pulse rounded-2xl bg-[#251A37]" />
      ))}
    </div>
  );
}

export default function MenuPage() {
  return (
    <CustomerShell>
      <h1 className="mb-4 font-serif text-2xl text-[#D6B779]">Menu</h1>
      <Suspense fallback={<MenuSkeleton />}>
        <MenuContent />
      </Suspense>
    </CustomerShell>
  );
}
