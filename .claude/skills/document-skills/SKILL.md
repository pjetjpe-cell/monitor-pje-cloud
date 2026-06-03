---
name: document-skills
description: Create, read, edit, and process real document files including PDF, DOCX, XLSX, PPTX, and CSV. Use when working with office documents, generating reports, or extracting structured data from files.
trigger: explicit
---

# Document Skills

Source: github.com/anthropics/skills (Official Anthropic skill)

Direct access to real document formats. Parse, generate, and transform PDFs, Word documents, Excel spreadsheets, PowerPoint presentations, and CSVs.

## Supported Formats

| Format | Read | Write | Notes |
|--------|------|-------|-------|
| PDF    | ✅   | ✅    | Text extraction, form reading, generation |
| DOCX   | ✅   | ✅    | Full Word document support |
| XLSX   | ✅   | ✅    | Multi-sheet, formulas, formatting |
| PPTX   | ✅   | ✅    | Slides, layouts, speaker notes |
| CSV    | ✅   | ✅    | Parsing, cleaning, validation |

## PDF Operations

```bash
# Install dependencies
npm install pdf-parse pdfkit
```

```typescript
// Read PDF
import pdfParse from 'pdf-parse';
import { readFileSync } from 'fs';

const buffer = readFileSync('document.pdf');
const { text, numpages, info } = await pdfParse(buffer);

// Generate PDF
import PDFDocument from 'pdfkit';
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('output.pdf'));
doc.fontSize(25).text('Relatório PJe', 100, 100);
doc.end();
```

## DOCX Operations

```bash
npm install docx mammoth
```

```typescript
// Read DOCX
import mammoth from 'mammoth';
const { value: html } = await mammoth.convertToHtml({ path: 'doc.docx' });

// Write DOCX
import { Document, Paragraph, TextRun, Packer } from 'docx';

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        children: [new TextRun({ text: 'Relatório', bold: true, size: 28 })],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('output.docx', buffer);
```

## XLSX Operations

```bash
npm install xlsx
```

```typescript
import * as XLSX from 'xlsx';

// Read Excel
const workbook = XLSX.readFile('data.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Write Excel
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Processos');
XLSX.writeFile(wb, 'output.xlsx');
```

## CSV Processing

```typescript
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// Parse CSV
const records = parse(fs.readFileSync('processos.csv'), {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

// Validate and clean
const cleaned = records
  .filter(r => r.numero_processo && r.status)
  .map(r => ({
    ...r,
    data_entrada: new Date(r.data_entrada).toISOString(),
  }));

// Write back
const output = stringify(cleaned, { header: true });
fs.writeFileSync('processos-limpos.csv', output);
```

## Report Generation Pattern

For automated report generation (useful for monitor-pje-cloud):

```typescript
async function generateReport(data: ProcessoData[]) {
  const doc = new PDFDocument({ margin: 50 });
  
  // Header
  doc.fontSize(20).text('Monitor PJe Cloud — Relatório', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  doc.moveDown(2);
  
  // Table of processes
  data.forEach((processo, i) => {
    doc.text(`${i + 1}. ${processo.numero} — ${processo.status}`);
    doc.moveDown(0.5);
  });
  
  return doc;
}
```

## Processing Checklist

- [ ] Validate file exists before reading
- [ ] Handle encoding (UTF-8, Latin-1 for older Brazilian docs)
- [ ] Strip BOM from CSV if present
- [ ] Handle empty cells/null values
- [ ] Validate required columns before processing
- [ ] Generate output to temp path, then rename on success
