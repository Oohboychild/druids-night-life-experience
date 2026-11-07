import Link from "next/link";
import { requireRole, type AppRole } from "@/lib/auth/staff";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/staff/sign-out-button";

export async function StaffShell({
  allowed,
  title,
  children,
}: {
  allowed: AppRole[];
  title: string;
  children: React.ReactNode;
}) {
  const staff = await requireRole(allowed);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-4">
            <Logo className="origin-left scale-75" />
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>

          <div className="flex items-center gap-3">
            {staff.role === "admin" && (
              <nav className="hidden gap-3 text-xs text-muted-foreground sm:flex">
                <Link href="/admin" className="hover:text-foreground">Admin</Link>
                <Link href="/waiter" className="hover:text-foreground">Waiter</Link>
                <Link href="/dj" className="hover:text-foreground">DJ</Link>
              </nav>
            )}
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {staff.displayName ?? staff.email} · {staff.role}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
