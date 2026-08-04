# Security rollout

The application treats Firebase Authentication plus the FastAPI/MongoDB profile
as the authority for trials and paid entitlements. Google Play purchases are
queried through RevenueCat by the backend, and RevenueCat lifecycle webhooks
are deduplicated before updating an entitlement. The Google Play Android client
does not offer UPI or manual payment submission.

## Required deployment order

1. Back up MongoDB and Firestore.
2. Reconcile existing `premium` users against actual bank or gateway settlement
   records. Do not copy Firestore `tier` values blindly because the previous
   client could write them.
3. Set the backend environment:
   - `MONGO_URL`
   - `DB_NAME`
   - `FIREBASE_PROJECT_ID=islamic-hikmah`
   - `CORS_ORIGINS` with the exact production web origins
   - `ALLOW_IN_MEMORY_DB=false`
4. Deploy `firestore.rules`:

   ```sh
   firebase deploy --only firestore:rules
   ```

5. Deploy the backend and confirm `/api/profile` accepts a real Firebase ID
   token while forged HS256 tokens are rejected.
6. Set `EXPO_PUBLIC_API_BASE_URL` in the frontend build environment and ship the
   updated client.

## Payment state

Configure the RevenueCat Android public SDK key in the frontend build and the
secret `REVENUECAT_API_KEY`, `REVENUECAT_ENTITLEMENT_ID`, and
`REVENUECAT_WEBHOOK_AUTH_TOKEN` in the backend deployment. Configure the
RevenueCat webhook URL as `/api/webhooks/revenuecat` and use the exact same
authorization header value as `REVENUECAT_WEBHOOK_AUTH_TOKEN`.

The backend UTR review endpoint is retained only for reconciling legacy or
external records; it is not reachable from the Google Play client. If it is
used operationally, set `PAYMENT_ADMIN_EMAILS` to a comma-separated list of
verified staff emails and require a bank-statement reconciliation before any
approval. Never grant premium from an unreviewed client-supplied UTR.

## Verification

```sh
python -m pip install -r backend/requirements-dev.txt
python -m pytest backend/tests -q
cd frontend
npm ci
npm run typecheck
```

The CI workflow runs the backend security suite and frontend TypeScript check on
every pull request and push to `main`.
