export interface AnalyzedContentBlock {
  id: string;
  type: string;
  text: string;
  order: number;
}

export interface AnalyzedPage {
  pageNumber: number;
  title: string;
  text: string;
  blocks: AnalyzedContentBlock[];
}

export interface DocumentAnalysis {
  source: string;
  engine: string;
  format: string;
  text: string;
  pages: AnalyzedPage[];
}

export async function analyzePdf(file: File): Promise<DocumentAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8080/api/pdf-analysis", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "PDF analysis failed");
  }

  return await response.json();
}
