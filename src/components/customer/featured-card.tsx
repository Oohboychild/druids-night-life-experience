import { Badge } from "@/components/ui/badge";
import { formatKes, type FeaturedItem } from "@/lib/sample-data";

export function FeaturedCard({ item }: { item: FeaturedItem }) {
  return (
    <div className="w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#251A37]">
      <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[#A855F7]/30 to-[#251A37] text-xs text-[#B8B2C5]">
        Image placeholder
      </div>
      <div className="space-y-1 p-4">
        <Badge variant="outline" className="border-[#D6B779]/40 text-[#D6B779]">
          {item.category}
        </Badge>
        <h3 className="font-medium text-white">{item.name}</h3>
        <p className="text-sm text-[#B8B2C5]">{item.description}</p>
        <p className="pt-1 font-semibold text-[#D6B779]">{formatKes(item.priceKes)}</p>
      </div>
    </div>
  );
}