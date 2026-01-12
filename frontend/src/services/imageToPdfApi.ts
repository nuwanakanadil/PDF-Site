export async function convertImageToPdf(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8080/api/image-to-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Image to PDF conversion failed");
  }

  return await response.blob();
}
