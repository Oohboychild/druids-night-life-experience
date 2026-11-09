"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidTokenFormat, useTable } from "@/components/table/table-provider";

type Status = "checking" | "invalid" | "error";

// Opened by the QR code: confirms the table with the server, remembers it, then shows the menu.
export function TableLanding({ token }: { token: string }) {
  const router = useRouter();
  const { setTable } = useTable();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;

    async function resolveTable() {
      if (!isValidTokenFormat(token)) {
        setStatus("invalid");
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc("resolve_table_by_token", {
        p_token: token,
      });

      if (!active) return;

      if (error) {
        setStatus("error");
        return;
      }

      const row = data?.[0];
      if (!row) {
        setStatus("invalid");
        return;
      }

      setTable({ token, label: row.table_label });
      router.replace("/menu");
    }

    void resolveTable();
    return () => {
      active = false;
    };
  }, [token, router, setTable]);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100D19] p-6 text-sm text-[#B8B2C5]">
        Opening your table...
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 bg-[#100D19] p-6 text-center text-white">
      <h1 className="font-serif text-2xl text-[#D6B779]">
        {status === "invalid" ? "This QR code isn't valid" : "We couldn't reach the server"}
      </h1>
      <p className="text-sm text-[#B8B2C5]">
        {status === "invalid"
          ? "Please ask a member of our team to help you."
          : "Check your connection and try again."}
      </p>
      <div className="flex gap-3">
        {status === "error" && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#A855F7] px-5 py-2 text-sm font-medium text-white hover:bg-[#9333EA]"
          >
            Try again
          </button>
        )}
        <Link
          href="/menu"
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-white hover:bg-white/10"
        >
          Browse the menu
        </Link>
      </div>
    </main>
  );
}
