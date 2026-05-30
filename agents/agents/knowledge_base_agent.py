"""
KnowledgeBaseAgent — orchestrates AAO/policy/court scraping, embedding, and pattern extraction.
Runs weekly via Render cron (Sunday 2am UTC) or on-demand via POST /run-knowledge-base.
"""

import asyncio
import hashlib
import logging
import os
from datetime import datetime, timezone

from openai import OpenAI
from tools.db import get_db
from scrapers.aao_scraper import AAOScraper
from scrapers.policy_watcher import PolicyWatcher
from scrapers.court_scraper import CourtScraper
from extractors.pattern_extractor import PatternExtractor

log = logging.getLogger(__name__)

CHUNK_SIZE = 1800   # ~512 tokens at ~3.5 chars/token
CHUNK_OVERLAP = 200 # chars of overlap between consecutive chunks


class KnowledgeBaseAgent:
    def __init__(self):
        self._openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self._extractor = PatternExtractor()

    async def run(self, backfill: bool = False) -> None:
        """
        Main entry point.
        backfill=True  → scrape 2 years of data (initial ingest)
        backfill=False → scrape ~1 week (incremental weekly update)
        """
        years = 2 if backfill else 0.04  # ~2 weeks incremental window
        log.info(f"[KBAgent] Starting {'backfill' if backfill else 'incremental'} run (years={years})")

        scrapers = [AAOScraper(), PolicyWatcher(), CourtScraper()]
        for scraper in scrapers:
            source_name = scraper.__class__.__name__.lower().replace("scraper", "").replace("watcher", "_policy")
            await self._run_scraper(scraper, source_name, years)

        log.info("[KBAgent] Run complete")

    async def _run_scraper(self, scraper, source_name: str, years: float) -> None:
        db = get_db()
        run_row = db.table("scrape_runs").insert({
            "source": source_name,
            "status": "running",
        }).execute().data[0]
        run_id = run_row["id"]

        try:
            docs = await scraper.scrape(years_back=years)
            log.info(f"[KBAgent] {source_name}: {len(docs)} docs fetched")

            new_docs = self._dedup_and_store(db, docs)
            log.info(f"[KBAgent] {source_name}: {len(new_docs)} new docs stored")

            if new_docs:
                await self._embed_and_chunk(new_docs)
                for doc in new_docs:
                    await self._extractor.extract(doc)

            db.table("scrape_runs").update({
                "status": "done",
                "docs_found": len(docs),
                "docs_added": len(new_docs),
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", run_id).execute()

        except Exception as exc:
            log.exception(f"[KBAgent] {source_name} failed: {exc}")
            db.table("scrape_runs").update({
                "status": "failed",
                "error": str(exc)[:500],
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", run_id).execute()
        finally:
            await scraper.close()

    def _dedup_and_store(self, db, docs: list[dict]) -> list[dict]:
        """Insert only documents with new content_hash. Returns newly stored docs with their DB ids."""
        new_docs = []
        for doc in docs:
            h = doc.get("content_hash") or hashlib.sha256(doc["content"].encode()).hexdigest()
            doc["content_hash"] = h
            try:
                result = db.table("raw_documents").insert({
                    "source": doc["source"],
                    "source_url": doc.get("source_url"),
                    "title": doc.get("title"),
                    "content": doc["content"],
                    "content_hash": h,
                    "published_at": doc.get("published_at"),
                    "criteria": doc.get("criteria") or [],
                }).execute()
                if result.data:
                    doc["id"] = result.data[0]["id"]
                    new_docs.append(doc)
            except Exception as exc:
                # Unique constraint violation = already ingested
                if "unique" in str(exc).lower() or "duplicate" in str(exc).lower():
                    log.debug(f"[KBAgent] Skipping duplicate: {h[:12]}")
                else:
                    log.warning(f"[KBAgent] Insert failed: {exc}")
        return new_docs

    async def _embed_and_chunk(self, docs: list[dict]) -> None:
        """Split documents into chunks, embed each batch, and store in document_chunks."""
        db = get_db()

        all_chunks: list[dict] = []
        for doc in docs:
            content = doc["content"]
            # Sliding window chunking
            chunks = []
            start = 0
            while start < len(content):
                end = min(start + CHUNK_SIZE, len(content))
                chunks.append(content[start:end])
                start += CHUNK_SIZE - CHUNK_OVERLAP

            for idx, chunk_text in enumerate(chunks):
                all_chunks.append({
                    "document_id": doc["id"],
                    "chunk_index": idx,
                    "content": chunk_text,
                })

        if not all_chunks:
            return

        # Embed in batches of 100 (OpenAI limit is 2048 per request, we keep it manageable)
        batch_size = 100
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i : i + batch_size]
            texts = [c["content"] for c in batch]
            try:
                response = self._openai.embeddings.create(
                    model="text-embedding-3-small",
                    input=texts,
                )
                for chunk, emb_data in zip(batch, response.data):
                    chunk["embedding"] = emb_data.embedding

                db.table("document_chunks").insert(batch).execute()
                log.info(f"[KBAgent] Embedded and stored chunks {i}–{i+len(batch)}")
                await asyncio.sleep(0.1)  # brief pause between embedding batches
            except Exception as exc:
                log.warning(f"[KBAgent] Embedding batch {i} failed: {exc}")
