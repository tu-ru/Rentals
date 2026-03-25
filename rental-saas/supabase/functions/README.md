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
SERVICE_SECRET     - A random UUID you generate once, set in Supabase secrets.
                     Used for internal Edge Function to Edge Function calls.
                     Generate with: node -e "console.log(crypto.randomUUID())"

## M-Pesa (Per Organization)
M-Pesa credentials should be stored PER ORGANIZATION in organizations.settings JSONB.
They are NOT global environment variables when multiple testers or landlords use separate Daraja apps.

Fields stored in organizations.settings:
  mpesa_consumer_key     - Daraja consumer key for the org
  mpesa_consumer_secret  - Daraja consumer secret for the org

Fields stored on organizations table:
  mpesa_shortcode
  mpesa_nominated_number
  mpesa_env              - sandbox or production per organization

## SMS (Celcom Africa)
SMS credentials are stored PER ORGANIZATION in organizations.settings JSONB.
They are NOT global environment variables - each landlord uses their own Celcom account.

Fields stored in organizations.settings:
  sms_api_key      - From Celcom dashboard -> GET API KEY & PARTNER ID
  sms_partner_id   - From Celcom dashboard -> GET API KEY & PARTNER ID
  sms_shortcode    - Your registered Sender ID (e.g. "RENTMS")

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
- [ ] Save the consumer key and consumer secret in the organization's settings
- [ ] Test register-pull in sandbox
- [ ] Test query-transactions with simulator data
- [ ] Set invoice_number as the M-Pesa bill reference in tenant communications
- [ ] Submit Go Live request on Daraja portal
- [ ] Set the organization's mpesa_env to production
- [ ] Register production Pull API via Settings page
- [ ] Test first live reconciliation with a real transaction
