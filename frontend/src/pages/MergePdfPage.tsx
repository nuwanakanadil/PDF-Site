import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { FileText, Download, Trash2, GripVertical, Plus } from 'lucide-react';
import { mergePdfs } from '../services/mergePdfApi';
import { triggerDownload } from '../utils/downloadHelpers';

export function MergePdfPage() {

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] =
    useState<'idle' | 'processing' | 'success'>('idle');

  const handleFilesSelected = (newFiles: File[]) => {
    const combined = [...files, ...newFiles].slice(0, 15);
    setFiles(combined);
    setStatus('idle');
  };

  const removeFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === files.length - 1)
    ) return;

    const updated = [...files];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    [updated[index], updated[swapIndex]] =
      [updated[swapIndex], updated[index]];

    setFiles(updated);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    try {
      setStatus('processing');
      const mergedBlob = await mergePdfs(files);
      (window as any).__MERGED_PDF__ = mergedBlob;
      setStatus('success');
    } catch {
      alert("Merge failed");
      setStatus('idle');
    }
  };

  const handleDownload = () => {
    const blob = (window as any).__MERGED_PDF__;
    if (!blob) return;

    triggerDownload(blob, `merged-pdf-${Date.now()}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto">

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Merge PDF Files
        </h1>
        <p className="text-gray-500">
          Combine multiple PDFs into one unified document.
        </p>
      </div>

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Merge Complete!</h2>

          <Button size="lg" onClick={handleDownload}>
            <Download className="w-5 h-5 mr-2" />
            Download Merged PDF
          </Button>
        </div>
      ) : (
        <>
          {files.length === 0 && (
            <FileUpload
              accept=".pdf"
              multiple
              onFilesSelected={handleFilesSelected}
              label="Drag & drop PDFs here"
            />
          )}

          {files.length > 0 && (
            <ul className="bg-white border rounded-xl divide-y">
              {files.map((file, index) => (
                <li key={index} className="p-4 flex items-center">
                  <GripVertical className="w-5 h-5 text-gray-400 mr-3" />
                  <FileText className="w-5 h-5 text-red-600 mr-3" />
                  <span className="flex-grow truncate">{file.name}</span>

                  <button onClick={() => moveFile(index, 'up')}>↑</button>
                  <button onClick={() => moveFile(index, 'down')}>↓</button>
                  <button onClick={() => removeFile(index)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 text-center">
            <Button
              size="lg"
              disabled={files.length < 2}
              onClick={handleMerge}
              isLoading={status === 'processing'}
            >
              {status === 'processing'
                ? 'Merging PDFs...'
                : `Merge ${files.length} PDFs`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
