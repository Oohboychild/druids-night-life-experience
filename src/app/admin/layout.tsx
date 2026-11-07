import { Suspense } from "react";
import { StaffShell } from "@/components/staff/staff-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading...</p>}>
      <StaffShell allowed={["admin"]} title="Admin">
        {children}
      </StaffShell>
    </Suspense>
  );
}
