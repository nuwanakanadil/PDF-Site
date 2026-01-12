import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { Camera, Download, RefreshCw, User } from 'lucide-react';
import { generatePassportPhoto, triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';
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
  const handleProcess = () => {
    if (!file) return;
    setStatus('processing');
    setTimeout(() => setStatus('success'), 2000);
  };
  const handleDownload = () => {
    if (!file) return;
    const photoBlob = generatePassportPhoto(file, settings);
    const filename = `${getFilenameWithoutExtension(file.name)}-passport.jpg`;
    triggerDownload(photoBlob, filename);
  };
  return <div className="max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Passport Size Photo Maker
        </h1>
        <p className="text-gray-500">
          Create biometric passport photos for any country.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {!file ? <FileUpload accept="image/*" onFilesSelected={handleFileSelected} label="Upload a portrait photo" /> : <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Preview</h3>
                <button onClick={() => {
              setFile(null);
              setStatus('idle');
            }} className="text-sm text-blue-600 hover:underline">
                  Upload different photo
                </button>
              </div>

              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-6 border-2 border-dashed border-gray-300">
                {/* Mock Crop Overlay */}
                <img src={URL.createObjectURL(file)} alt="Passport Preview" className="max-w-full max-h-full object-cover" style={{
              backgroundColor: settings.bgColor
            }} />

                {/* Face Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-30 border-2 border-blue-400 rounded-full w-1/2 h-2/3 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <User className="w-32 h-32 text-blue-400 opacity-20" />
                </div>
              </div>

              {status === 'success' ? <Button fullWidth size="lg" className="bg-green-600 hover:bg-green-700" onClick={handleDownload}>
                  <Download className="w-5 h-5 mr-2" /> Download Photo
                </Button> : <Button fullWidth size="lg" onClick={handleProcess} isLoading={status === 'processing'}>
                  {status === 'processing' ? 'Processing...' : 'Generate Passport Photo'}
                </Button>}
            </div>}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" /> Settings
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country / Size
                </label>
                <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={settings.country} onChange={e => setSettings({
                ...settings,
                country: e.target.value
              })}>
                  <option value="us">United States (2x2 inch)</option>
                  <option value="in">India (35x45 mm)</option>
                  <option value="uk">United Kingdom (35x45 mm)</option>
                  <option value="eu">Schengen (35x45 mm)</option>
                  <option value="custom">Custom Size</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setSettings({
                  ...settings,
                  bgColor: 'white'
                })} className={`flex items-center justify-center px-4 py-2 border rounded-lg ${settings.bgColor === 'white' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <div className="w-4 h-4 rounded-full border border-gray-300 bg-white mr-2"></div>
                    White
                  </button>
                  <button onClick={() => setSettings({
                  ...settings,
                  bgColor: '#ebf8ff'
                })} className={`flex items-center justify-center px-4 py-2 border rounded-lg ${settings.bgColor !== 'white' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <div className="w-4 h-4 rounded-full bg-blue-100 mr-2"></div>
                    Blue
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">Tip:</p>
                <p>
                  Ensure your face is evenly lit and there are no shadows on the
                  background.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}