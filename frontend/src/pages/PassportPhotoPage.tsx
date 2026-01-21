import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';

import { generatePassportPhoto } from '../services/passportPhotoApi';
import { triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';

import { Download, RefreshCw, User } from 'lucide-react';

export function PassportPhotoPage() {

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [settings, setSettings] = useState({
    country: 'us',
    bgColor: 'white'
  });

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setStatus('idle');
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    try {
      setStatus('processing');

      const blob = await generatePassportPhoto(
        file,
        settings.country,
        settings.bgColor
      );

      (window as any).__PASSPORT_PHOTO__ = blob;
      setStatus('success');

    } catch {
      alert("Failed to generate passport photo");
      setStatus('idle');
    }
  };

  const handleDownload = () => {
    const blob = (window as any).__PASSPORT_PHOTO__;
    if (!blob || !file) return;

    const filename =
      `${getFilenameWithoutExtension(file.name)}-passport.jpg`;

    triggerDownload(blob, filename);
  };

  return (
    <div className="max-w-5xl mx-auto">

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Passport Size Photo Maker
        </h1>
        <p className="text-gray-500">
          Create biometric passport photos for any country.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2">
          {!file ? (

            <FileUpload
              accept="image/*"
              onFilesSelected={handleFileSelected}
              label="Upload a portrait photo"
            />

          ) : (

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Preview</h3>
                <button
                  onClick={() => {
                    setFile(null);
                    setStatus('idle');
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Upload different photo
                </button>
              </div>

              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-6 border-2 border-dashed">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Passport Preview"
                  className="max-w-full max-h-full object-cover"
                  style={{ backgroundColor: settings.bgColor }}
                />

                {/* Face Guide */}
                <div className="absolute inset-0 pointer-events-none opacity-30 border-2 border-blue-400 rounded-full w-1/2 h-2/3 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <User className="w-32 h-32 text-blue-400 opacity-20" />
                </div>
              </div>

              {status === 'success' ? (
                <Button
                  fullWidth
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleDownload}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Photo
                </Button>
              ) : (
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleProcess}
                  isLoading={status === 'processing'}
                >
                  {status === 'processing'
                    ? 'Processing...'
                    : 'Generate Passport Photo'}
                </Button>
              )}
            </div>

          )}
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border shadow-sm p-6 sticky top-24">
            <h3 className="font-bold mb-6 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Settings
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Country / Size
                </label>
                <select
                  className="w-full rounded-lg border-gray-300"
                  value={settings.country}
                  onChange={e =>
                    setSettings({ ...settings, country: e.target.value })
                  }
                >
                  <option value="us">United States (2×2 inch)</option>
                  <option value="in">India (35×45 mm)</option>
                  <option value="uk">United Kingdom (35×45 mm)</option>
                  <option value="eu">Schengen (35×45 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Color
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setSettings({ ...settings, bgColor: 'white' })
                    }
                    className={`px-4 py-2 border rounded-lg ${
                      settings.bgColor === 'white'
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                  >
                    White
                  </button>

                  <button
                    onClick={() =>
                      setSettings({ ...settings, bgColor: '#ebf8ff' })
                    }
                    className={`px-4 py-2 border rounded-lg ${
                      settings.bgColor !== 'white'
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                  >
                    Blue
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p className="font-medium mb-1">Tip:</p>
                <p>
                  Ensure your face is evenly lit and there are no shadows.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
