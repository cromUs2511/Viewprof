"""Blackboard catalog source adapter.

Extracts course records from Mapúa Blackboard's public course catalog.
Uses guest-login session cookies and HTML parsing (no DWR reverse-engineering).
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential_jitter,
    retry_if_exception_type,
)

from backend.app.config import settings
from backend.app.models.domain import CourseRecord

log = logging.getLogger(__name__)


@dataclass
class ExtractionResult:
    records: list[CourseRecord]
    total_count: int
    page_count: int
    errors: list[str]
    extracted_at: datetime


class BlackboardCatalogAdapter:
    """Adapter for Mapúa Blackboard course catalog.

    Retrieves course data via the public catalog search endpoint with
    guest-login cookies. Handles pagination, retries, and validation.
    """

    BASE_URL = settings.bb_catalog_url
    TERM_ID = settings.bb_term_id
    MAX_PER_PAGE = 1000  # Blackboard's showAllMax limit
    DEFAULT_TIMEOUT = settings.sync_timeout_seconds

    # Search parameters that return all courses for a term
    # Note: showAll=true ignores startIndex, so we paginate manually with numResults
    SEARCH_PARAMS = {
        "type": "Course",
        "termId": TERM_ID,
        "searchField": "CourseName",
        "searchOperator": "NotBlank",
        "searchText": "",
        "command": "NewSearch",
        "numResults": str(MAX_PER_PAGE),
        "sortCol": "identifier",
        "sortDir": "ASCENDING",
    }

    def __init__(self, client: Optional[httpx.AsyncClient] = None):
        self._client = client
        self._cookies: dict[str, str] = {}
        self._owns_client = client is None

    async def __aenter__(self) -> "BlackboardCatalogAdapter":
        if self._owns_client:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.DEFAULT_TIMEOUT),
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            )
        await self._ensure_guest_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if self._owns_client and self._client:
            await self._client.aclose()

    async def _ensure_guest_session(self) -> None:
        """Establish guest session cookies via the login redirect flow."""
        log.info("Establishing guest session with Blackboard...")
        # Initial request gets redirect to guest_login
        resp = await self._client.get(self.BASE_URL, params={"type": "Course", "termId": self.TERM_ID})
        # Follow guest_login redirect chain
        if "action=guest_login" in str(resp.url):
            resp = await self._client.get(str(resp.url))
        # Cookies are now in client's cookie jar
        self._cookies = dict(self._client.cookies)
        log.debug("Guest session cookies: %s", list(self._cookies.keys()))

    @retry(
        wait=wait_exponential_jitter(initial=1, max=30),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError, httpx.HTTPStatusError)),
        reraise=True,
    )
    async def _fetch_page(self, start_index: int = 0) -> str:
        """Fetch a single page of catalog results."""
        params = {**self.SEARCH_PARAMS, "startIndex": str(start_index)}
        resp = await self._client.get(self.BASE_URL, params=params)
        resp.raise_for_status()
        return resp.text

    def _parse_catalog_page(self, html: str, term_id: str, snapshot_id: str) -> tuple[list[CourseRecord], int]:
        """Parse course records from catalog HTML table.

        Returns (records, total_count_from_paging_info).
        """
        soup = BeautifulSoup(html, "lxml")
        records: list[CourseRecord] = []

        # Find the course list table (ID varies: listContainer_datatable or listContainer)
        table = soup.find("table", id="listContainer_datatable")
        if not table:
            table = soup.find("table", id="listContainer")
        if not table:
            # Fallback: any table with course rows
            table = soup.find("table", class_="inventory")
        if not table:
            raise ValueError("Catalog table not found in HTML - source structure may have changed")

        # Extract total count from paging info
        total_count = 0
        paging_div = soup.find("div", id="listContainer_itemcount")
        if paging_div:
            text = paging_div.get_text()
            match = re.search(r"of\s+(\d+)", text)
            if match:
                total_count = int(match.group(1))

        # Parse rows
        tbody = table.find("tbody")
        if not tbody:
            log.warning("No tbody found in catalog table")
            return records, total_count

        for row in tbody.find_all("tr", id=re.compile(r"listContainer_row:\d+")):
            try:
                record = self._parse_course_row(row, term_id, snapshot_id)
                if record:
                    records.append(record)
            except Exception as e:
                log.warning("Failed to parse row: %s", e)
                continue

        return records, total_count

    def _parse_course_row(self, row, term_id: str, snapshot_id: str) -> Optional[CourseRecord]:
        """Parse a single course row from the catalog table."""
        # First cell (th) = course code / identifier
        th = row.find("th")
        if not th:
            return None

        course_code = th.get_text(strip=True)
        # Some rows have a link with course_id
        source_id = course_code
        link = th.find("a", href=True)
        if link and "course_id=" in link["href"]:
            match = re.search(r"course_id=([^&]+)", link["href"])
            if match:
                source_id = match.group(1)

        # Remaining cells: Course Name, Instructor, Description
        tds = row.find_all("td")
        if len(tds) < 3:
            log.debug("Row has insufficient columns: %s", course_code)
            return None

        course_name = self._extract_cell_value(tds[0])
        instructors_text = self._extract_cell_value(tds[1])
        description = self._extract_cell_value(tds[2])

        # Parse instructors (comma-separated, sometimes with " , " spacing)
        instructors = [i.strip() for i in instructors_text.split(",") if i.strip()] if instructors_text else []

        return CourseRecord(
            source_id=source_id,
            course_code=course_code,
            course_name=course_name,
            instructors=instructors,
            description=description or None,
            term_id=term_id,
            snapshot_id=snapshot_id,
        )

    def _extract_cell_value(self, td) -> str:
        """Extract text from a catalog table cell, handling mobile labels."""
        # Remove mobile label spans
        for label in td.find_all("span", class_="mobile-table-label"):
            label.decompose()
        # Get the value span
        value_span = td.find("span", class_="table-data-cell-value")
        if value_span:
            return value_span.get_text(strip=True)
        # Fallback: all text
        return td.get_text(strip=True)

    async def extract_all(self, snapshot_id: str) -> ExtractionResult:
        """Extract all course records for the configured term.

        Uses showAll=true with max 1000 per request, paging through all results.
        """
        all_records: list[CourseRecord] = []
        errors: list[str] = []
        total_count = 0
        page_count = 0
        start_index = 0

        log.info("Starting catalog extraction for term %s", self.TERM_ID)

        while True:
            try:
                html = await self._fetch_page(start_index)
                records, page_total = self._parse_catalog_page(html, self.TERM_ID, snapshot_id)

                if page_count == 0:
                    total_count = page_total
                    log.info("Catalog reports %d total courses", total_count)

                if not records:
                    log.info("No more records at start_index=%d", start_index)
                    break

                all_records.extend(records)
                page_count += 1
                log.info("Page %d: extracted %d records (total so far: %d)", page_count, len(records), len(all_records))

                if len(records) < self.MAX_PER_PAGE:
                    break

                start_index += self.MAX_PER_PAGE
                # Be polite
                await asyncio.sleep(0.5)

            except Exception as e:
                error_msg = f"Failed at start_index={start_index}: {e}"
                log.error(error_msg)
                errors.append(error_msg)
                if len(errors) >= 3:
                    break
                await asyncio.sleep(2)

        log.info("Extraction complete: %d records, %d pages, %d errors", len(all_records), page_count, len(errors))
        return ExtractionResult(
            records=all_records,
            total_count=total_count,
            page_count=page_count,
            errors=errors,
            extracted_at=datetime.utcnow(),
        )


async def diagnose_source() -> dict:
    """Diagnostic function to verify source accessibility and structure."""
    async with BlackboardCatalogAdapter() as adapter:
        # Test single page fetch with search params (NotBlank returns all)
        params = {**adapter.SEARCH_PARAMS, "startIndex": "0"}
        resp = await adapter._client.get(adapter.BASE_URL, params=params)
        resp.raise_for_status()
        html = resp.text
        records, total = adapter._parse_catalog_page(html, settings.bb_term_id, "diagnostic")
        return {
            "accessible": True,
            "term_id": settings.bb_term_id,
            "sample_records": len(records),
            "reported_total": total,
            "first_record": records[0].model_dump() if records else None,
            "errors": [],
        }