import React, { useState, useRef } from 'react';
import { Upload, File as FileIcon, X, CheckCircle2 } from 'lucide-react';
interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  maxSizeMB?: number;
}
export function FileUpload({
  accept,
  multiple = false,
  onFilesSelected,
  label = 'Drag & drop files here or click to browse',
  maxSizeMB = 10
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };
  const handleFiles = (files: File[]) => {
    // Basic validation could go here
    onFilesSelected(files);
  };
  return <div className={`
        relative group cursor-pointer
        border-2 border-dashed rounded-xl p-8 transition-all duration-200
        flex flex-col items-center justify-center text-center
        ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'}
      `} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
      <input type="file" ref={fileInputRef} className="hidden" accept={accept} multiple={multiple} onChange={handleFileInput} />

      <div className={`
        p-4 rounded-full mb-4 transition-colors duration-200
        ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'}
      `}>
        <Upload className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {isDragging ? 'Drop files now' : 'Upload Files'}
      </h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">{label}</p>
      <p className="text-xs text-gray-400 mt-4">Max file size: {maxSizeMB}MB</p>
    </div>;
}