const fs = require('fs');
const mammoth = require('mammoth');

// Fix pdf-parse test file issue by setting environment variable
process.env.PDF_PARSE_TEST_FILE = 'none';
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.error('pdf-parse module not found, PDF parsing will be limited');
  pdfParse = null;
}

class FileParser {
  async parse(filePath, mimeType) {
    switch (mimeType) {
      case 'application/pdf':
        return this.parsePDF(filePath);

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return this.parseWord(filePath);

      case 'text/plain':
      case 'text/markdown':
      case 'text/x-markdown':
        return this.parseText(filePath);

      default:
        // Try to read as text
        try {
          return this.parseText(filePath);
        } catch (e) {
          throw new Error(`不支持的文件类型: ${mimeType}`);
        }
    }
  }

  async parsePDF(filePath) {
    try {
      if (!pdfParse) {
        throw new Error('PDF parser not available');
      }
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return {
        text: data.text || '',
        pageCount: data.numpages || 0,
        info: data.info || {}
      };
    } catch (error) {
      console.error('PDF parse error:', error.message);
      // Try to read as text as fallback
      try {
        const textContent = fs.readFileSync(filePath, 'utf-8');
        return {
          text: textContent,
          pageCount: 1,
          info: {},
          warning: 'PDF parsed as text, may contain binary data'
        };
      } catch {
        // Return empty content if parsing fails
        return {
          text: '',
          pageCount: 0,
          info: {},
          error: error.message
        };
      }
    }
  }

  async parseWord(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return {
      text: result.value,
      pageCount: null,
      info: {}
    };
  }

  async parseText(filePath) {
    const text = fs.readFileSync(filePath, 'utf-8');
    return {
      text,
      pageCount: null,
      info: {}
    };
  }
}

module.exports = new FileParser();
