"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import type { MenuCategory, MenuItem } from "@/lib/menu";

type KindFilter = "all" | "drink" | "food";

const KIND_TABS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "drink", label: "Drinks" },
  { value: "food", label: "Food" },
];

const chipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
    active
      ? "border-[#A855F7] bg-[#A855F7] text-white"
      : "border-white/15 bg-transparent text-[#B8B2C5] hover:text-white"
  );

export function MenuBrowser({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [categoryId, setCategoryId] = useState<string>("all");

  const visibleCategories = useMemo(
    () => categories.filter((c) => kind === "all" || c.kind === kind),
    [categories, kind]
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleCategories
      .filter((c) => categoryId === "all" || c.id === categoryId)
      .map((category) => ({
        category,
        items: items.filter(
          (item) =>
            item.categoryId === category.id &&
            (q === "" ||
              item.name.toLowerCase().includes(q) ||
              (item.description ?? "").toLowerCase().includes(q))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleCategories, categoryId, items, query]);

  function selectKind(next: KindFilter) {
    setKind(next);
    setCategoryId("all"); // the old category may not belong to the new tab
  }

  function clearFilters() {
    setQuery("");
    setKind("all");
    setCategoryId("all");
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-[#251A37] p-4 text-sm text-[#B8B2C5]">
        The menu is being prepared. Please check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8B2C5]" />
        <Input
          type="search"
          inputMode="search"
          placeholder="Search drinks and food"
          aria-label="Search the menu"
          value={query}
          maxLength={60}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {query !== "" && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B2C5] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Drinks / Food tabs */}
      <div className="flex gap-2">
        {KIND_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={kind === tab.value}
            onClick={() => selectKind(tab.value)}
            className={chipClass(kind === tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      {visibleCategories.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            aria-pressed={categoryId === "all"}
            onClick={() => setCategoryId("all")}
            className={chipClass(categoryId === "all")}
          >
            All categories
          </button>
          {visibleCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
              className={chipClass(categoryId === c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {groups.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-[#251A37] p-4 text-sm text-[#B8B2C5]">
          <p>No items match your search.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="font-medium text-[#A855F7] hover:underline"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        groups.map(({ category, items: groupItems }) => (
          <section key={category.id} className="space-y-3">
            <h2 className="font-serif text-lg text-[#D6B779]">{category.name}</h2>
            <ul className="space-y-3">
              {groupItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
