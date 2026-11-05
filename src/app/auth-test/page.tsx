"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Info = { userId: string; isAnonymous: boolean; role: string | null } | null;

export default function AuthTestPage() {
  const [supabase] = useState(() => createClient());
  const [info, setInfo] = useState<Info>(null);
  const [message, setMessage] = useState("Checking session...");

  const load = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setInfo(null);
      setMessage("Not signed in.");
      return;
    }

    // This goes through RLS ("profiles: read own"), so it proves the policy works.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    setInfo({
      userId: user.id,
      isAnonymous: user.is_anonymous ?? false,
      role: profile?.role ?? null,
    });
    setMessage("Signed in.");
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function signInAnonymously() {
    setMessage("Signing in...");
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }
    await load();
  }

  async function signOut() {
    await supabase.auth.signOut();
    await load();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <h1 className="font-serif text-2xl text-[#D6B779]">Auth test (temporary)</h1>
      <p className="text-sm text-muted-foreground">{message}</p>

      {info && (
        <div className="space-y-1 rounded-xl border border-white/10 bg-card p-4 text-sm">
          <p>User ID: <span className="break-all">{info.userId}</span></p>
          <p>Anonymous: {String(info.isAnonymous)}</p>
          <p>Profile role: {info.role ?? "no profile found"}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={signInAnonymously} disabled={!!info}>
          Sign in anonymously
        </Button>
        <Button variant="outline" onClick={signOut} disabled={!info}>
          Sign out
        </Button>
      </div>
    </main>
  );
}