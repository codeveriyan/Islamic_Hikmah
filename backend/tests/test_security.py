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
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server  # noqa: E402


def run(coroutine):
    return asyncio.run(coroutine)


def verified_user(**overrides):
    now = server.datetime.utcnow()
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
        {"sub": "victim@example.com", "exp": server.datetime.utcnow() + server.timedelta(hours=1)},
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
        .not_valid_before(server.datetime.utcnow() - server.timedelta(minutes=1))
        .not_valid_after(server.datetime.utcnow() + server.timedelta(hours=1))
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


def test_cached_firebase_certificate_survives_a_network_outage(monkeypatch, tmp_path):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    certificate_name = x509.Name(
        [x509.NameAttribute(NameOID.COMMON_NAME, "cached securetoken signer")]
    )
    certificate = (
        x509.CertificateBuilder()
        .subject_name(certificate_name)
        .issuer_name(certificate_name)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(server.datetime.utcnow() - server.timedelta(minutes=1))
        .not_valid_after(server.datetime.utcnow() + server.timedelta(hours=1))
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


def test_unsafe_custom_auth_routes_are_removed():
    paths = {route.path for route in server.app.routes}

    assert "/api/signup" not in paths
    assert "/api/login" not in paths
    assert "/api/google-login" not in paths
    assert "/api/forgot-password" not in paths
    assert "/api/reset-password" not in paths
    assert "/api/verify-utr" not in paths
    assert "/api/status" not in paths
    assert "/api/hadith/{collection}/backfill" not in paths
    assert "/api/payment-submissions" in paths


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
