export async function convertPdfToDocx(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8080/api/pdf-to-docx", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("PDF to DOCX conversion failed");
  }

  return await response.blob();
}
