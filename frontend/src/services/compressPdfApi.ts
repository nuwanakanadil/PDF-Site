export async function compressPdf(
  file: File,
  level: 'low' | 'medium' | 'high'
): Promise<Blob> {

  const formData = new FormData();
  formData.append("file", file);
  formData.append("level", level);

  const response = await fetch(
    "http://localhost:8080/api/compress-pdf",
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error("PDF compression failed");
  }

  return await response.blob();
}
