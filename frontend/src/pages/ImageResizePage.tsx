import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';

export function ImageResizePage() {

  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [status, setStatus] =
    useState<'idle' | 'processing'>('idle');

  const handleResize = async () => {
    if (!file) return;

    setStatus('processing');

    const form = new FormData();
    form.append('file', file);
    form.append('width', width.toString());
    form.append('height', height.toString());

    const res = await fetch('http://localhost:8080/api/resize-image', {
      method: 'POST',
      body: form
    });

    const blob = await res.blob();

    triggerDownload(
      blob,
      `${getFilenameWithoutExtension(file.name)}-resized.jpg`
    );

    setStatus('idle');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Resize Image
      </h1>

      {!file ? (
        <FileUpload accept="image/*" onFilesSelected={f => setFile(f[0])} />
      ) : (
        <div className="bg-white border p-6 rounded-xl space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={width}
              onChange={e => setWidth(+e.target.value)}
              className="border p-2 rounded" />
            <input type="number" value={height}
              onChange={e => setHeight(+e.target.value)}
              className="border p-2 rounded" />
          </div>

          <Button
            fullWidth
            onClick={handleResize}
            isLoading={status === 'processing'}
          >
            Resize Image
          </Button>

        </div>
      )}
    </div>
  );
}
