import React from 'react';
import { FileImage, FilePlus, FileArchive, Camera, Presentation, FileText, Edit3 } from 'lucide-react';
import { ToolCard } from '../components/ToolCard';
interface HomePageProps {
  onNavigate: (path: string) => void;
}
export function HomePage({
  onNavigate
}: HomePageProps) {
  const tools = [{
    title: 'Image to PDF',
    description: 'Convert JPG, PNG, and other image formats to PDF documents instantly.',
    icon: <FileImage className="w-6 h-6" />,
    path: '/image-to-pdf'
  }, {
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one single document in the order you want.',
    icon: <FilePlus className="w-6 h-6" />,
    path: '/merge-pdf'
  }, {
    title: 'Compress PDF',
    description: 'Reduce the file size of your PDFs while maintaining the best possible quality.',
    icon: <FileArchive className="w-6 h-6" />,
    path: '/compress-pdf'
  }, {
    title: 'PDF to PowerPoint',
    description: 'Convert PDF documents to editable PowerPoint presentations with preserved formatting.',
    icon: <Presentation className="w-6 h-6" />,
    path: '/pdf-to-ppt'
  }, {
    title: 'PDF to Document',
    description: 'Transform PDFs into Word documents while maintaining the original layout and structure.',
    icon: <FileText className="w-6 h-6" />,
    path: '/pdf-to-doc'
  }, {
    title: 'PDF Editor',
    description: 'Edit your PDFs directly - add text, images, move elements, and make changes easily.',
    icon: <Edit3 className="w-6 h-6" />,
    path: '/pdf-editor'
  }, {
    title: 'Passport Photo',
    description: 'Create professional passport size photos with custom backgrounds and sizes.',
    icon: <Camera className="w-6 h-6" />,
    path: '/passport-photo'
  }];
  return <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto pt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          Free PDF & Image Tools <br />
          <span className="text-blue-600">No Uploads, No Limits</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Simple, private, and free utilities to manage your documents. Files
          are processed securely in your browser.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tools.map(tool => <ToolCard key={tool.path} title={tool.title} description={tool.description} icon={tool.icon} onClick={() => onNavigate(tool.path)} />)}
      </div>

      {/* Features / Trust Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-gray-200">
        <div className="text-center">
          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">100% Secure</h3>
          <p className="text-gray-500 text-sm">
            Files stay on your device and are never stored on our servers.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Lightning Fast</h3>
          <p className="text-gray-500 text-sm">
            Optimized processing ensures your tasks are done in seconds.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Completely Free</h3>
          <p className="text-gray-500 text-sm">
            No hidden costs, no premium plans, and absolutely no watermarks.
          </p>
        </div>
      </div>
    </div>;
}