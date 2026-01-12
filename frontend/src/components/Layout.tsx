import React from 'react';
import { FileText, Github, Shield, Info } from 'lucide-react';
interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}
export function Layout({
  children,
  currentPath,
  onNavigate
}: LayoutProps) {
  const navLinks = [{
    name: 'Image to PDF',
    path: '/image-to-pdf'
  }, {
    name: 'Merge PDF',
    path: '/merge-pdf'
  }, {
    name: 'Compress PDF',
    path: '/compress-pdf'
  }, {
    name: 'PDF to PPT',
    path: '/pdf-to-ppt'
  }, {
    name: 'PDF to Doc',
    path: '/pdf-to-doc'
  }, {
    name: 'PDF Editor',
    path: '/pdf-editor'
  }, {
    name: 'Passport Photo',
    path: '/passport-photo'
  }];
  return <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('/')}>
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                PDF Tools
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map(link => <button key={link.path} onClick={() => onNavigate(link.path)} className={`
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 h-full
                    ${currentPath === link.path ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}>
                  {link.name}
                </button>)}
            </div>

            {/* Mobile menu button placeholder - can be expanded if needed */}
            <div className="flex items-center md:hidden">
              <button className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Open menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-1.5 rounded-md mr-2">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                  PDF Tools
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Free, secure, and easy-to-use online PDF tools. Process files
                directly in your browser with no uploads required for most
                operations.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Tools
              </h3>
              <ul className="space-y-3">
                {navLinks.map(link => <li key={link.path}>
                    <button onClick={() => onNavigate(link.path)} className="text-gray-500 hover:text-blue-600 text-sm transition-colors">
                      {link.name}
                    </button>
                  </li>)}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Legal & Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="flex items-center text-gray-500 hover:text-blue-600 text-sm transition-colors">
                    <Shield className="w-4 h-4 mr-2" /> Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-gray-500 hover:text-blue-600 text-sm transition-colors">
                    <Info className="w-4 h-4 mr-2" /> About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-gray-500 hover:text-blue-600 text-sm transition-colors">
                    <Github className="w-4 h-4 mr-2" /> GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} PDF Tools. All rights reserved.
          </div>
        </div>
      </footer>
    </div>;
}