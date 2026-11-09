"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "druids-table-v1";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export type TableSession = { token: string; label: string };

export function isValidTokenFormat(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

// Never trust what is in storage; check its shape before using it.
function parseStored(raw: string | null): TableSession | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const d = data as Record<string, unknown>;
    if (typeof d.token !== "string" || typeof d.label !== "string") return null;
    if (!TOKEN_PATTERN.test(d.token)) return null;
    return { token: d.token, label: d.label.slice(0, 40) };
  } catch {
    return null;
  }
}

type TableContextValue = {
  table: TableSession | null;
  hydrated: boolean;
  setTable: (table: TableSession) => void;
  clearTable: () => void;
};

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({ children }: { children: ReactNode }) {
  const [table, setTableState] = useState<TableSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load the remembered table once, after the page is running in the browser
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    setTableState(parseStored(stored));
    setHydrated(true);
  }, []);

  const setTable = useCallback((next: TableSession) => {
    setTableState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private mode). The table still works for this visit.
    }
  }, []);

  const clearTable = useCallback(() => {
    setTableState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do if storage is unavailable.
    }
  }, []);

  const value = useMemo<TableContextValue>(
    () => ({ table, hydrated, setTable, clearTable }),
    [table, hydrated, setTable, clearTable]
  );

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}

export function useTable(): TableContextValue {
  const ctx = useContext(TableContext);
  if (!ctx) {
    throw new Error("useTable must be used inside <TableProvider>");
  }
  return ctx;
}
