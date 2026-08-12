-- ============================================================================
-- Sponsor wallet client writes (Issue 6 — frontend-direct Razorpay test top-up).
-- Lets an authenticated sponsor read/write ONLY their own wallet rows. Run once.
-- Depends on the sponsors.owner_id → auth.uid() link.
-- (For production, prefer server-verified top-up via NestJS /wallet/verify.)
-- ============================================================================

alter table wallets enable row level security;
alter table wallet_transactions enable row level security;

drop policy if exists sponsor_rw_wallet on wallets;
create policy sponsor_rw_wallet on wallets for all to authenticated
  using (sponsor_id in (select id from sponsors where owner_id = auth.uid()))
  with check (sponsor_id in (select id from sponsors where owner_id = auth.uid()));

drop policy if exists sponsor_rw_wallet_txn on wallet_transactions;
create policy sponsor_rw_wallet_txn on wallet_transactions for all to authenticated
  using (sponsor_id in (select id from sponsors where owner_id = auth.uid()))
  with check (sponsor_id in (select id from sponsors where owner_id = auth.uid()));
