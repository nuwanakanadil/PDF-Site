import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';

export function ImageConvertPage() {

  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('jpg');

  const handleConvert = async () => {
    if (!file) return;

    const form = new FormData();
    form.append('file', file);
    form.append('format', format);

    const res = await fetch('http://localhost:8080/api/convert-image', {
      method: 'POST',
      body: form
    });

    const blob = await res.blob();

    triggerDownload(
      blob,
      `${getFilenameWithoutExtension(file.name)}.${format}`
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Convert Image
      </h1>

      {!file ? (
        <FileUpload accept="image/*" onFilesSelected={f => setFile(f[0])} />
      ) : (
        <div className="bg-white border p-6 rounded-xl space-y-4">
          <select
            value={format}
            onChange={e => setFormat(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>

          <Button fullWidth onClick={handleConvert}>
            Convert Image
          </Button>
        </div>
      )}
    </div>
  );
}
