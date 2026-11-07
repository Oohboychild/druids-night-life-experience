import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const PROTECTED_PREFIXES = ["/admin", "/dj", "/waiter"];

function isProtectedPath(path: string) {
  return (
    path === "/staff" ||
    PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
  );
}

// Refreshes the Supabase auth session on every matched request, keeps the
// cookies in sync, and sends signed-out or anonymous visitors away from
// staff areas. (Role checks happen in server components; this is a first gate.)
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: no code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && (!user || user.is_anonymous)) {
    const url = request.nextUrl.clone();
    url.pathname = "/staff/login";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    // Keep any refreshed auth cookies on the redirect
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
