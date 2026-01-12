import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { FileArchive, Download, ArrowRight, CheckCircle } from 'lucide-react';
import { generateCompressedPdf, triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';
export function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setStatus('idle');
    }
  };
  const handleCompress = () => {
    if (!file) return;
    setStatus('processing');
    setTimeout(() => setStatus('success'), 2000);
  };
  const handleDownload = () => {
    if (!file) return;
    const compressedPdf = generateCompressedPdf(file, level);
    const filename = `${getFilenameWithoutExtension(file.name)}-compressed.pdf`;
    triggerDownload(compressedPdf, filename);
  };
  const getCompressionStats = () => {
    if (!file) return {
      original: 0,
      compressed: 0,
      savings: 0
    };
    const original = file.size;
    let ratio = 0.7; // Default medium
    if (level === 'low') ratio = 0.9;
    if (level === 'high') ratio = 0.4;
    const compressed = Math.round(original * ratio);
    const savings = Math.round((original - compressed) / original * 100);
    return {
      original,
      compressed,
      savings
    };
  };
  const stats = getCompressionStats();
  return <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compress PDF</h1>
        <p className="text-gray-500">
          Reduce file size while optimizing for quality.
        </p>
      </div>

      {status === 'success' ? <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-green-50 p-8 text-center border-b border-green-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Compression Successful!
            </h2>
            <p className="text-green-700 font-medium">
              You saved {stats.savings}% of the file size.
            </p>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                  Original
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {(stats.original / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <ArrowRight className="text-gray-300" />
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                  Compressed
                </p>
                <p className="text-xl font-bold text-green-600">
                  {(stats.compressed / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="w-full sm:w-auto" onClick={handleDownload}>
                <Download className="w-5 h-5 mr-2" /> Download Compressed PDF
              </Button>
              <Button variant="secondary" onClick={() => {
            setFile(null);
            setStatus('idle');
          }} className="w-full sm:w-auto">
                Compress Another
              </Button>
            </div>
          </div>
        </div> : <div className="space-y-8">
          {!file ? <FileUpload accept=".pdf" onFilesSelected={handleFileSelected} label="Select a PDF to compress" /> : <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-lg mr-4">
                    <FileArchive className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                  Change
                </button>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Compression Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[{
              id: 'low',
              label: 'Low Compression',
              desc: 'High Quality',
              savings: '~10%'
            }, {
              id: 'medium',
              label: 'Medium',
              desc: 'Good Quality',
              savings: '~30%'
            }, {
              id: 'high',
              label: 'Extreme',
              desc: 'Low Quality',
              savings: '~60%'
            }].map(opt => <div key={opt.id} onClick={() => setLevel(opt.id as any)} className={`
                        cursor-pointer border-2 rounded-xl p-4 transition-all
                        ${level === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}
                      `}>
                      <div className="font-bold text-gray-900 mb-1">
                        {opt.label}
                      </div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                      <div className="text-xs font-medium text-green-600 mt-2">
                        Save {opt.savings}
                      </div>
                    </div>)}
                </div>
              </div>

              <Button fullWidth size="lg" onClick={handleCompress} isLoading={status === 'processing'}>
                {status === 'processing' ? 'Compressing...' : 'Compress PDF'}
              </Button>
            </div>}
        </div>}
    </div>;
}