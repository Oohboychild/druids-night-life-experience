"use client";

import { MapPin } from "lucide-react";
import { useTable } from "@/components/table/table-provider";

export function TableBadge() {
  const { table, hydrated } = useTable();

  return (
    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs">
      <MapPin className="h-3.5 w-3.5 text-[#A855F7]" />
      {!hydrated
        ? "Checking your table..."
        : table
          ? `Table: ${table.label}`
          : "Scan the QR code on your table"}
    </div>
  );
}
