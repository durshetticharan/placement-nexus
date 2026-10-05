/**
 * pdfExtractor.ts
 *
 * Robust in-process PDF text extraction for Placement Nexus.
 * Extracts text directly from PDF buffer in Node.js, eliminating external
 * failure points when extracting resume text for ATS scoring.
 */

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
}

/**
 * Extract text from a PDF buffer.
 * Supports both pdf-parse v1 and v2 APIs with text normalization.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  if (!buffer || buffer.length === 0) {
    return { text: '', pageCount: 0, success: false, error: 'Empty file buffer.' };
  }

  // Check PDF magic header '%PDF-'
  const header = buffer.subarray(0, 8).toString('utf-8');
  if (!header.includes('%PDF-')) {
    return { text: '', pageCount: 0, success: false, error: 'Invalid PDF format.' };
  }

  try {
    // Dynamically load pdf-parse
    const pdfParseModule = require('pdf-parse');
    
    // Check if pdf-parse v2 class PDFParse exists
    if (pdfParseModule && pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      if (typeof parser.getText === 'function') {
        const result = await parser.getText();
        const rawText = typeof result === 'string' ? result : (result?.text || '');
        const cleanText = cleanExtractedText(rawText);
        const pageCount = result?.total || result?.pages?.length || 1;
        
        if (cleanText.trim().length > 0) {
          return { text: cleanText, pageCount, success: true };
        }
      }
    }

    // Check if pdf-parse function exists (v1 style or default export)
    const parseFn = typeof pdfParseModule === 'function' 
      ? pdfParseModule 
      : (pdfParseModule?.default && typeof pdfParseModule.default === 'function' ? pdfParseModule.default : null);

    if (parseFn) {
      const data = await parseFn(buffer);
      const cleanText = cleanExtractedText(data.text || '');
      if (cleanText.trim().length > 0) {
        return { text: cleanText, pageCount: data.numpages || 1, success: true };
      }
    }

    // Fallback: extract plain ASCII / unicode strings from text objects in PDF streams
    const streamText = extractPlainTextFromRawPdf(buffer);
    if (streamText.trim().length >= 30) {
      return { text: streamText, pageCount: 1, success: true };
    }

    return {
      text: '',
      pageCount: 0,
      success: false,
      error: 'Unable to extract readable text from this PDF. Please upload a text-based resume (not a scanned image).',
    };
  } catch (err: any) {
    // Attempt raw text fallback in case pdf-parse throws on unusual fonts/compressions
    const fallbackText = extractPlainTextFromRawPdf(buffer);
    if (fallbackText.trim().length >= 30) {
      return { text: fallbackText, pageCount: 1, success: true };
    }

    return {
      text: '',
      pageCount: 0,
      success: false,
      error: err?.message || 'Failed to parse PDF document.',
    };
  }
}

/**
 * Clean and normalize extracted text (remove page markers, clean spaces/newlines).
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '') // remove page markers like "-- 1 of 1 --"
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Lightweight fallback extractor that pulls text from standard PDF streams (BT...ET / Tj / TJ blocks).
 */
function extractPlainTextFromRawPdf(buffer: Buffer): string {
  try {
    const raw = buffer.toString('binary');
    const textPieces: string[] = [];

    // Match (string) Tj or [(str1)(str2)] TJ patterns
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(raw)) !== null) {
      textPieces.push(match[1]);
    }

    if (textPieces.length === 0) {
      const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
      while ((match = arrayTjRegex.exec(raw)) !== null) {
        const inner = match[1];
        const innerStrings = inner.match(/\(([^)]+)\)/g);
        if (innerStrings) {
          textPieces.push(innerStrings.map(s => s.slice(1, -1)).join(' '));
        }
      }
    }

    return textPieces.join(' ').replace(/\\([()\\])/g, '$1').trim();
  } catch {
    return '';
  }
}
