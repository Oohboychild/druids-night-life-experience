import Link from "next/link";
import { Music2, UtensilsCrossed } from "lucide-react";
import { SiteHeader } from "@/components/customer/site-header";
import { BottomNav } from "@/components/customer/bottom-nav";
import { FeaturedCard } from "@/components/customer/featured-card";
import { TableBadge } from "@/components/table/table-badge";
import { SAMPLE_FEATURED } from "@/lib/sample-data";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#100D19] text-white">
      <SiteHeader />

      <main className="mx-auto max-w-md space-y-8 px-4 pb-28 pt-6">
        <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#251A37] via-[#251A37] to-[#A855F7]/30 p-6">
          <p className="text-sm text-[#B8B2C5]">Welcome to</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-wide text-[#D6B779]">
            Druids Lounge
          </h1>
          <p className="mt-3 text-sm text-[#B8B2C5]">
            Order drinks, request your song, and enjoy the night, all from your table.
          </p>
          <TableBadge />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/menu"
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#251A37] p-4 transition hover:border-[#A855F7]/60"
          >
            <UtensilsCrossed className="h-6 w-6 text-[#A855F7]" />
            <span className="font-medium">Browse Menu</span>
          </Link>
          <Link
            href="/music"
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#251A37] p-4 transition hover:border-[#A855F7]/60"
          >
            <Music2 className="h-6 w-6 text-[#A855F7]" />
            <span className="font-medium">Request a Song</span>
          </Link>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Featured tonight</h2>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {SAMPLE_FEATURED.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
          <p className="mt-2 text-xs text-[#B8B2C5]">
            Sample items shown. Real menu coming soon.
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
