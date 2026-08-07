import httpx
import urllib.parse
from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

islam_house_router = APIRouter(prefix="/islamhouse", tags=["IslamHouse"])

ISLAMHOUSE_API_KEY = "paV29H2gm56kvLP"
BASE_URL = "https://api3.islamhouse.com/v3"

@islam_house_router.get("/items")
async def get_items(
    language: str = Query(default="en", description="Language code (e.g. en, ar)"),
    type: str = Query(default="showall", description="Item type: showall, book, audio, video, article, fatwa, poster"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, le=50, description="Items per page")
) -> Any:
    """
    Proxy to IslamHouse get-items API.
    """
    url = f"{BASE_URL}/{ISLAMHOUSE_API_KEY}/main/get-items/{language}/{type}/{page}/{limit}/json"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"IslamHouse API HTTP error: {e}")
            raise HTTPException(status_code=e.response.status_code, detail="Error fetching from IslamHouse")
        except httpx.RequestError as e:
            logger.error(f"IslamHouse API Request error: {e}")
            raise HTTPException(status_code=502, detail="Failed to connect to IslamHouse API")

@islam_house_router.get("/search")
async def search_items(
    language: str = Query(default="en", description="Language code (e.g. en, ar)"),
    query: str = Query(..., min_length=2, description="Search query"),
    type: str = Query(default="showall", description="Item type filter"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=10, le=50, description="Items per page")
) -> Any:
    """Search IslamHouse items by keyword."""
    encoded_query = urllib.parse.quote(query)
    url = f"{BASE_URL}/{ISLAMHOUSE_API_KEY}/main/get-items/{language}/{type}/{page}/{limit}/json?search={encoded_query}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"IslamHouse API HTTP error: {e}")
            raise HTTPException(status_code=e.response.status_code, detail="Error fetching from IslamHouse")
        except httpx.RequestError as e:
            logger.error(f"IslamHouse API Request error: {e}")
            raise HTTPException(status_code=502, detail="Failed to connect to IslamHouse API")

@islam_house_router.get("/item/{item_id}")
async def get_item_details(
    item_id: int = Path(..., description="The ID of the item"),
    language: str = Query(default="en", description="Language code")
) -> Any:
    """
    Proxy to IslamHouse get-item details API.
    """
    url = f"{BASE_URL}/{ISLAMHOUSE_API_KEY}/main/get-item/{item_id}/{language}/json"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"IslamHouse API HTTP error: {e}")
            raise HTTPException(status_code=e.response.status_code, detail="Error fetching item details from IslamHouse")
        except httpx.RequestError as e:
            logger.error(f"IslamHouse API Request error: {e}")
            raise HTTPException(status_code=502, detail="Failed to connect to IslamHouse API")
