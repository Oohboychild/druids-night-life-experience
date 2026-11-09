-- =====================================================================
-- Migration 0007: let signed-out visitors resolve a table from its QR token
-- Runs inside one transaction: if anything fails, nothing is applied.
-- =====================================================================
begin;

grant execute on function public.resolve_table_by_token(text) to anon;

commit;
