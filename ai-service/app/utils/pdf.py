"""
PDF / document text extraction utilities.
Uses PyMuPDF (fitz) when available; falls back gracefully if not installed.
Treats all extracted text as untrusted DATA — never executed.
"""
from __future__ import annotations

import io
from typing import Optional


def extract_text_from_pdf(content: bytes) -> tuple[str, str]:
    """
    Extract plain text from a PDF byte stream.

    Returns (extracted_text, status) where status is:
      "ok"             — text extracted successfully
      "image_only"     — PDF appears to have no embedded text layer
      "empty"          — zero-length or unreadable PDF
      "error"          — extraction failed (detail in text)
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return ("PyMuPDF not installed — text extraction unavailable.", "error")

    if not content:
        return ("", "empty")

    try:
        doc = fitz.open(stream=io.BytesIO(content), filetype="pdf")
        pages_text: list[str] = []
        for page in doc:
            pages_text.append(page.get_text())
        doc.close()
        full_text = "\n".join(pages_text).strip()
        if not full_text:
            return ("", "image_only")
        return (full_text, "ok")
    except Exception as exc:
        return (f"PDF extraction error: {exc}", "error")


def truncate_text(text: str, max_chars: int = 20_000) -> str:
    """Truncate text to stay within token budget for the AI model."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n[... truncated for AI analysis ...]"
