import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import {
  triggerDownload,
  getFilenameWithoutExtension
} from '../utils/downloadHelpers';

export function PdfPasswordPage() {

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'protect' | 'unlock'>('protect');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;

    try {
      setLoading(true);

      const form = new FormData();
      form.append('file', file);
      form.append('mode', mode);

      // ✅ Only send password if user typed one
      if (password.trim()) {
        form.append('password', password);
      }

      const response = await fetch(
        'http://localhost:8080/api/pdf-password',
        {
          method: 'POST',
          body: form
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Operation failed');
      }

      const blob = await response.blob();

      const suffix =
        mode === 'protect' ? 'protected' : 'unlocked';

      triggerDownload(
        blob,
        `${getFilenameWithoutExtension(file.name)}-${suffix}.pdf`
      );

    } catch (err: any) {
      alert(
        err?.message ||
        'This PDF requires the correct password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-6 text-center">
        PDF Password Tool
      </h1>

      {!file ? (

        <FileUpload
          accept=".pdf"
          onFilesSelected={f => setFile(f[0])}
          label="Upload PDF"
        />

      ) : (

        <div className="bg-white border rounded-xl p-6 space-y-6">

          {/* Mode Selector */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setMode('protect');
                setPassword('');
              }}
              className={`flex-1 border p-3 rounded-lg
                ${mode === 'protect'
                  ? 'bg-blue-50 border-blue-500'
                  : 'border-gray-200'}
              `}
            >
              Protect PDF
            </button>

            <button
              onClick={() => {
                setMode('unlock');
                setPassword('');
              }}
              className={`flex-1 border p-3 rounded-lg
                ${mode === 'unlock'
                  ? 'bg-red-50 border-red-500'
                  : 'border-gray-200'}
              `}
            >
              Unlock PDF
            </button>
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-medium mb-1">
              {mode === 'protect'
                ? 'New Password'
                : 'Password (only if required)'}
            </label>

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="border rounded p-2 w-full"
              placeholder={
                mode === 'protect'
                  ? 'Set a password'
                  : 'Leave empty if not needed'
              }
            />

            {mode === 'unlock' && (
              <p className="text-xs text-gray-500 mt-1">
                Owner-restricted PDFs can be unlocked without a password.
              </p>
            )}
          </div>

          <Button
            fullWidth
            isLoading={loading}
            onClick={handleSubmit}
          >
            {mode === 'protect'
              ? 'Apply Password'
              : 'Remove Password'}
          </Button>

        </div>

      )}
    </div>
  );
}
