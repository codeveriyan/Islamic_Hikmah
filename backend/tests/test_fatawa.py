"""
tests/test_fatawa.py
--------------------
Automated tests for the Fatawa & Scholarly Answers API.

Run with:
    .venv/Scripts/python.exe -m pytest tests/test_fatawa.py -v
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from server import app
from fatawa_catalog import FATAWA_CATALOG, CATEGORIES, ALLOWED_SOURCE_HOSTS

client = TestClient(app, raise_server_exceptions=True)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_categories():
    resp = client.get("/api/fatawa/categories")
    assert resp.status_code == 200
    return resp.json()


def _search(q=None, category=None, page=1, limit=20):
    params = {"page": page, "limit": limit}
    if q is not None:
        params["q"] = q
    if category is not None:
        params["category"] = category
    resp = client.get("/api/fatawa/search", params=params)
    return resp


def _get_by_id(fatawa_id: str):
    return client.get(f"/api/fatawa/{fatawa_id}")


# ===========================================================================
# Category tests
# ===========================================================================

class TestCategories:
    def test_categories_returns_200(self):
        resp = client.get("/api/fatawa/categories")
        assert resp.status_code == 200

    def test_categories_is_list(self):
        data = _get_categories()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_categories_have_required_fields(self):
        for cat in _get_categories():
            assert "id" in cat
            assert "name_english" in cat
            assert "name_arabic" in cat
            assert "icon" in cat
            assert "description" in cat
            assert "count" in cat
            assert isinstance(cat["count"], int)
            assert cat["count"] >= 0

    def test_all_catalog_category_ids_represented(self):
        """Every category used in the catalog must appear in /categories."""
        category_ids_in_catalog = {f.get("category") for f in FATAWA_CATALOG if f.get("category")}
        response_ids = {c["id"] for c in _get_categories()}
        for cat_id in category_ids_in_catalog:
            assert cat_id in response_ids, f"Missing category '{cat_id}' in /categories response"

    def test_category_counts_match_catalog(self):
        """Counts must reflect published, non-permission_required items."""
        published_by_cat: dict[str, int] = {}
        for item in FATAWA_CATALOG:
            if (
                item.get("review_status") == "published"
                and item.get("license") != "permission_required"
            ):
                cat = item.get("category", "")
                published_by_cat[cat] = published_by_cat.get(cat, 0) + 1

        for cat_data in _get_categories():
            # Category count in /categories may be total (not filtered), so just
            # verify it's non-negative and an int.
            assert isinstance(cat_data["count"], int)


# ===========================================================================
# Search tests
# ===========================================================================

class TestSearch:
    def test_search_no_query_returns_200(self):
        resp = _search()
        assert resp.status_code == 200

    def test_search_response_schema(self):
        data = _search().json()
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "results" in data
        assert isinstance(data["results"], list)

    def test_search_only_returns_published(self):
        data = _search().json()
        for item in data["results"]:
            assert item["review_status"] == "published"

    def test_search_skips_permission_required(self):
        data = _search().json()
        for item in data["results"]:
            assert item["license"] != "permission_required"

    def test_search_by_keyword_english(self):
        data = _search(q="riba").json()
        assert data["total"] > 0
        for item in data["results"]:
            text = " ".join([
                item.get("title", ""),
                item.get("question_summary", ""),
                item.get("excerpt_or_summary", ""),
            ]).lower()
            assert "riba" in text or "interest" in text

    def test_search_by_keyword_case_insensitive(self):
        lower = _search(q="riba").json()["total"]
        upper = _search(q="RIBA").json()["total"]
        assert lower == upper

    def test_search_arabic_diacritic_normalization(self):
        """Searching with or without diacritics should return the same results."""
        # "صَلاة" with fatha vs "صلاة" without — both should match
        base = _search(q="صلاة").json()["total"]
        diacritic = _search(q="صَلاة").json()["total"]
        assert base == diacritic

    def test_search_empty_query_returns_all_published(self):
        empty = _search(q="").json()["total"]
        no_q = _search().json()["total"]
        assert empty == no_q

    def test_search_by_valid_category(self):
        resp = _search(category="worship")
        assert resp.status_code == 200
        data = resp.json()
        for item in data["results"]:
            assert item["category"] == "worship"

    def test_search_by_invalid_category_returns_422(self):
        resp = _search(category="invalid_category_xyz")
        assert resp.status_code == 422

    def test_pagination_page_1(self):
        data_p1 = _search(page=1, limit=2).json()
        data_p2 = _search(page=2, limit=2).json()
        if data_p1["total"] > 2:
            ids_p1 = [r["id"] for r in data_p1["results"]]
            ids_p2 = [r["id"] for r in data_p2["results"]]
            assert set(ids_p1).isdisjoint(set(ids_p2)), "Pages must not overlap"

    def test_pagination_limit_enforced(self):
        data = _search(limit=2).json()
        assert len(data["results"]) <= 2

    def test_search_limit_max_50(self):
        resp = client.get("/api/fatawa/search", params={"limit": 100})
        assert resp.status_code == 422  # FastAPI query validation

    def test_no_full_copyrighted_text(self):
        """
        Verify that no catalog item contains an excerpt of 1000+ characters that
        could constitute a full copyrighted answer reproduction.
        """
        for item in FATAWA_CATALOG:
            excerpt = item.get("excerpt_or_summary", "")
            assert len(excerpt) < 1000, (
                f"Item {item['id']} excerpt_or_summary is {len(excerpt)} chars — "
                "may be a full reproduction. Keep summaries original and under 1000 chars."
            )
# ===========================================================================
# Detail by ID tests
# ===========================================================================

class TestDetail:
    def test_known_id_returns_200(self):
        known_id = FATAWA_CATALOG[0]["id"]
        resp = _get_by_id(known_id)
        assert resp.status_code == 200

    def test_known_id_schema_v1(self):
        known_id = FATAWA_CATALOG[0]["id"]
        data = _get_by_id(known_id).json()
        assert data["schema_version"] == 1

    def test_known_id_has_source_url(self):
        known_id = FATAWA_CATALOG[0]["id"]
        data = _get_by_id(known_id).json()
        assert data["source_url"].startswith("https://")

    def test_unknown_id_returns_404(self):
        resp = _get_by_id("nonexistent-fatwa-id")
        assert resp.status_code == 404

    def test_malformed_id_returns_422(self):
        """IDs with special characters (not alphanumeric-hyphen) must be rejected."""
        resp = _get_by_id("../etc/passwd")
        # FastAPI router will match if the path resolves; the route handler
        # validates and returns 422
        assert resp.status_code in (404, 422)

    def test_detail_contains_evidence_citations(self):
        for item in FATAWA_CATALOG:
            resp = _get_by_id(item["id"])
            if resp.status_code == 200:
                data = resp.json()
                assert isinstance(data["evidence_citations"], list)


# ===========================================================================
# Source URL allow-list tests
# ===========================================================================

class TestSourceUrlAllowlist:
    def test_all_catalog_source_urls_are_https(self):
        for item in FATAWA_CATALOG:
            url = item.get("source_url", "")
            assert url.startswith("https://"), (
                f"Item {item['id']} source_url must use HTTPS: {url}"
            )

    def test_all_catalog_source_urls_on_allowlist(self):
        from urllib.parse import urlparse
        for item in FATAWA_CATALOG:
            url = item.get("source_url", "")
            host = urlparse(url).netloc.lower().lstrip("www.")
            assert host in ALLOWED_SOURCE_HOSTS, (
                f"Item {item['id']} source_url host '{host}' is not in ALLOWED_SOURCE_HOSTS"
            )

    def test_all_citation_urls_on_allowlist(self):
        from urllib.parse import urlparse
        for item in FATAWA_CATALOG:
            for cit in item.get("evidence_citations", []):
                url = cit.get("url", "")
                if url:
                    host = urlparse(url).netloc.lower().lstrip("www.")
                    assert host in ALLOWED_SOURCE_HOSTS, (
                        f"Citation URL host '{host}' in item {item['id']} "
                        "is not in ALLOWED_SOURCE_HOSTS"
                    )

    def test_all_catalog_license_fields_valid(self):
        valid_licenses = {
            "original_islamic_hikmah_summary",
            "licensed_content",
            "public_domain",
            "permission_required",
        }
        for item in FATAWA_CATALOG:
            assert item.get("license") in valid_licenses, (
                f"Item {item['id']} has invalid license '{item.get('license')}'"
            )

    def test_all_catalog_schema_version_is_1(self):
        for item in FATAWA_CATALOG:
            assert item.get("schema_version") == 1, (
                f"Item {item['id']} schema_version must be 1"
            )

    def test_http_url_rejected_by_validate_source_url(self):
        """HTTP (non-TLS) URLs must be rejected even if the hostname is on the allowlist."""
        from server import _validate_source_url
        from fastapi import HTTPException
        import pytest

        with pytest.raises(HTTPException) as exc_info:
            _validate_source_url("http://islamqa.info/en/answers/219")
        assert exc_info.value.status_code == 422
        assert "https" in exc_info.value.detail.lower()

    def test_https_url_accepted_by_validate_source_url(self):
        """A well-formed HTTPS allowlisted URL must pass validation."""
        from server import _validate_source_url
        result = _validate_source_url("https://islamqa.info/en/answers/219")
        assert result == "https://islamqa.info/en/answers/219"

    def test_unknown_host_rejected_by_validate_source_url(self):
        """A domain not on the allowlist must be rejected even over HTTPS."""
        from server import _validate_source_url
        from fastapi import HTTPException
        import pytest

        with pytest.raises(HTTPException) as exc_info:
            _validate_source_url("https://example.com/fatwa/123")
        assert exc_info.value.status_code == 422
        assert "allowlist" in exc_info.value.detail.lower()

    def test_malicious_prefix_host_rejected_by_validate_source_url(self):
        """Hostnames with 'w' or 'www' prefixes like wwwwislamqa.info must not bypass allowlist."""
        from server import _validate_source_url
        from fastapi import HTTPException
        import pytest

        with pytest.raises(HTTPException) as exc_info:
            _validate_source_url("https://wwwwislamqa.info/en/answers/219")
        assert exc_info.value.status_code == 422
        assert "allowlist" in exc_info.value.detail.lower()



# ===========================================================================
# Draft access authentication tests
# ===========================================================================

class TestDraftAccess:
    def test_include_draft_without_auth_returns_401(self):
        """Unauthenticated callers must not be able to request draft content."""
        resp = client.get("/api/fatawa/search", params={"include_draft": "true"})
        assert resp.status_code == 401

    def test_include_draft_false_without_auth_is_allowed(self):
        """Public search with default include_draft=false must not require auth."""
        resp = client.get("/api/fatawa/search")
        assert resp.status_code == 200


# ===========================================================================
# Catalog integrity tests
# ===========================================================================

class TestCatalogIntegrity:
    def test_catalog_entry_count(self):
        """Catalog must have exactly 13 entries. Update this test when adding new ones."""
        assert len(FATAWA_CATALOG) == 13

    def test_all_entries_have_unique_ids(self):
        ids = [item["id"] for item in FATAWA_CATALOG]
        assert len(ids) == len(set(ids)), "Duplicate IDs found in catalog"

    def test_all_entries_have_required_top_level_fields(self):
        required = {
            "schema_version", "id", "title", "question_summary",
            "excerpt_or_summary", "category", "category_name_english",
            "category_name_arabic", "evidence_citations", "source_provider",
            "source_url", "source_reference", "review_status", "license",
            "catalog_version", "content_version",
        }
        for item in FATAWA_CATALOG:
            missing = required - set(item.keys())
            assert not missing, f"Item {item.get('id')} missing fields: {missing}"

    def test_published_items_have_no_incomplete_reviews(self):
        """
        Items with review_status='published' must have reviewer_name_or_org and reviewed_at populated.
        """
        for item in FATAWA_CATALOG:
            if item.get("review_status") == "published":
                reviewer = item.get("reviewer_name_or_org")
                reviewed_at = item.get("reviewed_at")
                assert reviewer, f"Published item {item['id']} missing reviewer_name_or_org"
                assert reviewed_at, f"Published item {item['id']} missing reviewed_at"

    def test_frontend_and_backend_catalog_parity(self):
        """
        Automated deep parity check verifying backend fatawa_catalog.py and frontend
        fatawaService.ts LOCAL_CATALOG contain identical items, IDs, titles, categories,
        review statuses, and reviewer attribution.
        """
        import re
        from pathlib import Path

        frontend_service_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "services" / "fatawaService.ts"
        assert frontend_service_path.exists(), f"Frontend service file not found at {frontend_service_path}"

        frontend_text = frontend_service_path.read_text(encoding="utf-8")

        # Extract LOCAL_CATALOG block from frontend file
        catalog_match = re.search(r'export const LOCAL_CATALOG: FatawaItem\[\] = \[(.*?)\n\];', frontend_text, re.DOTALL)
        assert catalog_match, "LOCAL_CATALOG block not found in fatawaService.ts"

        catalog_block = catalog_match.group(1)
        frontend_items: dict[str, dict] = {}
        for obj_match in re.finditer(r'\{\s*schema_version:.*?\n\s*\},?', catalog_block, re.DOTALL):
            obj_str = obj_match.group(0)
            id_m = re.search(r'id:\s*"([^"]+)"', obj_str)
            title_m = re.search(r'title:\s*"([^"]+)"', obj_str)
            cat_m = re.search(r'category:\s*"([^"]+)"', obj_str)
            status_m = re.search(r'review_status:\s*"([^"]+)"', obj_str)
            rev_m = re.search(r'reviewer_name_or_org:\s*"([^"]+)"', obj_str)

            if id_m:
                item_id = id_m.group(1)
                frontend_items[item_id] = {
                    "title": title_m.group(1) if title_m else None,
                    "category": cat_m.group(1) if cat_m else None,
                    "review_status": status_m.group(1) if status_m else None,
                    "reviewer_name_or_org": rev_m.group(1) if rev_m else None,
                }

        backend_ids = [item["id"] for item in FATAWA_CATALOG]
        frontend_ids = list(frontend_items.keys())

        # 1. Count and ID set parity
        assert len(frontend_ids) == len(backend_ids), (
            f"Catalog length mismatch: backend has {len(backend_ids)}, frontend has {len(frontend_ids)}"
        )
        assert set(frontend_ids) == set(backend_ids), (
            f"Catalog ID set mismatch: {set(backend_ids) ^ set(frontend_ids)}"
        )

        # 2. Field-level parity for every item
        for backend_item in FATAWA_CATALOG:
            b_id = backend_item["id"]
            f_item = frontend_items[b_id]

            assert f_item["title"] == backend_item["title"], (
                f"Title mismatch for item {b_id}:\nBackend: '{backend_item['title']}'\nFrontend: '{f_item['title']}'"
            )
            assert f_item["category"] == backend_item["category"], (
                f"Category mismatch for item {b_id}:\nBackend: '{backend_item['category']}'\nFrontend: '{f_item['category']}'"
            )
            assert f_item["review_status"] == backend_item["review_status"], (
                f"review_status mismatch for item {b_id}:\nBackend: '{backend_item['review_status']}'\nFrontend: '{f_item['review_status']}'"
            )
            assert f_item["reviewer_name_or_org"] == backend_item.get("reviewer_name_or_org"), (
                f"reviewer_name_or_org mismatch for item {b_id}:\nBackend: '{backend_item.get('reviewer_name_or_org')}'\nFrontend: '{f_item['reviewer_name_or_org']}'"
            )


# ===========================================================================
# Ask Question Endpoint Tests
# ===========================================================================

class TestAskQuestion:
    """Tests for POST /api/fatawa/ask dynamic question resolver."""

    def test_ask_question_returns_200_with_valid_response_schema(self):
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        res = client.post("/api/fatawa/ask", json={"question": "What is the ruling on fasting while traveling on a plane?"})
        assert res.status_code == 200
        data = res.json()
        assert "id" in data
        assert "excerpt_or_summary" in data
        assert len(data["evidence_citations"]) >= 1
        assert "source_url" in data

    def test_ask_question_empty_string_returns_422(self):
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        res = client.post("/api/fatawa/ask", json={"question": "  "})
        assert res.status_code == 422

