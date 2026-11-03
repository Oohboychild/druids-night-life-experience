import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    return NextResponse.json({ ok: res.ok, supabaseStatus: res.status });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not reach Supabase" },
      { status: 502 }
    );
  }
}