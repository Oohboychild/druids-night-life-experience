import { Suspense } from "react";
import { TableLanding } from "@/components/table/table-landing";

type Props = { params: Promise<{ token: string }> };

async function TableEntry({ params }: Props) {
  const { token } = await params;
  return <TableLanding token={token} />;
}

export default function TablePage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#100D19] p-6 text-sm text-[#B8B2C5]">
          Opening your table...
        </main>
      }
    >
      <TableEntry params={params} />
    </Suspense>
  );
}
