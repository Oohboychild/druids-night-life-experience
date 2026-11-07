import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type StaffUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: Exclude<AppRole, "customer">;
};

const STAFF_ROLES: AppRole[] = ["waiter", "dj", "admin"];

export function roleHome(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "dj":
      return "/dj";
    case "waiter":
      return "/waiter";
    default:
      return "/staff/login";
  }
}

// Returns the signed-in staff member, or null for signed-out, anonymous,
// deactivated or customer accounts. cache() means it runs once per request.
export const getCurrentStaff = cache(async (): Promise<StaffUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active || !STAFF_ROLES.includes(profile.role)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: profile.display_name,
    role: profile.role as StaffUser["role"],
  };
});

// Use at the top of any staff page or layout.
export async function requireRole(allowed: AppRole[]): Promise<StaffUser> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/staff/login");
  if (!allowed.includes(staff.role)) redirect(roleHome(staff.role));
  return staff;
}
