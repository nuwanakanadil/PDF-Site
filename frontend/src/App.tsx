import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ImageToPdfPage } from './pages/ImageToPdfPage';
import { MergePdfPage } from './pages/MergePdfPage';
import { CompressPdfPage } from './pages/CompressPdfPage';
import { PassportPhotoPage } from './pages/PassportPhotoPage';
import { PdfToPptPage } from './pages/PdfToPptPage';
import { PdfToDocPage } from './pages/PdfToDocPage';
import { PdfEditorPage } from './pages/PdfEditorPage';
export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.slice(1) || '/';
      setCurrentPath(path);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const navigate = (path: string) => {
    window.location.hash = path;
  };
  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <HomePage onNavigate={navigate} />;
      case '/image-to-pdf':
        return <ImageToPdfPage />;
      case '/merge-pdf':
        return <MergePdfPage />;
      case '/compress-pdf':
        return <CompressPdfPage />;
      case '/passport-photo':
        return <PassportPhotoPage />;
      case '/pdf-to-ppt':
        return <PdfToPptPage />;
      case '/pdf-to-doc':
        return <PdfToDocPage />;
      case '/pdf-editor':
        return <PdfEditorPage />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };
  return <Layout currentPath={currentPath} onNavigate={navigate}>
      {renderPage()}
    </Layout>;
}