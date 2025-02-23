import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, File, X, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog-content';

const RiskAssessmentViewer = ({ documents }) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [error, setError] = useState(null);

  if (!documents?.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No documents available.</AlertDescription>
      </Alert>
    );
  }

  const handleDownload = (document) => {
    try {
      // Create blob from base64 data
      const byteCharacters = atob(document.fileData.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: document.fileType });

      // Create download link using window.document
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download document. Please try again.');
      console.error('Download error:', err);
    }
  };

  const renderDocument = (doc) => {
    if (doc.fileType.includes('pdf')) {
      return (
        <div className="w-full h-[calc(100vh-12rem)] overflow-auto">
          <iframe
            src={doc.fileData}
            className="w-full h-full"
            title={doc.fileName}
          />
        </div>
      );
    }
    if (doc.fileType.includes('image')) {
      return (
        <div className="w-full max-h-[calc(100vh-12rem)] overflow-auto flex items-start justify-center">
          <img
            src={doc.fileData}
            alt={doc.fileName}
            className="max-w-full object-contain"
            style={{ maxHeight: 'calc(100vh - 12rem)' }}
          />
        </div>
      );
    }
    return (
      <div className="p-4 text-center">
        <p>Preview not available for this file type</p>
        <Button onClick={() => handleDownload(doc)} className="mt-2">
          Download to View
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" onClose={() => setError(null)}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <File className="h-5 w-5 text-blue-500" />
                <span className="font-medium truncate max-w-[150px]">
                  {doc.fileName}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-8 mt-4">
              <button
                onClick={() => handleDownload(doc)}
                className="group flex items-center px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 ease-in-out"
              >
                <Download className="h-4 w-4 mr-2 text-gray-500 group-hover:text-blue-500 transition-colors" />
                <span className="group-hover:text-gray-900">Download</span>
              </button>
              <button
                onClick={() => {
                  setSelectedDoc(doc);
                  setViewerOpen(true);
                }}
                className="group flex items-center px-2 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 hover:shadow-md transition-all duration-200 ease-in-out"
              >
                <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span>View</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-full mx-auto my-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{selectedDoc?.fileName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedDoc && renderDocument(selectedDoc)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiskAssessmentViewer;