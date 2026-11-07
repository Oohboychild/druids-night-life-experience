import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentStaff, roleHome } from "@/lib/auth/staff";

async function RoleRedirect() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/staff/login");
  redirect(roleHome(staff.role));
}

export default function StaffHomePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading...</p>}>
      <RoleRedirect />
    </Suspense>
  );
}
