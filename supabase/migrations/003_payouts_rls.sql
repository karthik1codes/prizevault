-- Payouts table RLS + idempotent upsert key for executed winner rows
-- Run in Supabase Dashboard → SQL Editor after 001 and 002

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payouts_anon_all ON payouts;
CREATE POLICY payouts_anon_all ON payouts
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_proposal_winner
  ON payouts(proposal_id, winner_wallet);
