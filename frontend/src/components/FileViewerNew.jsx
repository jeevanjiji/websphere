import React, { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const FileViewer = ({ file, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !file) return null;

  const isImage = file.mimetype?.startsWith('image/') || 
                  /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.filename);
  const isPDF = file.mimetype === 'application/pdf' || 
                file.filename?.toLowerCase().endsWith('.pdf');

  const handleDownload = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(file.url || file.path, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl h-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{file.filename}</h3>
            <p className="text-sm text-gray-500">
              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'} • 
              {file.mimetype || 'Unknown type'}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4 shrink-0">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>{loading ? 'Downloading...' : 'Download'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 rounded-b-lg">
          {isImage ? (
            <div className="h-full flex items-center justify-center p-6">
              {!imageError ? (
                <img
                  src={file.url || file.path}
                  alt={file.filename}
                  className="max-w-full max-h-full object-contain rounded shadow-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">Failed to load image</p>
                  <p className="text-sm mb-4">The image could not be displayed</p>
                  <button
                    onClick={handleDownload}
                    disabled={loading}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>{loading ? 'Downloading...' : 'Download File'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : isPDF ? (
            <div className="h-full w-full">
              <iframe
                src={file.url || file.path}
                className="w-full h-full border-0 rounded-b-lg"
                title={file.filename}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <div className="mb-6">
                  <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Preview not available</h3>
                <p className="text-gray-500 mb-6">This file type cannot be previewed in the browser.</p>
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>{loading ? 'Downloading...' : 'Download File'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;