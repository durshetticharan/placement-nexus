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
    if not content:
        return ("", "empty")

    # 1. Try PyMuPDF (pymupdf / fitz)
    fitz_module = None
    try:
        import pymupdf as fitz_module
    except ImportError:
        try:
            import fitz as fitz_module
        except ImportError:
            fitz_module = None

    if fitz_module is not None:
        try:
            doc = fitz_module.open(stream=io.BytesIO(content), filetype="pdf")
            pages_text: list[str] = []
            for page in doc:
                pages_text.append(page.get_text())
            doc.close()
            full_text = "\n".join(pages_text).strip()
            if full_text:
                return (full_text, "ok")
        except Exception:
            pass

    # 2. Try pypdf fallback if installed
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        pages_text = [p.extract_text() or "" for p in reader.pages]
        full_text = "\n".join(pages_text).strip()
        if full_text:
            return (full_text, "ok")
    except Exception:
        pass

    # 3. Fallback: lightweight raw stream string extractor
    try:
        import re
        raw = content.decode("latin1", errors="ignore")
        text_pieces = re.findall(r"\(([^)]+)\)\s*Tj", raw)
        if not text_pieces:
            array_matches = re.findall(r"\[(.*?)\]\s*TJ", raw)
            for arr in array_matches:
                inner = re.findall(r"\(([^)]+)\)", arr)
                text_pieces.extend(inner)
        raw_extracted = " ".join(text_pieces).strip()
        if len(raw_extracted) >= 30:
            return (raw_extracted, "ok")
    except Exception:
        pass

    return ("", "image_only")


def truncate_text(text: str, max_chars: int = 20_000) -> str:
    """Truncate text to stay within token budget for the AI model."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n[... truncated for AI analysis ...]"
