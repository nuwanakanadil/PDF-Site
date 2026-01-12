import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { FileImage, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { convertImageToPdf } from '../services/imageToPdfApi';
import { triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';
export function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [options, setOptions] = useState({
    pageSize: 'a4',
    orientation: 'portrait',
    fitImage: true
  });
  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setStatus('idle');
  };
  const handleConvert = async () => {
    if (files.length === 0) return;
    try {
      setStatus('processing');
      // Call backend (no UI change)
      const pdfBlob = await convertImageToPdf(files[0]);
      // Store blob temporarily on window for download
      (window as any).__PDF_BLOB__ = pdfBlob;
      setStatus('success');
    } catch (error) {
      console.error(error);
      alert("Conversion failed");
      setStatus('idle');
    }
  };
  const handleDownload = () => {
    const pdfBlob = (window as any).__PDF_BLOB__;
    if (!pdfBlob || files.length === 0) return;
    const filename = `${getFilenameWithoutExtension(files[0].name)}.pdf`;
    triggerDownload(pdfBlob, filename);
  };
  const handleReset = () => {
    setFiles([]);
    setStatus('idle');
    delete (window as any).__PDF_BLOB__;
  };
  return <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Convert Image to PDF
        </h1>
        <p className="text-gray-500">
          Transform your images into professional PDF documents in seconds.
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
                Your PDF is ready for download.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="shadow-lg" onClick={handleDownload}>
                  <Download className="w-5 h-5 mr-2" /> Download PDF
                </Button>
                <Button variant="secondary" onClick={handleReset}>
                  Convert Another
                </Button>
              </div>
            </div> : <div className="bg-white rounded-xl shadow-sm">
              {files.length > 0 ? <div className="p-6 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-3 rounded-lg mr-4">
                        <FileImage className="w-6 h-6 text-blue-600" />
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

                  {/* Preview placeholder */}
                  <div className="aspect-[3/2] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-6">
                    <img src={URL.createObjectURL(files[0])} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                  </div>

                  <Button fullWidth size="lg" onClick={handleConvert} isLoading={status === 'processing'}>
                    {status === 'processing' ? 'Converting...' : 'Convert to PDF'}
                  </Button>
                </div> : <FileUpload accept="image/png, image/jpeg, image/jpg" onFilesSelected={handleFilesSelected} label="Supported formats: JPG, PNG" />}
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
                  Page Size
                </label>
                <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={options.pageSize} onChange={e => setOptions({
                ...options,
                pageSize: e.target.value
              })} disabled={status !== 'idle'}>
                  <option value="a4">A4 (210 x 297 mm)</option>
                  <option value="letter">Letter (8.5 x 11 in)</option>
                  <option value="original">Original Image Size</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                  <button className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${options.orientation === 'portrait' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setOptions({
                  ...options,
                  orientation: 'portrait'
                })} disabled={status !== 'idle'}>
                    Portrait
                  </button>
                  <button className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${options.orientation === 'landscape' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setOptions({
                  ...options,
                  orientation: 'landscape'
                })} disabled={status !== 'idle'}>
                    Landscape
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input id="fit-image" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" checked={options.fitImage} onChange={e => setOptions({
                ...options,
                fitImage: e.target.checked
              })} disabled={status !== 'idle'} />
                <label htmlFor="fit-image" className="ml-2 block text-sm text-gray-900">
                  Fit image to page
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}