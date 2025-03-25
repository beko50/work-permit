import React, { useState,useMemo } from 'react';
import { Button } from './button';
import { Card, CardHeader, CardContent } from './card';
import { AlertTriangle, Clock, Check, X, AlertCircle} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';

const PermitRevocation = ({ permitId, revocationData, onRevocationProcessed, isQHSSEUser, permitType }) => {
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const actualPermitType = permitType === 'work' ? 'ptw' : 'job';

  const isQHSSEInitiated = useMemo(() => {
    if (!revocationData) return false;
    return revocationData.InitiatorRole === 'QA';
  }, [revocationData]);

  const showQAControls = isQHSSEUser &&
    !isQHSSEInitiated &&
    revocationData?.Status === 'Revocation Pending';

    const handleRevocationAction = async (status) => {
      
      // Check if comments are at least 10 characters long
      if (comments.trim().length < 10) {
        setError('Comments must be at least 10 characters long');
        toast.error('Comments must be at least 10 characters long');
        return;
      }
  
      try {
        setProcessing(true);
        setError(null);
  
        await api.approveRevocation([{
          id: parseInt(permitId),
          type: actualPermitType
        }], status, comments);
  
        toast.success(`Revocation ${status.toLowerCase()} successfully`);
        if (onRevocationProcessed) {
          onRevocationProcessed();
        }
      } catch (error) {
        const errorMessage = error.message || 'Failed to process revocation';
  
        if (errorMessage.includes('already been revoked')) {
          setError('The main Job Permit documentation has already been revoked. This Permit to Work cannot be processed.');
          toast.error('Main Job Permit is already revoked');
        } else if (errorMessage.includes('not in a valid state')) {
          setError('This permit cannot be processed because it is not in the correct state. Please refresh the page to see the current status.');
          toast.error('Invalid permit state');
        } else {
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setProcessing(false);
      }
    };
  
    if (!revocationData) return null;
  
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="font-bold text-red-700">Permit Revocation</span>
          <span className="ml-auto text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
            Status: {revocationData.Status}
          </span>
        </div>
  
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
  
        <div className="space-y-4">
          {/* Initiator Details */}
          <div className="border rounded-md p-3 border-red-100">
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Revoked by: </span>
                {revocationData.RevocationInitiatedBy}
              </div>
              {revocationData.RevocationInitiatedDate && (
                <div className="text-sm">
                  <span className="font-medium">Date: </span>
                  {formatDate(revocationData.RevocationInitiatedDate)}
                </div>
              )}
              {revocationData.RevocationReason && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Reason:</p>
                  <p className="bg-white p-2 rounded text-sm border border-red-100">
                    {revocationData.RevocationReason}
                  </p>
                </div>
              )}
            </div>
          </div>
  
          {/* QHSSE Review Section - Only show if not QHSSE initiated
          {!isQHSSEInitiated && (
            <div className="border rounded-md p-3 border-red-100">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">QHSSE Review</span>
                </div>
                {revocationData.RevocationApprovedBy && (
                  <>
                    <div className="text-sm">
                      <span className="font-medium">Processed by: </span>
                      {revocationData.RevocationApprovedBy}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Date: </span>
                      {formatDate(revocationData.RevocationApprovedDate)}
                    </div>
                  </>
                )}
                {revocationData.RevocationComments && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Comments:</p>
                    <p className="bg-white p-2 rounded text-sm border border-red-100">
                      {revocationData.RevocationComments}
                    </p>
                  </div>
                )}
              </div>
  
              {showQAControls && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QHSSE Comments
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => {
                        setComments(e.target.value);
                        setError(null); // Clear error when user types
                      }}
                      placeholder="Add your comments regarding this revocation request..."
                      className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-red-100"
                      required
                    />
                    {error && (
                      <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                  </div>
  
                  <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    variant="outline"
                    className="border-white-300 text-red-800 bg-white-100 hover:bg-gray-200"
                    disabled={processing}
                    onClick={() => handleRevocationAction('Rejected')}
                  >
                    Reject Revocation
                  </Button>
                    <Button
                      variant="danger"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={processing}
                      onClick={() => handleRevocationAction('Approved')}
                    >
                      Approve Revocation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
             */}
        </div>
      </div>
    );
  };
  
  export default PermitRevocation;