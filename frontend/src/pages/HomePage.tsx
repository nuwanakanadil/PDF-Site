import React from 'react';
import {
  FileImage,
  FilePlus,
  FileArchive,
  Camera,
  Presentation,
  FileText,
  Edit3
} from 'lucide-react';

import { ToolCard } from '../components/ToolCard';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {

  const tools = [
    {
      title: 'Image to PDF',
      description: 'Convert JPG, PNG, and other image formats to PDF documents instantly.',
      icon: <FileImage className="w-6 h-6" />,
      path: '/image-to-pdf'
    },
    {
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into one single document in the order you want.',
      icon: <FilePlus className="w-6 h-6" />,
      path: '/merge-pdf'
    },
    {
      title: 'Compress PDF',
      description: 'Reduce the file size of your PDFs while maintaining the best possible quality.',
      icon: <FileArchive className="w-6 h-6" />,
      path: '/compress-pdf'
    },

    // ✅ NEW IMAGE COMPRESS CARD
    {
      title: 'Compress Image',
      description: 'Reduce image size without noticeable quality loss. Supports JPG & PNG.',
      icon: <FileImage className="w-6 h-6" />,
      path: '/compress-image'
    },

    {
      title: 'PDF to PowerPoint',
      description: 'Convert PDF documents to editable PowerPoint presentations with preserved formatting.',
      icon: <Presentation className="w-6 h-6" />,
      path: '/pdf-to-ppt'
    },
    {
      title: 'PDF to Document',
      description: 'Transform PDFs into Word documents while maintaining the original layout and structure.',
      icon: <FileText className="w-6 h-6" />,
      path: '/pdf-to-doc'
    },
    {
      title: 'PDF Editor',
      description: 'Edit your PDFs directly - add text, images, move elements, and make changes easily.',
      icon: <Edit3 className="w-6 h-6" />,
      path: '/pdf-editor'
    },
    {
      title: 'Passport Photo',
      description: 'Create professional passport size photos with custom backgrounds and sizes.',
      icon: <Camera className="w-6 h-6" />,
      path: '/passport-photo'
    },

    {
  title: 'Resize Image',
  description: 'Resize and crop images for social media and web.',
  icon: <Camera className="w-6 h-6" />,
  path: '/resize-image'
},

{
  title: 'Protect PDF',
  description: 'Add or remove password protection.',
  icon: <Edit3 className="w-6 h-6" />,
  path: '/pdf-password'
},
{
  title: 'Convert Image',
  description: 'Convert images between JPG, PNG and WebP.',
  icon: <FileImage className="w-6 h-6" />,
  path: '/convert-image'
},
{
  title: 'PDF Page Manager',
  description:
    'Split, extract, or remove pages from PDF files.',
  icon: <FileText className="w-6 h-6" />,
  path: '/pdf-pages'
}


    
  ];

  return (
    <div className="space-y-16">

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto pt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Free PDF & Image Tools <br />
          <span className="text-blue-600">No Uploads, No Limits</span>
        </h1>
        <p className="text-xl text-gray-600">
          Simple, private, and free utilities to manage your documents.
          Files are processed securely in your browser.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tools.map(tool => (
          <ToolCard
            key={tool.path}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            onClick={() => onNavigate(tool.path)}
          />
        ))}
      </div>

      {/* Trust Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t">
        <div className="text-center">
          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            🔒
          </div>
          <h3 className="font-bold mb-2">100% Secure</h3>
          <p className="text-sm text-gray-500">
            Files never leave your device.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            ⚡
          </div>
          <h3 className="font-bold mb-2">Lightning Fast</h3>
          <p className="text-sm text-gray-500">
            Optimized for speed.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            💯
          </div>
          <h3 className="font-bold mb-2">Completely Free</h3>
          <p className="text-sm text-gray-500">
            No limits. No watermarks.
          </p>
        </div>
      </div>
    </div>
  );
}
