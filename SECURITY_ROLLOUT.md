# Security rollout

The application now treats Firebase Authentication plus the FastAPI/MongoDB
profile as the authority for trials and paid entitlements. UTR submissions are
stored as `pending_manual_review`; they never unlock premium automatically.

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

The static UPI screen is a safe temporary manual-review flow, not automatic
payment verification. Staff must reconcile each pending UTR with the merchant
bank statement before manually granting premium in the authoritative user
record.

For automatic fulfilment, integrate a payment gateway that:

- creates the order on the backend from the server-owned plan catalog;
- returns only the provider checkout/session identifier to the client;
- verifies the provider's signed webhook over the raw request body;
- checks order ID, user ID, amount, currency, and successful/captured status;
- stores provider event/payment IDs idempotently; and
- updates the MongoDB entitlement only after all checks pass.

Do not re-enable automatic entitlement changes from a UTR supplied by the
client.

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
