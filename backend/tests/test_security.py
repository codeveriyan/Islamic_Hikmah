import asyncio
import sys
import time
from pathlib import Path

import jwt
import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server  # noqa: E402


def run(coroutine):
    return asyncio.run(coroutine)


def verified_user(**overrides):
    now = server.datetime.now(server.timezone.utc)
    user = {
        "id": "firebase-uid-1",
        "name": "Test User",
        "email": "test@example.com",
        "profile_image": None,
        "provider": "firebase",
        "provider_id": "firebase-uid-1",
        "email_verified": True,
        "created_at": now,
        "updated_at": now,
        "last_login": now,
        "status": "Active",
        "tier": "free",
        "trial_started_at": None,
        "trial_active": False,
        "trial_ends_at": None,
    }
    user.update(overrides)
    return user


def test_known_hs256_tokens_are_not_accepted_as_application_credentials():
    forged_token = jwt.encode(
        {"sub": "victim@example.com", "exp": server.datetime.now(server.timezone.utc) + server.timedelta(hours=1)},
        "supersecretkeyforislamichikmahauth12345",
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as error:
        run(server.get_current_user_profile(f"Bearer {forged_token}"))

    assert error.value.status_code == 401


def test_valid_firebase_rs256_token_creates_a_bound_free_account(monkeypatch):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    certificate_name = x509.Name(
        [x509.NameAttribute(NameOID.COMMON_NAME, "securetoken test signer")]
    )
    certificate = (
        x509.CertificateBuilder()
        .subject_name(certificate_name)
        .issuer_name(certificate_name)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(server.datetime.now(server.timezone.utc) - server.timedelta(minutes=1))
        .not_valid_after(server.datetime.now(server.timezone.utc) + server.timedelta(hours=1))
        .sign(private_key, hashes.SHA256())
    )
    certificate_pem = certificate.public_bytes(
        encoding=serialization.Encoding.PEM,
    )
    now = int(time.time())
    token = jwt.encode(
        {
            "aud": server.FIREBASE_PROJECT_ID,
            "iss": f"https://securetoken.google.com/{server.FIREBASE_PROJECT_ID}",
            "sub": "firebase-uid-1",
            "user_id": "firebase-uid-1",
            "email": "test@example.com",
            "email_verified": True,
            "auth_time": now - 5,
            "iat": now,
            "exp": now + 3600,
        },
        private_key,
        algorithm="RS256",
        headers={"kid": "test-key"},
    )
    inserted = []

    monkeypatch.setattr(server, "get_google_public_key", lambda _kid: certificate_pem)

    async def find_user(_email):
        return None

    async def insert_user(user):
        inserted.append(user)

    monkeypatch.setattr(server, "db_find_user_by_email", find_user)
    monkeypatch.setattr(server, "db_insert_user", insert_user)

    user = run(server.get_current_user_profile(f"Bearer {token}"))

    assert user["provider"] == "firebase"
    assert user["provider_id"] == "firebase-uid-1"
    assert user["tier"] == "free"
    assert inserted[0]["email"] == "test@example.com"


def test_cached_firebase_certificate_survives_a_network_outage(monkeypatch):
    import tempfile
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        certificate_name = x509.Name(
            [x509.NameAttribute(NameOID.COMMON_NAME, "cached securetoken signer")]
        )
        certificate = (
            x509.CertificateBuilder()
            .subject_name(certificate_name)
            .issuer_name(certificate_name)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(server.datetime.now(server.timezone.utc) - server.timedelta(minutes=1))
            .not_valid_after(server.datetime.now(server.timezone.utc) + server.timedelta(hours=1))
            .sign(private_key, hashes.SHA256())
        )
        certificate_pem = certificate.public_bytes(
            encoding=serialization.Encoding.PEM,
        ).decode("utf-8")
        now = server.datetime.now(server.timezone.utc)

        monkeypatch.setattr(
            server,
            "FIREBASE_CERT_CACHE_PATH",
            tmp_path / "firebase_public_certs_cache.json",
        )
        monkeypatch.setattr(server, "GOOGLE_CERTS", {})
        monkeypatch.setattr(
            server,
            "GOOGLE_CERTS_EXPIRE",
            server.datetime.min.replace(tzinfo=server.timezone.utc),
        )
        server._save_google_certificate_cache(
            {"cached-key": certificate_pem},
            now - server.timedelta(seconds=1),
        )

        def offline(*_args, **_kwargs):
            raise server.requests.ConnectionError("offline")

        monkeypatch.setattr(server.requests, "get", offline)

        assert server.get_google_public_key("cached-key") == certificate_pem


def get_app_paths(app_or_router):
    paths = set()
    routes = getattr(app_or_router, "routes", [])
    for r in routes:
        if hasattr(r, "path"):
            paths.add(r.path)
        if hasattr(r, "original_router"):
            paths.update(get_app_paths(r.original_router))
        elif hasattr(r, "router"):
            paths.update(get_app_paths(r.router))
    return paths


def test_unsafe_custom_auth_routes_are_removed():
    paths = get_app_paths(server.app)

    assert "/api/signup" not in paths
    assert "/api/login" not in paths
    assert "/api/google-login" not in paths
    assert "/api/forgot-password" not in paths
    assert "/api/reset-password" not in paths
    assert "/api/verify-utr" not in paths
    assert "/api/status" not in paths
    assert "/api/hadith/{collection}/backfill" not in paths
    assert "/api/payment-submissions" in paths
    assert "/api/v1/auth/entitlements/verify-iap" in paths


def test_x_forwarded_for_is_ignored_when_trust_proxy_headers_is_false(monkeypatch):
    monkeypatch.setattr(server, "TRUST_PROXY_HEADERS", False)
    
    class MockClient:
        host = "1.2.3.4"
        
    class MockRequest:
        def __init__(self):
            self.headers = {"x-forwarded-for": "9.9.9.9, 8.8.8.8"}
            self.client = MockClient()
            
    req = MockRequest()
    ip = server._get_client_ip(req)
    assert ip == "1.2.3.4"  # Ignores spoofed X-Forwarded-For

    monkeypatch.setattr(server, "TRUST_PROXY_HEADERS", True)
    ip2 = server._get_client_ip(req)
    assert ip2 == "9.9.9.9"  # Extracts forwarded IP correctly when trusted



def test_verify_iap_entitlements_activates_premium(monkeypatch):
    user = verified_user(email="buyer@example.com", tier="free")
    updated_records = []

    async def mock_update(email, data):
        updated_records.append((email, data))
        user.update(data)

    monkeypatch.setattr(server, "db_update_user", mock_update)
    monkeypatch.setattr(
        server,
        "fetch_revenuecat_entitlement",
        lambda _app_user_id: run_async_result(
            {
                "active": True,
                "entitlement": {
                    "product_identifier": "hikmah_yearly",
                    "expires_date": "2099-01-01T00:00:00Z",
                },
                "original_app_user_id": "firebase-uid-1",
            }
        ),
    )

    submission = server.VerifyIapInput(
        appUserId="firebase-uid-1",
    )

    response = run(server.verify_iap_entitlements(submission, current_user=user))

    assert response["status"] == "success"
    assert response["tier"] == "premium"
    assert user["tier"] == "premium"
    assert len(updated_records) == 1
    assert updated_records[0][1]["tier"] == "premium"


def test_verify_iap_rejects_unverified_client_entitlement_claim(monkeypatch):
    user = verified_user(email="buyer@example.com", tier="free")
    monkeypatch.setattr(
        server,
        "fetch_revenuecat_entitlement",
        lambda _app_user_id: run_async_result(
            {"active": False, "entitlement": None, "original_app_user_id": "firebase-uid-1"}
        ),
    )
    with pytest.raises(ValidationError):
        server.VerifyIapInput(
            appUserId="firebase-uid-1",
            entitlements={"fake": {"isActive": True}},
        )

    submission = server.VerifyIapInput(appUserId="firebase-uid-1")

    with pytest.raises(HTTPException) as exc:
        run(server.verify_iap_entitlements(submission, current_user=user))

    assert exc.value.status_code == 402
    assert user["tier"] == "free"


def run_async_result(value):
    async def result():
        return value

    return result()


def test_cors_configuration_never_uses_a_wildcard():
    assert server.CORS_ORIGINS
    assert "*" not in server.CORS_ORIGINS


def test_development_premium_allowlist_is_disabled_in_production(monkeypatch):
    user = verified_user(email="developer@example.com")
    monkeypatch.setattr(server, "DEV_PREMIUM_EMAILS", {"developer@example.com"})
    monkeypatch.setattr(server, "APP_ENV", "production")

    assert server.apply_development_entitlements(user)["tier"] == "free"

    monkeypatch.setattr(server, "APP_ENV", "development")
    development_user = server.apply_development_entitlements(user)

    assert development_user["tier"] == "premium"
    assert development_user["_development_entitlement"] is True
    assert user["tier"] == "free"


def test_database_failures_fail_closed_when_dev_fallback_is_disabled(monkeypatch):
    monkeypatch.setattr(server, "ALLOW_IN_MEMORY_DB", False)

    with pytest.raises(HTTPException) as error:
        server._database_unavailable("test operation", RuntimeError("database down"))

    assert error.value.status_code == 503


def test_development_memory_store_skips_mongodb_without_timeout(monkeypatch):
    class ForbiddenUsers:
        async def find_one(self, *_args, **_kwargs):
            raise AssertionError("Development memory mode must not query MongoDB")

        async def insert_one(self, *_args, **_kwargs):
            raise AssertionError("Development memory mode must not query MongoDB")

    class ForbiddenDatabase:
        users = ForbiddenUsers()

    monkeypatch.setattr(server, "APP_ENV", "development")
    monkeypatch.setattr(server, "ALLOW_IN_MEMORY_DB", True)
    monkeypatch.setattr(server, "db", ForbiddenDatabase())
    server.IN_MEMORY_DB["users"].pop("fast@example.com", None)

    user = verified_user(email="fast@example.com")
    run(server.db_insert_user(user))

    assert run(server.db_find_user_by_email("FAST@example.com")) is user


def test_payment_submission_is_pending_and_uses_server_owned_price(monkeypatch):
    inserted = []

    async def find_payment(_utr):
        return None

    async def insert_payment(record):
        inserted.append(record)

    async def forbidden_user_update(*_args, **_kwargs):
        raise AssertionError("Payment submission must not grant an entitlement")

    monkeypatch.setattr(server, "db_find_payment_by_utr", find_payment)
    monkeypatch.setattr(server, "db_insert_payment", insert_payment)
    monkeypatch.setattr(server, "db_update_user", forbidden_user_update)

    result = run(
        server.submit_payment(
            server.PaymentSubmissionInput(utr="123456789012", plan="yearly"),
            verified_user(),
        )
    )

    assert result["status"] == "pending_manual_review"
    assert result["amount"] == 199
    assert inserted[0]["status"] == "pending_manual_review"
    assert inserted[0]["amount"] == 199
    assert "verified_at" not in inserted[0]


def test_payment_submission_rejects_duplicate_utr(monkeypatch):
    async def find_payment(_utr):
        return {"_id": "123456789012"}

    monkeypatch.setattr(server, "db_find_payment_by_utr", find_payment)

    with pytest.raises(HTTPException) as error:
        run(
            server.submit_payment(
                server.PaymentSubmissionInput(utr="123456789012", plan="monthly"),
                verified_user(),
            )
        )

    assert error.value.status_code == 409


def test_payment_plan_cannot_be_supplied_outside_server_catalog():
    with pytest.raises(ValidationError):
        server.PaymentSubmissionInput(utr="123456789012", plan="attacker-price")

    with pytest.raises(ValidationError):
        server.PaymentSubmissionInput(utr="123456789012", plan="monthly", amount=1)


def test_unverified_accounts_cannot_submit_payments():
    with pytest.raises(HTTPException) as error:
        run(
            server.submit_payment(
                server.PaymentSubmissionInput(utr="123456789012", plan="monthly"),
                verified_user(email_verified=False),
            )
        )

    assert error.value.status_code == 403


def test_configured_payment_admin_can_approve_utr_and_grant_time_limited_premium(monkeypatch):
    payment = {
        "_id": "123456789012",
        "user_id": "firebase-uid-1",
        "user_email": "buyer@example.com",
        "plan": "monthly",
        "status": "pending_manual_review",
    }
    payment_updates = []
    user_updates = []

    async def find_payment(_utr):
        return payment

    async def transition_payment(_utr, _expected_status, update):
        payment_updates.append(update)
        payment.update(update)
        return True

    async def update_user_by_id(_user_id, update):
        user_updates.append(update)

    monkeypatch.setattr(server, "PAYMENT_ADMIN_EMAILS", {"admin@example.com"})
    monkeypatch.setattr(server, "db_find_payment_by_utr", find_payment)
    monkeypatch.setattr(server, "db_transition_payment", transition_payment)
    monkeypatch.setattr(server, "db_update_user_by_id", update_user_by_id)

    result = run(
        server.review_payment_submission(
            "123456789012",
            server.PaymentReviewInput(decision="approve"),
            verified_user(email="admin@example.com"),
        )
    )

    assert result["status"] == "approved"
    assert payment_updates[0]["status"] == "approved"
    assert user_updates[0]["tier"] == "premium"
    assert user_updates[0]["premium_source"] == "upi_manual"
    assert user_updates[0]["premium_until"] > server.datetime.now(server.timezone.utc)


def test_revenuecat_webhook_requires_auth_and_deduplicates_events(monkeypatch):
    monkeypatch.setattr(server, "REVENUECAT_WEBHOOK_AUTH_TOKEN", "webhook-secret")
    monkeypatch.setattr(server, "db_find_user_by_id", lambda _user_id: run_async_result(verified_user()))
    monkeypatch.setattr(
        server,
        "fetch_revenuecat_entitlement",
        lambda _app_user_id: run_async_result(
            {
                "active": True,
                "entitlement": {"product_identifier": "hikmah_monthly"},
                "original_app_user_id": "firebase-uid-1",
            }
        ),
    )
    event_ids = set()

    async def insert_event(event_id, _record):
        if event_id in event_ids:
            return False
        event_ids.add(event_id)
        return True

    monkeypatch.setattr(server, "db_insert_billing_event", insert_event)
    monkeypatch.setattr(server, "db_update_user", lambda _email, _update: run_async_result(None))

    client = TestClient(server.app)
    payload = {"event": {"id": "evt-1", "type": "INITIAL_PURCHASE", "app_user_id": "firebase-uid-1"}}

    assert client.post("/api/webhooks/revenuecat", json=payload).status_code == 401
    first = client.post(
        "/api/webhooks/revenuecat",
        json=payload,
        headers={"Authorization": "webhook-secret"},
    )
    second = client.post(
        "/api/webhooks/revenuecat",
        json=payload,
        headers={"Authorization": "webhook-secret"},
    )

    assert first.status_code == 200
    assert first.json()["status"] == "processed"
    assert second.status_code == 200
    assert second.json()["status"] == "duplicate"


def test_trial_is_started_by_backend_and_cannot_be_restarted(monkeypatch):
    updates = []
    user = verified_user()

    async def update_user(email, update):
        updates.append((email, update))

    monkeypatch.setattr(server, "db_update_user", update_user)

    result = run(server.start_trial_backend(user))

    assert result["status"] == "success"
    assert result["profile"]["trial_active"] is True
    assert updates[0][0] == user["email"]

    with pytest.raises(HTTPException) as error:
        run(server.start_trial_backend(user))

    assert error.value.status_code == 400
