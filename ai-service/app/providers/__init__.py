"""
AI Provider abstraction layer.

Supported providers:
  - mock    — deterministic, no external calls (used in tests / when AI_PROVIDER=mock)
  - gemini  — Google Gemini (requires AI_GEMINI_API_KEY)

Set AI_PROVIDER environment variable to choose the provider.
The AI service NEVER exposes provider keys to callers.
"""
from __future__ import annotations

import json
import os
import re
from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    """Interface every provider must implement."""

    @abstractmethod
    async def generate(self, system_prompt: str, user_content: str, max_tokens: int = 1024) -> str:
        """Return the model's text response."""
        ...


# ── Mock Provider ─────────────────────────────────────────────────────────────

class MockProvider(AIProvider):
    """Deterministic mock — no network calls, zero cost, used for tests."""

    async def generate(self, system_prompt: str, user_content: str, max_tokens: int = 1024) -> str:
        # Return a static JSON that every schema can parse.
        return json.dumps({
            "summary": "Mock AI response — no live provider configured.",
            "strengths": ["Mock strength A", "Mock strength B"],
            "improvements": ["Mock improvement A"],
            "extractedSkills": ["Python", "Communication"],
            "missingSections": [],
            "atsScore": 72,
            "recommendations": ["Mock recommendation 1", "Mock recommendation 2"],
            "questions": [
                {"id": 1, "question": "Mock question 1?", "topic": "General", "difficulty": "Medium"},
                {"id": 2, "question": "Mock question 2?", "topic": "Technical", "difficulty": "Hard"},
                {"id": 3, "question": "Mock question 3?", "topic": "Behavioral", "difficulty": "Easy"},
            ],
            "evaluation": {
                "relevance": 7,
                "clarity": 7,
                "technicalDepth": 7,
                "completeness": 7,
                "overall": 7,
                "feedback": "This is a mock evaluation. Configure a live provider for real feedback.",
            },
            "priorities": ["Mock priority 1", "Mock priority 2"],
            "suggestedResources": [],
            "confidence": "LOW — mock provider active",
            "isAiGenerated": True,
            "model": "mock-v1",
            "promptVersion": "1.0",
        })


# ── Gemini Provider ───────────────────────────────────────────────────────────

class GeminiProvider(AIProvider):
    """Google Gemini provider via REST API."""

    def __init__(self) -> None:
        self._api_key = os.environ.get("AI_GEMINI_API_KEY", "")
        self._model = os.environ.get("AI_GEMINI_MODEL", "gemini-1.5-flash")
        if not self._api_key:
            raise RuntimeError("AI_GEMINI_API_KEY is not set in environment.")

    async def generate(self, system_prompt: str, user_content: str, max_tokens: int = 1024) -> str:
        import asyncio as _asyncio
        import httpx  # lazy import so mock provider doesn't depend on it
        import logging as _logging
        _logger = _logging.getLogger("app.providers.gemini")

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self._model}:generateContent?key={self._api_key}"
        )
        # NOTE: responseMimeType removed — thinking models (gemini-3.x-flash)
        # count thinking tokens against maxOutputTokens, leaving empty content.
        # JSON output is enforced via system_prompt instead.
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_content}]}],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.3,
            },
        }
        timeout = float(os.environ.get("AI_TIMEOUT_SECONDS", "45"))
        max_retries = 3
        last_error: Exception | None = None

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = client.post(url, json=payload)  # type: ignore[assignment]
                    resp = await resp  # type: ignore[assignment]

                # Check HTTP status manually to extract safe error info
                if resp.status_code in (429, 503):
                    try:
                        err_body = resp.json()
                        err_msg = err_body.get("error", {}).get("message", "Unknown")
                    except Exception:
                        err_msg = "Service unavailable"

                    # Fail fast if this is a confirmed hard quota exhaustion
                    if resp.status_code == 429 and ("Quota exceeded" in err_msg or "limit:" in err_msg or "free_tier_requests" in err_msg):
                        _logger.error("Gemini API Quota Exhausted: %s", err_msg)
                        raise ValueError("AI Provider Error: Gemini service overloaded.")

                    _logger.warning(
                        "Gemini API returned %d (attempt %d/%d): %s",
                        resp.status_code, attempt + 1, max_retries, err_msg,
                    )
                    if attempt < max_retries - 1:
                        retry_after = resp.headers.get("Retry-After")
                        if retry_after and retry_after.isdigit():
                            delay = int(retry_after)
                            # Cap wait time to avoid hanging connections
                            if delay > 15:
                                _logger.error("Retry-After too long (%ds). Failing fast.", delay)
                                raise ValueError("AI Provider Error: Gemini service overloaded.")
                        else:
                            delay = 2 ** attempt  # 1s, 2s, 4s
                            
                        await _asyncio.sleep(delay)
                        continue
                    raise ValueError("AI Provider Error: Gemini service overloaded after retries.")

                if resp.status_code != 200:
                    try:
                        err_body = resp.json()
                        err_msg = err_body.get("error", {}).get("message", "Unknown")
                    except Exception:
                        err_msg = "Non-JSON error response"
                    _logger.error(
                        "Gemini API returned HTTP %d: %s", resp.status_code, err_msg
                    )
                    raise ValueError(
                        f"AI Provider Error: Gemini returned HTTP {resp.status_code}."
                    )

                data = resp.json()
                # Validate that the response actually contains content
                candidates = data.get("candidates", [])
                if not candidates:
                    _logger.error("Gemini returned no candidates")
                    raise ValueError("AI Provider Error: No response generated.")
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if not parts or "text" not in parts[0]:
                    finish_reason = candidates[0].get("finishReason", "UNKNOWN")
                    _logger.error("Gemini returned empty content, finishReason=%s", finish_reason)
                    raise ValueError("AI Provider Error: Model returned empty response.")
                return parts[0]["text"]

            except ValueError:
                raise  # re-raise our own sanitized errors
            except Exception as e:
                last_error = e
                _logger.error("Gemini provider error: %s: %s", type(e).__name__, e)
                if attempt < max_retries - 1:
                    await _asyncio.sleep(2 ** attempt)
                    continue
                raise ValueError("AI Provider Error: Service temporarily unavailable.") from e

        raise ValueError("AI Provider Error: Service temporarily unavailable.")


# ── Factory ───────────────────────────────────────────────────────────────────

def get_provider() -> AIProvider:
    """Return the configured provider instance. Defaults to mock."""
    provider_name = os.environ.get("AI_PROVIDER", "mock").lower()
    if provider_name == "gemini":
        return GeminiProvider()
    # Default / explicit "mock"
    return MockProvider()
