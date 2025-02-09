import React, { useState, useEffect } from 'react';
import { AlertCircle, Maximize2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import DialogContent from './dialog-content';

const RiskAssessmentViewer = ({ documentData }) => {
  const [error, setError] = useState(false);
  const [validatedUrl, setValidatedUrl] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isPDF, setIsPDF] = useState(false);

  useEffect(() => {
    if (!documentData) {
      setError(true);
      return;
    }

    try {
      let cleanedData = documentData.trim();
      
      // Check if it's a PDF
      if (cleanedData.includes('data:application/pdf')) {
        setIsPDF(true);
        setValidatedUrl(cleanedData);
      }
      // Check if it's already a complete image data URL
      else if (cleanedData.startsWith('data:image')) {
        setIsPDF(false);
        setValidatedUrl(cleanedData);
      }
      // Handle raw base64 data
      else {
        setIsPDF(false);
        // Try to detect if it's a PDF from the base64 content
        if (cleanedData.startsWith('JVBERi0')) {
          setIsPDF(true);
          setValidatedUrl(`data:application/pdf;base64,${cleanedData}`);
        } else {
          // Assume it's an image
          const base64Data = cleanedData.replace(/^data:image\/[a-z]+;base64,/, '');
          setValidatedUrl(`data:image/png;base64,${base64Data}`);
        }
      }
      
      setError(false);
    } catch (err) {
      console.error('Error processing document data:', err);
      setError(true);
    }
  }, [documentData]);

  if (!documentData) {
    return (
      <Alert>
        <AlertDescription>
          No risk assessment document available.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Unable to load the risk assessment document. The file may be corrupted or in an unsupported format.
        </AlertDescription>
      </Alert>
    );
  }

  const DocumentContent = () => (
    isPDF ? (
      <iframe
        src={validatedUrl}
        type="application/pdf"
        width="100%"
        height="600px"
        className="border-none"
        title="PDF Viewer"
      />
    ) : (
      <img
        src={validatedUrl}
        alt="Risk Assessment Document"
        className="w-full h-auto object-contain"
        onError={() => setError(true)}
      />
    )
  );

  return (
    <>
      <div 
        className="border rounded-lg p-4 bg-white max-h-[600px] overflow-auto relative group cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center z-10">
          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 h-8 w-8" />
        </div>
        <DocumentContent />
      </div>

      {showModal && (
        <DialogContent 
          className="max-w-4xl"
          onOpenChange={setShowModal}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Risk Assessment Document</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <DocumentContent />
            </div>
          </div>
        </DialogContent>
      )}
    </>
  );
};

export default RiskAssessmentViewer;