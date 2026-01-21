export async function generatePassportPhoto(
  file: File,
  country: string,
  bgColor: string
): Promise<Blob> {

  const formData = new FormData();
  formData.append("file", file);
  formData.append("country", country);
  formData.append("bgColor", bgColor);

  const res = await fetch(
    "http://localhost:8080/api/passport-photo",
    {
      method: "POST",
      body: formData
    }
  );

  if (!res.ok) {
    throw new Error("Passport photo generation failed");
  }

  return await res.blob();
}
