import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { Edit3, Move, Type, Image as ImageIcon, Trash2, Save, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, CheckCircle, Download } from 'lucide-react';
import { generateEditedPdf, triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';
export function PdfEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [activeTool, setActiveTool] = useState<'move' | 'text' | 'image' | 'delete'>('move');
  const [status, setStatus] = useState<'idle' | 'editing' | 'saving' | 'success'>('idle');
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setStatus('editing');
    }
  };
  const handleSave = () => {
    setStatus('saving');
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };
  const handleDownload = () => {
    if (!file) return;
    const editedPdf = generateEditedPdf(file);
    const filename = `${getFilenameWithoutExtension(file.name)}-edited.pdf`;
    triggerDownload(editedPdf, filename);
  };
  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setActiveTool('move');
  };
  if (status === 'idle') {
    return <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit PDF</h1>
          <p className="text-gray-500">
            Add text, images, and make changes directly to your PDF.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <FileUpload accept=".pdf" onFilesSelected={handleFilesSelected} label="Upload PDF to edit" />
        </div>
      </div>;
  }
  if (status === 'success') {
    return <div className="max-w-2xl mx-auto pt-12">
        <div className="bg-green-50 border border-green-200 rounded-xl p-12 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Changes Saved!
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Your edited PDF is ready for download.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="shadow-lg" onClick={handleDownload}>
              <Download className="w-5 h-5 mr-2" /> Download Edited PDF
            </Button>
            <Button variant="secondary" onClick={() => setStatus('editing')}>
              Continue Editing
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-[calc(100vh-4rem)] -m-8 md:-m-12">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button onClick={() => setActiveTool('move')} className={`p-2 rounded-md transition-all ${activeTool === 'move' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`} title="Select / Move">
                <Move className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveTool('text')} className={`p-2 rounded-md transition-all ${activeTool === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`} title="Add Text">
                <Type className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveTool('image')} className={`p-2 rounded-md transition-all ${activeTool === 'image' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`} title="Add Image">
                <ImageIcon className="w-5 h-5" />
              </button>
              <div className="w-px bg-gray-300 mx-1 my-1"></div>
              <button onClick={() => setActiveTool('delete')} className={`p-2 rounded-md transition-all ${activeTool === 'delete' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`} title="Delete Element">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <span className="text-sm font-medium text-gray-500 ml-2 hidden sm:inline-block">
              {activeTool === 'move' && 'Select & Move'}
              {activeTool === 'text' && 'Click to add text'}
              {activeTool === 'image' && 'Click to add image'}
              {activeTool === 'delete' && 'Click element to delete'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={status === 'saving'}>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-grow bg-gray-100 p-8 overflow-auto flex justify-center items-start relative">
        <div className="bg-white shadow-lg rounded-sm transition-transform duration-200 origin-top" style={{
        width: '800px',
        height: '1131px',
        transform: `scale(${zoom / 100})`,
        marginBottom: '4rem'
      }}>
          {/* Mock PDF Content */}
          <div className="w-full h-full p-12 relative group cursor-crosshair">
            <div className="absolute top-0 left-0 w-full h-8 bg-gray-50 border-b border-gray-100 flex items-center justify-center text-xs text-gray-400">
              PDF Page {currentPage} - {file?.name}
            </div>

            <div className="mt-8 space-y-6 text-gray-800 pointer-events-none opacity-40">
              <h1 className="text-4xl font-bold">Sample PDF Document</h1>
              <p className="text-lg">
                This is a preview of your uploaded PDF file.
              </p>
              <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                Image Placeholder
              </div>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            {/* Editable Elements Layer */}
            <div className="absolute inset-0 pointer-events-auto">
              {/* Mock Editable Text */}
              <div className="absolute top-40 left-20 border-2 border-transparent hover:border-blue-400 hover:bg-blue-50/10 p-2 rounded cursor-move group/item transition-colors">
                <span className="text-blue-600 font-handwriting text-xl">
                  Added Text Annotation
                </span>
                <div className="absolute -top-3 -right-3 hidden group-hover/item:flex bg-white shadow-sm rounded-full p-1 cursor-pointer hover:bg-red-50 text-red-500">
                  <X className="w-3 h-3" />
                </div>
              </div>

              {/* Mock Added Image */}
              <div className="absolute bottom-40 right-20 w-32 h-32 border-2 border-blue-400 bg-gray-50 flex items-center justify-center rounded cursor-move shadow-sm">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <div className="absolute -top-3 -right-3 bg-white shadow-sm rounded-full p-1 cursor-pointer hover:bg-red-50 text-red-500">
                  <X className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Empty State Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-200 text-gray-500 text-sm font-medium animate-pulse">
                Select a tool from the toolbar to start editing
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-white border-t border-gray-200 p-3 fixed bottom-0 left-0 right-0 z-40 shadow-lg-up">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of 3
            </span>
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" disabled={currentPage === 3} onClick={() => setCurrentPage(c => c + 1)}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-1 rounded hover:bg-gray-100" onClick={() => setZoom(z => Math.max(50, z - 25))}>
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-600 w-12 text-center">
              {zoom}%
            </span>
            <button className="p-1 rounded hover:bg-gray-100" onClick={() => setZoom(z => Math.min(200, z + 25))}>
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>;
}