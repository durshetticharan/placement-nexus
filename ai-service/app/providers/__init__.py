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
        import httpx  # lazy import so mock provider doesn't depend on it

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self._model}:generateContent?key={self._api_key}"
        )
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_content}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "maxOutputTokens": max_tokens,
                "temperature": 0.3,
            },
        }
        timeout = float(os.environ.get("AI_TIMEOUT_SECONDS", "45"))
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = client.post(url, json=payload)  # type: ignore[assignment]
            resp = await resp  # type: ignore[assignment]
            resp.raise_for_status()
            data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


# ── Factory ───────────────────────────────────────────────────────────────────

def get_provider() -> AIProvider:
    """Return the configured provider instance. Defaults to mock."""
    provider_name = os.environ.get("AI_PROVIDER", "mock").lower()
    if provider_name == "gemini":
        return GeminiProvider()
    # Default / explicit "mock"
    return MockProvider()
