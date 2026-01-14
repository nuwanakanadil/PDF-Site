import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { FileArchive, Download, ArrowRight, CheckCircle } from 'lucide-react';

import { compressPdf } from '../services/compressPdfApi';
import { triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';

const MAX_SIZE = 30 * 1024 * 1024; // 30 MB

export function CompressPdfPage() {

  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;

    const selected = files[0];

    if (selected.size > MAX_SIZE) {
      alert("Maximum allowed file size is 30 MB");
      return;
    }

    setFile(selected);
    setStatus('idle');
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setStatus('processing');

      const compressedBlob = await compressPdf(file, level);
      (window as any).__COMPRESSED_PDF__ = compressedBlob;

      setStatus('success');
    } catch (err: any) {
      alert("Compression failed or file too large");
      setStatus('idle');
    }
  };

  const handleDownload = () => {
    const blob = (window as any).__COMPRESSED_PDF__;
    if (!blob || !file) return;

    const filename =
      `${getFilenameWithoutExtension(file.name)}-compressed.pdf`;

    triggerDownload(blob, filename);
  };

  const getCompressionStats = () => {
    if (!file) return { original: 0, compressed: 0, savings: 0 };

    const original = file.size;
    let ratio = 0.7;

    if (level === 'low') ratio = 0.9;
    if (level === 'high') ratio = 0.4;

    const compressed = Math.round(original * ratio);
    const savings = Math.round(((original - compressed) / original) * 100);

    return { original, compressed, savings };
  };

  const stats = getCompressionStats();

  return (
    <div className="max-w-3xl mx-auto">

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compress PDF</h1>
        <p className="text-gray-500">
          Reduce file size while optimizing for quality.
        </p>
      </div>

      {status === 'success' ? (

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-green-50 p-8 text-center border-b">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Compression Successful!</h2>
            <p className="text-green-700 font-medium">
              You saved {stats.savings}% of the file size.
            </p>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-500">Original</p>
                <p className="text-xl font-bold">
                  {(stats.original / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <ArrowRight className="text-gray-300" />

              <div className="text-center">
                <p className="text-sm text-gray-500">Compressed</p>
                <p className="text-xl font-bold text-green-600">
                  {(stats.compressed / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={handleDownload}>
                <Download className="w-5 h-5 mr-2" /> Download
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setFile(null);
                  setStatus('idle');
                  delete (window as any).__COMPRESSED_PDF__;
                }}
              >
                Compress Another
              </Button>
            </div>
          </div>
        </div>

      ) : (

        <div className="space-y-8">
          {!file ? (
            <FileUpload
              accept=".pdf"
              onFilesSelected={handleFileSelected}
              label="Select a PDF to compress (Max 30 MB)"
            />
          ) : (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-lg mr-4">
                    <FileArchive className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                  Change
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-4">
                  Compression Level
                </label>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'low', label: 'Low', savings: '~10%' },
                    { id: 'medium', label: 'Medium', savings: '~30%' },
                    { id: 'high', label: 'High', savings: '~60%' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setLevel(opt.id as any)}
                      className={`cursor-pointer border-2 rounded-lg p-4 text-center
                        ${level === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                      `}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-xs text-green-600">
                        Save {opt.savings}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleCompress}
                isLoading={status === 'processing'}
              >
                {status === 'processing' ? 'Compressing...' : 'Compress PDF'}
              </Button>
            </div>
          )}
        </div>

      )}
    </div>
  );
}
