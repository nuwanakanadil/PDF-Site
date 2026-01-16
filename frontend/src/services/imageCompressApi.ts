export async function compressImage(
  file: File,
  quality: number
): Promise<Blob> {

  const formData = new FormData();
  formData.append('file', file);
  formData.append('quality', quality.toString());

  const response = await fetch(
    'http://localhost:8080/api/compress-image',
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error('Image compression failed');
  }

  return await response.blob();
}
