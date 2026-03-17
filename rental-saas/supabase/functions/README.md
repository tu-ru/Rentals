# Edge Functions

## Deployment
supabase functions deploy mpesa-register-pull
supabase functions deploy mpesa-query-transactions
supabase functions deploy mpesa-callback
supabase functions deploy send-notifications
supabase functions deploy scheduled-reminders
supabase functions deploy send-sms
supabase functions deploy check-sms-delivery
supabase functions deploy sms-balance

## Environment Variables (set in Supabase Dashboard)
MPESA_CONSUMER_KEY=         (from Safaricom Daraja)
MPESA_CONSUMER_SECRET=      (from Safaricom Daraja)
MPESA_ENV=sandbox            (or "production")

## SMS (Celcom Africa)
SMS credentials are stored PER ORGANIZATION in organizations.settings JSONB.
They are NOT global environment variables - each landlord uses their own Celcom account.

Fields stored in organizations.settings:
  sms_api_key      - From Celcom dashboard -> GET API KEY & PARTNER ID
  sms_partner_id   - From Celcom dashboard -> GET API KEY & PARTNER ID
  sms_shortcode    - Your registered Sender ID (e.g. "RENTMS")

SERVICE_SECRET     - A random UUID you generate once, set in Supabase secrets.
                     Used for internal Edge Function to Edge Function calls.
                     Generate with: node -e "console.log(crypto.randomUUID())"

## SMS Endpoints
- Send: https://isms.celcomafrica.com/api/services/sendsms/
- DLR:  https://isms.celcomafrica.com/api/services/getdlr/
- Bal:  https://isms.celcomafrica.com/api/services/getbalance/

## Celcom Error Code Reference
200  = Success
1001 = Invalid sender ID (check shortcode)
1002 = Network not allowed
1003 = Invalid mobile number (check phone format: 254XXXXXXXXX)
1004 = Low SMS credits (top up account)
1006 = Invalid credentials (check apikey + partnerID)
4091 = No Partner ID set
4092 = No API key provided
4093 = Details not found

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
