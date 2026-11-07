import { Suspense } from "react";
import { StaffShell } from "@/components/staff/staff-shell";

export default function DjLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading...</p>}>
      <StaffShell allowed={["dj", "admin"]} title="DJ">
        {children}
      </StaffShell>
    </Suspense>
  );
}
