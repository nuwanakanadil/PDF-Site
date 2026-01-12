import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { FileText, Download, Trash2, GripVertical, Plus } from 'lucide-react';
import { generateMergedPdf, triggerDownload } from '../utils/downloadHelpers';
export function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const handleFilesSelected = (newFiles: File[]) => {
    setFiles([...files, ...newFiles]);
    setStatus('idle');
  };
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0 || direction === 'down' && index === files.length - 1) return;
    const newFiles = [...files];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFiles[index];
    newFiles[index] = newFiles[swapIndex];
    newFiles[swapIndex] = temp;
    setFiles(newFiles);
  };
  const handleMerge = () => {
    if (files.length < 2) return;
    setStatus('processing');
    setTimeout(() => setStatus('success'), 2000);
  };
  const handleDownload = () => {
    if (files.length === 0) return;
    const mergedPdf = generateMergedPdf(files);
    const filename = `merged-pdf-${Date.now()}.pdf`;
    triggerDownload(mergedPdf, filename);
  };
  return <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Merge PDF Files
        </h1>
        <p className="text-gray-500">
          Combine multiple PDFs into one unified document.
        </p>
      </div>

      {status === 'success' ? <div className="bg-green-50 border border-green-200 rounded-xl p-12 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            PDFs Merged Successfully!
          </h2>
          <p className="text-gray-600 mb-8">
            Your merged document contains {files.length} files.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="shadow-lg" onClick={handleDownload}>
              <Download className="w-5 h-5 mr-2" /> Download Merged PDF
            </Button>
            <Button variant="secondary" onClick={() => {
          setFiles([]);
          setStatus('idle');
        }}>
              Merge More
            </Button>
          </div>
        </div> : <div className="space-y-8">
          {files.length > 0 && <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="font-medium text-gray-700">
                  {files.length} files selected
                </span>
                <button onClick={() => setFiles([])} className="text-sm text-red-600 hover:text-red-700 font-medium">
                  Clear All
                </button>
              </div>
              <ul className="divide-y divide-gray-100">
                {files.map((file, index) => <li key={`${file.name}-${index}`} className="p-4 flex items-center hover:bg-gray-50 transition-colors group">
                    <div className="mr-4 text-gray-400 cursor-move">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="bg-red-100 p-2 rounded-lg mr-4">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveFile(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                        ↑
                      </button>
                      <button onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                        ↓
                      </button>
                      <button onClick={() => removeFile(index)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>)}
              </ul>
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center">
                {/* Hidden input trick for "Add more" could go here, but for simplicity we just rely on the main dropzone or a button that triggers a hidden input */}
                <label className="cursor-pointer flex items-center text-blue-600 font-medium hover:text-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Add more files
                  <input type="file" multiple accept=".pdf" className="hidden" onChange={e => e.target.files && handleFilesSelected(Array.from(e.target.files))} />
                </label>
              </div>
            </div>}

          {files.length === 0 && <FileUpload accept=".pdf" multiple onFilesSelected={handleFilesSelected} label="Drag & drop PDFs here to merge" />}

          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={handleMerge} disabled={files.length < 2} isLoading={status === 'processing'} className="w-full md:w-auto min-w-[200px]">
              {status === 'processing' ? 'Merging PDFs...' : `Merge ${files.length} PDF${files.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>}
    </div>;
}