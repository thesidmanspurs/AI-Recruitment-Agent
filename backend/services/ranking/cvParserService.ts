import mammoth from 'mammoth';

export interface ParsedCVText {
  text: string;
  fileType: 'pdf' | 'docx' | 'unknown';
}

/**
 * CV Parser — extracts raw text from PDF and DOCX buffers.
 *
 * Security guarantees:
 *   - Works entirely in-memory (buffer in, text out).
 *   - The caller is responsible for nullifying the buffer after calling
 *     this function — typically by letting the multer MemoryStorage
 *     garbage-collect naturally at end-of-request scope.
 *   - This service NEVER writes to disk.
 *   - The extracted text itself is also transient: it is passed directly to
 *     Gemini for structured extraction and is NOT persisted to the database.
 */
export const cvParserService = {
  /**
   * Detect MIME type from the original filename extension.
   * multer does not reliably populate mimetype for arbitrary uploads,
   * so we fall back to the file extension as a second signal.
   */
  detectType(filename: string, mimeType?: string): 'pdf' | 'docx' | 'unknown' {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
    if (
      ext === 'docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return 'docx';
    if (ext === 'doc' || mimeType === 'application/msword') return 'docx'; // mammoth handles both
    return 'unknown';
  },

  /**
   * Extract plain text from a PDF buffer.
   * Supports both pdf-parse function exports (v1) and PDFParse class exports (v2).
   */
  async extractFromPDF(buffer: Buffer): Promise<string> {
    const mod = await import('pdf-parse');
    const pdfLib = (mod as any).default ?? mod;

    if (typeof pdfLib === 'function') {
      const data = await pdfLib(buffer);
      return (data.text ?? '').trim();
    }

    if (pdfLib && typeof pdfLib.PDFParse === 'function') {
      const parser = new pdfLib.PDFParse({ data: buffer });
      const res = await parser.getText();
      return (res.text ?? '').trim();
    }

    throw new Error('Unsupported pdf-parse module exports structure');
  },

  /**
   * Extract plain text from a DOCX (or DOC) buffer using mammoth.
   * mammoth.extractRawText strips formatting and returns clean prose.
   */
  async extractFromDOCX(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    if (result.messages.length > 0) {
      // Log non-fatal warnings (e.g. unsupported elements) without throwing.
      const warnings = result.messages.filter(m => m.type === 'warning');
      if (warnings.length > 0) {
        console.warn(
          '[CVParser] mammoth warnings:',
          warnings.map(w => w.message).join('; '),
        );
      }
    }
    return (result.value ?? '').trim();
  },

  /**
   * Main entry point — parses a single file buffer into plain text.
   * Throws Error with clean user-facing message on parse failure.
   */
  async parse(
    buffer: Buffer,
    filename: string,
    mimeType?: string,
  ): Promise<ParsedCVText> {
    return this.parseBuffer(buffer, filename, mimeType);
  },

  async parseBuffer(
    buffer: Buffer,
    filename: string,
    mimeType?: string,
  ): Promise<ParsedCVText> {
    if (!buffer || buffer.length === 0) {
      throw new Error(`File "${filename}" is empty.`);
    }

    const type = this.detectType(filename, mimeType);
    let text = '';

    if (type === 'pdf') {
      try {
        text = await this.extractFromPDF(buffer);
      } catch (err) {
        throw new Error(
          `Failed to extract text from "${filename}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } else if (type === 'docx') {
      try {
        text = await this.extractFromDOCX(buffer);
      } catch (err) {
        throw new Error(
          `Failed to extract text from "${filename}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } else {
      throw new Error(
        `Unsupported file type for "${filename}". Please upload a PDF or DOCX file.`,
      );
    }

    if (!text || text.length < 30) {
      throw new Error(
        `Could not extract readable text from "${filename}". File may be image-only, scanned without OCR, or password-protected.`,
      );
    }

    return { text, fileType: type };
  },
};
