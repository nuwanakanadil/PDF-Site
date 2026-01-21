import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { FileImage, Download, ArrowRight, CheckCircle } from 'lucide-react';
import { compressImage } from '../services/imageCompressApi';
import { triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';

export function ImageCompressPage() {

  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(70); // %
  const [status, setStatus] =
    useState<'idle' | 'processing' | 'success'>('idle');

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setStatus('idle');
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setStatus('processing');

      const blob = await compressImage(file, quality);
      (window as any).__COMPRESSED_IMAGE__ = blob;

      setStatus('success');
    } catch {
      alert('Image compression failed');
      setStatus('idle');
    }
  };

  const handleDownload = () => {
    const blob = (window as any).__COMPRESSED_IMAGE__;
    if (!blob || !file) return;

    const filename =
      `${getFilenameWithoutExtension(file.name)}-compressed.jpg`;

    triggerDownload(blob, filename);
  };

  return (
    <div className="max-w-3xl mx-auto">

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Compress Image</h1>
        <p className="text-gray-500">
          Reduce image size without noticeable quality loss.
        </p>
      </div>

      {status === 'success' ? (

        <div className="bg-white border rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />

          <h2 className="text-2xl font-bold mb-2">
            Image Compressed Successfully!
          </h2>

          <div className="flex justify-center gap-4 mt-6">
            <Button size="lg" onClick={handleDownload}>
              <Download className="w-5 h-5 mr-2" />
              Download Image
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setStatus('idle');
                delete (window as any).__COMPRESSED_IMAGE__;
              }}
            >
              Compress Another
            </Button>
          </div>
        </div>

      ) : (

        <div className="space-y-6">

          {!file ? (

            <FileUpload
              accept="image/*"
              onFilesSelected={handleFileSelected}
              label="Upload JPG or PNG image"
            />

          ) : (

            <div className="bg-white border rounded-xl shadow-sm p-6">

              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <FileImage className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block font-medium mb-2">
                  Compression Quality: {quality}%
                </label>

                <input
                  type="range"
                  min={30}
                  max={90}
                  value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Smaller</span>
                  <span>Better Quality</span>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleCompress}
                isLoading={status === 'processing'}
              >
                {status === 'processing'
                  ? 'Compressing...'
                  : 'Compress Image'}
              </Button>

            </div>

          )}

        </div>

      )}

    </div>
  );
}
