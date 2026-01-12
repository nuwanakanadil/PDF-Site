/**
 * Utility functions for generating and downloading files
 * These create mock files for demo purposes
 */

/**
 * Triggers a browser download for a given blob
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a mock PDF file from an image
 */
export function generatePdfFromImage(imageFile: File, options: {
  pageSize: string;
  orientation: string;
  fitImage: boolean;
}): Blob {
  // Create a simple PDF-like text file for demo purposes
  const content = `%PDF-1.4
%Mock PDF generated from image
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Count 1
/Kids [3 0 R]
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

Mock PDF Content:
- Original Image: ${imageFile.name}
- Page Size: ${options.pageSize.toUpperCase()}
- Orientation: ${options.orientation}
- Fit to Page: ${options.fitImage ? 'Yes' : 'No'}
- Generated: ${new Date().toLocaleString()}

This is a demo file. In production, actual PDF generation would occur here.
`;
  return new Blob([content], {
    type: 'application/pdf'
  });
}

/**
 * Generate a mock merged PDF
 */
export function generateMergedPdf(files: File[]): Blob {
  const content = `%PDF-1.4
%Mock Merged PDF
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

Merged PDF Document
-------------------
Total Files Merged: ${files.length}
Generated: ${new Date().toLocaleString()}

Files included:
${files.map((f, i) => `${i + 1}. ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('\n')}

This is a demo file. In production, actual PDF merging would occur here.
`;
  return new Blob([content], {
    type: 'application/pdf'
  });
}

/**
 * Generate a mock compressed PDF
 */
export function generateCompressedPdf(file: File, compressionLevel: string): Blob {
  const originalSize = file.size;
  const ratios = {
    low: 0.9,
    medium: 0.7,
    high: 0.4
  };
  const ratio = ratios[compressionLevel as keyof typeof ratios] || 0.7;
  const compressedSize = Math.round(originalSize * ratio);
  const content = `%PDF-1.4
%Mock Compressed PDF
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

Compressed PDF Document
-----------------------
Original File: ${file.name}
Original Size: ${(originalSize / 1024 / 1024).toFixed(2)} MB
Compressed Size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB
Compression Level: ${compressionLevel}
Savings: ${Math.round((1 - ratio) * 100)}%
Generated: ${new Date().toLocaleString()}

This is a demo file. In production, actual PDF compression would occur here.
`;
  return new Blob([content], {
    type: 'application/pdf'
  });
}

/**
 * Generate a passport photo image
 */
export function generatePassportPhoto(imageFile: File, settings: {
  country: string;
  bgColor: string;
}): Blob {
  // For demo purposes, we'll return the original image
  // In production, this would process the image (crop, resize, change background)
  return imageFile;
}

/**
 * Generate a mock PowerPoint file
 */
export function generatePptxFile(pdfFile: File, options: {
  slideLayout: string;
  preserveFormatting: boolean;
  includeNotes: boolean;
}): Blob {
  const content = `PK (Mock PPTX File)

PowerPoint Presentation
-----------------------
Converted from: ${pdfFile.name}
Slide Layout: ${options.slideLayout}
Preserve Formatting: ${options.preserveFormatting ? 'Yes' : 'No'}
Include Notes: ${options.includeNotes ? 'Yes' : 'No'}
Generated: ${new Date().toLocaleString()}

This is a demo file. In production, actual PPTX generation would occur here.
The file would contain properly formatted slides with your PDF content.
`;
  return new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
}

/**
 * Generate a mock Word document
 */
export function generateDocxFile(pdfFile: File, options: {
  mode: string;
  includeImages: boolean;
  detectTables: boolean;
}): Blob {
  const content = `PK (Mock DOCX File)

Word Document
-------------
Converted from: ${pdfFile.name}
Conversion Mode: ${options.mode === 'layout' ? 'Preserve Layout' : 'Extract Text Only'}
Include Images: ${options.includeImages ? 'Yes' : 'No'}
Detect Tables: ${options.detectTables ? 'Yes' : 'No'}
Generated: ${new Date().toLocaleString()}

This is a demo file. In production, actual DOCX generation would occur here.
The file would contain properly formatted text with your PDF content.
`;
  return new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

/**
 * Generate a mock edited PDF
 */
export function generateEditedPdf(originalFile: File): Blob {
  const content = `%PDF-1.4
%Mock Edited PDF
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

Edited PDF Document
-------------------
Original File: ${originalFile.name}
Edited: ${new Date().toLocaleString()}

Changes applied:
- Text annotations added
- Images inserted
- Elements repositioned

This is a demo file. In production, actual PDF editing would occur here.
`;
  return new Blob([content], {
    type: 'application/pdf'
  });
}

/**
 * Get a clean filename without extension
 */
export function getFilenameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}