import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { FileText, Download, RefreshCw, CheckCircle, FileType } from 'lucide-react';
import { convertPdfToDocx } from '../services/pdfToDocxApi';
import { triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';
export function PdfToDocPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [options, setOptions] = useState({
    mode: 'layout',
    includeImages: true,
    detectTables: true
  });
  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setStatus('idle');
  };
  const handleConvert = async () => {
    if (files.length === 0) return;

    try {
      setStatus('processing');

      const docxBlob = await convertPdfToDocx(files[0]);

      // store temporarily (same pattern as Image → PDF)
      (window as any).__DOCX_BLOB__ = docxBlob;

      setStatus('success');
    } catch (error) {
      console.error(error);
      alert("Conversion failed");
      setStatus('idle');
    }
  };
  const handleDownload = () => {
    const docxBlob = (window as any).__DOCX_BLOB__;
    if (!docxBlob || files.length === 0) return;

    const filename = `${getFilenameWithoutExtension(files[0].name)}.docx`;
    triggerDownload(docxBlob, filename);
  };
  const handleReset = () => {
    setFiles([]);
    setStatus('idle');
    delete (window as any).__DOCX_BLOB__;
  };
  return <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Convert PDF to Word Document
        </h1>
        <p className="text-gray-500">
          Convert your PDF to an editable Word document while preserving layout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {status === 'success' ? <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Conversion Complete!
              </h3>
              <p className="text-gray-600 mb-8">
                Your Word document is ready for download.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-lg" onClick={handleDownload}>
                  <Download className="w-5 h-5 mr-2" /> Download DOCX
                </Button>
                <Button variant="secondary" onClick={handleReset}>
                  Convert Another
                </Button>
              </div>
            </div> : <div className="bg-white rounded-xl shadow-sm">
              {files.length > 0 ? <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-red-100 p-3 rounded-lg mr-4">
                        <FileText className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {files[0].name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {(files[0].size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button onClick={handleReset} className="text-gray-400 hover:text-red-500">
                      Change File
                    </button>
                  </div>

                  <div className="aspect-[3/2] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-6 border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <FileType className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <span className="text-sm">Document Preview</span>
                    </div>
                  </div>

                  <Button fullWidth size="lg" onClick={handleConvert} isLoading={status === 'processing'}>
                    {status === 'processing' ? 'Converting...' : 'Convert to Word'}
                  </Button>
                </div> : <FileUpload accept=".pdf" onFilesSelected={handleFilesSelected} label="Supported format: PDF" />}
            </div>}
        </div>

        {/* Options Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" /> Options
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversion Mode
                </label>
                <div className="flex flex-col gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                  <button className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all text-left ${options.mode === 'layout' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setOptions({
                  ...options,
                  mode: 'layout'
                })} disabled={status !== 'idle'}>
                    Preserve Layout
                  </button>
                  <button className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all text-left ${options.mode === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setOptions({
                  ...options,
                  mode: 'text'
                })} disabled={status !== 'idle'}>
                    Extract Text Only
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input id="include-images" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" checked={options.includeImages} onChange={e => setOptions({
                  ...options,
                  includeImages: e.target.checked
                })} disabled={status !== 'idle'} />
                  <label htmlFor="include-images" className="ml-2 block text-sm text-gray-900">
                    Include images
                  </label>
                </div>

                <div className="flex items-center">
                  <input id="detect-tables" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" checked={options.detectTables} onChange={e => setOptions({
                  ...options,
                  detectTables: e.target.checked
                })} disabled={status !== 'idle'} />
                  <label htmlFor="detect-tables" className="ml-2 block text-sm text-gray-900">
                    Detect tables
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}