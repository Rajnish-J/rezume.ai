function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ");
}

function normalizeLine(line: string): string {
  return line
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\t/g, "  ")
    .trimEnd();
}

function wrapLine(line: string, maxChars: number): string[] {
  const normalized = normalizeLine(line);

  if (!normalized) {
    return [""];
  }

  const words = normalized.split(/\s+/);
  const wrapped: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if ((current + " " + word).length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      wrapped.push(current);
      current = word;
    }
  }

  if (current) {
    wrapped.push(current);
  }

  return wrapped;
}

export function createSimpleResumePdfFromText(text: string): Uint8Array {
  const pageWidth = 612;
  const pageHeight = 792;
  const marginLeft = 48;
  const topY = 744;
  const bottomY = 56;
  const lineHeight = 14;
  const linesPerPage = Math.floor((topY - bottomY) / lineHeight);
  const maxCharsPerLine = 92;

  const logicalLines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .flatMap((line) => wrapLine(line, maxCharsPerLine));

  const pageChunks: string[][] = [];
  for (let i = 0; i < logicalLines.length; i += linesPerPage) {
    pageChunks.push(logicalLines.slice(i, i + linesPerPage));
  }

  if (pageChunks.length === 0) {
    pageChunks.push(["Updated resume"]);
  }

  const objects: string[] = [];

  // 1: catalog
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  // 2: pages tree placeholder; updated after page object ids are known.
  objects.push("");

  // 3: font
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pageObjectIds: number[] = [];

  for (const lines of pageChunks) {
    const pageObjId = objects.length + 1;
    const contentObjId = objects.length + 2;
    pageObjectIds.push(pageObjId);

    const contentRows: string[] = ["BT", "/F1 11 Tf", `${marginLeft} ${topY} Td`];

    lines.forEach((line, index) => {
      if (index === 0) {
        contentRows.push(`(${escapePdfText(line)}) Tj`);
      } else {
        contentRows.push(`0 -${lineHeight} Td (${escapePdfText(line)}) Tj`);
      }
    });

    contentRows.push("ET");
    const contentStream = contentRows.join("\n");

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjId} 0 R >>`,
    );
    objects.push(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((objectBody, idx) => {
    const objectId = idx + 1;
    offsets.push(pdf.length);
    pdf += `${objectId} 0 obj\n${objectBody}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
