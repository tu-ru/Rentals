# Edge Functions

## Deployment
supabase functions deploy mpesa-register-pull
supabase functions deploy mpesa-query-transactions
supabase functions deploy mpesa-callback
supabase functions deploy send-notifications
supabase functions deploy scheduled-reminders

## Environment Variables (set in Supabase Dashboard)
MPESA_CONSUMER_KEY=         (from Safaricom Daraja)
MPESA_CONSUMER_SECRET=      (from Safaricom Daraja)
MPESA_ENV=sandbox            (or "production")

## M-Pesa Go-Live Checklist
- [ ] Create Daraja account at developer.safaricom.co.ke
- [ ] Create sandbox app, get Consumer Key + Secret
- [ ] Test register-pull in sandbox
- [ ] Test query-transactions with simulator data
- [ ] Set invoice_number as the M-Pesa bill reference in tenant communications
- [ ] Submit Go Live request on Daraja portal
- [ ] Set MPESA_ENV=production in Supabase secrets
- [ ] Register production Pull API via Settings page
- [ ] Test first live reconciliation with a real transaction
