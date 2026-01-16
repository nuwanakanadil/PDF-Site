import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';

export function PdfPageManagerPage() {

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'keep' | 'remove'>('keep');
  const [pages, setPages] = useState('');

  const handleApply = async () => {
    if (!file || !pages) return;

    const form = new FormData();
    form.append('file', file);
    form.append('mode', mode);
    form.append('pages', pages);

    const res = await fetch('http://localhost:8080/api/pdf-pages', {
      method: 'POST',
      body: form
    });

    const blob = await res.blob();

    triggerDownload(
      blob,
      `${getFilenameWithoutExtension(file.name)}-pages.pdf`
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        PDF Page Manager
      </h1>

      {!file ? (
        <FileUpload accept=".pdf" onFilesSelected={f => setFile(f[0])} />
      ) : (
        <div className="bg-white border p-6 rounded-xl space-y-6">

          <div className="flex gap-4">
            <button
              onClick={() => setMode('keep')}
              className={`flex-1 border p-3 rounded
                ${mode === 'keep' ? 'bg-blue-50 border-blue-500' : ''}`}
            >
              Split / Extract
            </button>

            <button
              onClick={() => setMode('remove')}
              className={`flex-1 border p-3 rounded
                ${mode === 'remove' ? 'bg-red-50 border-red-500' : ''}`}
            >
              Remove Pages
            </button>
          </div>

          <input
            type="text"
            placeholder="Example: 1,3,5-7"
            value={pages}
            onChange={e => setPages(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <Button fullWidth onClick={handleApply}>
            Apply Changes
          </Button>

        </div>
      )}
    </div>
  );
}
