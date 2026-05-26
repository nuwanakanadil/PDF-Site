export interface PdfToPptOptions {
  slideLayout: string;
  preserveFormatting: boolean;
  includeNotes: boolean;
}

export async function convertPdfToPptx(
  file: File,
  options: PdfToPptOptions
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("slideLayout", options.slideLayout);
  formData.append("preserveFormatting", String(options.preserveFormatting));
  formData.append("includeNotes", String(options.includeNotes));

  const response = await fetch("http://localhost:8080/api/pdf-to-pptx", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "PDF to PPTX conversion failed");
  }

  return await response.blob();
}
