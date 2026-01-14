export async function mergePdfs(files: File[]): Promise<Blob> {
  const formData = new FormData();

  files.forEach(file => {
    formData.append("files", file);
  });

  const response = await fetch(
    "http://localhost:8080/api/merge-pdf",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("PDF merge failed");
  }

  return await response.blob();
}
