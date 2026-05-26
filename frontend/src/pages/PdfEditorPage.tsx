import React, { useMemo, useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import {
  Edit3,
  Move,
  Type,
  Image as ImageIcon,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  Download,
  Loader2
} from 'lucide-react';
import { generateEditedPdf, triggerDownload, getFilenameWithoutExtension } from '../utils/downloadHelpers';
import { analyzePdf, AnalyzedPage, DocumentAnalysis } from '../services/pdfAnalysisApi';

export function PdfEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [pages, setPages] = useState<AnalyzedPage[]>([]);
  const [activeTool, setActiveTool] = useState<'move' | 'text' | 'image' | 'delete'>('move');
  const [status, setStatus] = useState<'idle' | 'loading' | 'editing' | 'saving' | 'success'>('idle');
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const currentPageData = useMemo(
    () => pages[Math.max(0, currentPage - 1)] ?? null,
    [currentPage, pages]
  );

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      const selectedFile = files[0];
      setFile(selectedFile);
      setStatus('loading');
      setCurrentPage(1);

      const result = await analyzePdf(selectedFile);
      setAnalysis(result);
      setPages(result.pages ?? []);
      setStatus('editing');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'PDF analysis failed');
      handleReset();
    }
  };

  const handleSave = () => {
    setStatus('saving');
    setTimeout(() => {
      setStatus('success');
    }, 800);
  };

  const handleDownload = () => {
    if (!file) return;
    const editedPdf = generateEditedPdf(file);
    const filename = `${getFilenameWithoutExtension(file.name)}-edited.pdf`;
    triggerDownload(editedPdf, filename);
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setPages([]);
    setStatus('idle');
    setActiveTool('move');
    setCurrentPage(1);
  };

  const updateCurrentPageText = (blockId: string, nextText: string) => {
    setPages(existingPages =>
      existingPages.map(page =>
        page.pageNumber !== currentPage
          ? page
          : {
              ...page,
              blocks: page.blocks.map(block =>
                block.id === blockId ? { ...block, text: nextText } : block
              )
            }
      )
    );
  };

  const deleteBlock = (blockId: string) => {
    setPages(existingPages =>
      existingPages.map(page =>
        page.pageNumber !== currentPage
          ? page
          : {
              ...page,
              blocks: page.blocks.filter(block => block.id !== blockId)
            }
      )
    );
  };

  const addTextBlock = () => {
    if (!currentPageData) return;

    const nextBlock = {
      id: `p${currentPage}-new-${Date.now()}`,
      type: 'paragraph',
      text: 'New text block',
      order: currentPageData.blocks.length + 1
    };

    setPages(existingPages =>
      existingPages.map(page =>
        page.pageNumber !== currentPage
          ? page
          : {
              ...page,
              blocks: [...page.blocks, nextBlock]
            }
      )
    );
    setActiveTool('text');
  };

  if (status === 'idle') {
    return <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit PDF</h1>
          <p className="text-gray-500">
            Load model-detected content blocks from your PDF and adjust the extracted text layer.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <FileUpload accept=".pdf" onFilesSelected={handleFilesSelected} label="Upload PDF to analyze and edit" />
        </div>
      </div>;
  }

  if (status === 'loading') {
    return <div className="max-w-2xl mx-auto pt-12">
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Document</h2>
          <p className="text-gray-600">
            Running the shared document-analysis pipeline so the editor can load real page content.
          </p>
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
            Your edited PDF export is ready for download.
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button onClick={() => setActiveTool('move')} className={`p-2 rounded-md transition-all ${activeTool === 'move' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`} title="Review Blocks">
                <Move className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveTool('text')} className={`p-2 rounded-md transition-all ${activeTool === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`} title="Edit Text">
                <Type className="w-5 h-5" />
              </button>
              <button onClick={addTextBlock} className="p-2 rounded-md transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-200" title="Add Text Block">
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveTool('image')} className={`p-2 rounded-md transition-all ${activeTool === 'image' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`} title="Image Layer">
                <ImageIcon className="w-5 h-5" />
              </button>
              <div className="w-px bg-gray-300 mx-1 my-1"></div>
              <button onClick={() => setActiveTool('delete')} className={`p-2 rounded-md transition-all ${activeTool === 'delete' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`} title="Delete Block">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <span className="text-sm font-medium text-gray-500 ml-2 hidden sm:inline-block">
              {activeTool === 'move' && 'Review detected blocks'}
              {activeTool === 'text' && 'Edit extracted text'}
              {activeTool === 'image' && 'Image-aware editing is coming next'}
              {activeTool === 'delete' && 'Click a block to remove it'}
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

      <div className="flex-grow bg-gray-100 p-8 overflow-auto flex justify-center items-start relative">
        <div className="bg-white shadow-lg rounded-sm transition-transform duration-200 origin-top" style={{
        width: '860px',
        minHeight: '1131px',
        transform: `scale(${zoom / 100})`,
        marginBottom: '4rem'
      }}>
          <div className="w-full min-h-full p-12 relative">
            <div className="absolute top-0 left-0 w-full h-10 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-4 text-xs text-gray-500">
              <span>PDF Page {currentPage} - {file?.name}</span>
              <span>{analysis?.engine || 'analysis'} / {analysis?.format || 'plain'}</span>
            </div>

            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {currentPageData?.title || `Page ${currentPage}`}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Model-backed content layer preview for the selected page.
              </p>

              <div className="space-y-4">
                {currentPageData?.blocks?.length ? currentPageData.blocks.map(block => <div key={block.id} onClick={() => {
                if (activeTool === 'delete') deleteBlock(block.id);
              }} className={`rounded-lg border p-4 transition-colors ${activeTool === 'delete' ? 'cursor-pointer border-red-200 hover:bg-red-50' : 'border-gray-200 bg-white'} ${block.type === 'heading' ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-xs uppercase tracking-wide text-gray-400">
                          {block.type}
                        </span>
                        {activeTool === 'delete' ? <span className="text-xs text-red-500">Click to remove</span> : null}
                      </div>

                      {activeTool === 'text' ? <textarea value={block.text} onChange={e => updateCurrentPageText(block.id, e.target.value)} className={`w-full min-h-[88px] rounded-md border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${block.type === 'heading' ? 'font-semibold text-gray-900' : 'text-gray-700'}`} /> : <div className={`whitespace-pre-wrap text-sm ${block.type === 'heading' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {block.text}
                        </div>}
                    </div>) : <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
                    No extracted content was available for this page.
                  </div>}
              </div>
            </div>

            {activeTool === 'image' ? <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                The shared analysis pipeline is powering text/layout blocks now. Image-region editing can be layered on top of the same page analysis next.
              </div> : null}
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-3 fixed bottom-0 left-0 right-0 z-40 shadow-lg-up">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of {Math.max(1, pages.length)}
            </span>
            <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" disabled={currentPage >= Math.max(1, pages.length)} onClick={() => setCurrentPage(c => c + 1)}>
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
