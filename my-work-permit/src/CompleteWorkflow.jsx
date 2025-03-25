import React, { useState } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Check, Clock, ClipboardCheck, CheckCircle2,AlertTriangle } from 'lucide-react';
import { api } from './services/api';
import { toast } from 'sonner';

const CompletionWorkflow = ({ 
  ptw, 
  currentUser, 
  onSubmitCompletion, 
  remarks, 
  setRemarks, 
  completionError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const getStatusBadge = (status) => {
    if (!status || status === 'Pending Completion') {
      return (
        <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          <Clock size={16} className="mr-1" />
          Pending
        </div>
      );
    }
    
    if (status === 'Completed') {
      return (
        <div className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-full text-sm">
          <Check size={16} className="mr-1" />
          Completed
        </div>
      );
    }
    
    return null;
  };

  const completionStages = [
    {
      title: "Permit Issuer Completion",
      status: ptw.IssuerCompletionStatus || 'In Progress',
      completer: ptw.IssuerCompleterName,
      completionDate: ptw.IssuerCompletionDate,
      isCurrentCompleter: currentUser?.roleId === 'ISS' && 
        (ptw.IssuerCompletionStatus === 'In Progress' || !ptw.IssuerCompletionStatus) &&
        ptw.Status === 'Approved'
    },
    {
      title: "QHSSE Final Completion",
      status: ptw.QHSSECompletionStatus || 'In Progress',
      completer: ptw.QHSSECompleterName,
      completionDate: ptw.QHSSECompletionDate,
      comments: ptw.QHSSECompletionComments,
      isCurrentCompleter: currentUser?.roleId === 'QA' && 
        ptw.CompletionStatus === 'Pending Completion' &&
        ptw.QHSSECompletionStatus === 'Pending'
    }
  ];

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

  const handleMarkAsCompleted = async () => {
    setIsSubmitting(true);
    try {
      const permitId = ptw.PermitToWorkID;
      
      const completionData = {
        stage: currentUser.roleId,
        remarks: currentUser.roleId === 'QA' ? remarks : undefined
      };
  
      const response = await api.completePermitToWork(permitId, completionData);
  
      if (response.success) {
        toast.success('Permit completed successfully');
        await onSubmitCompletion(completionData);
      }
    } catch (error) {
      // Extract error message
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error completing permit';
  
      // Show toast notification
      toast.error(errorMessage);
      
      // Call onSubmitCompletion with the error
      if (onSubmitCompletion) {
        onSubmitCompletion({ error: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const canCompleteActions = ['ISS', 'QA'].includes(currentUser?.roleId);
  
  const openConfirmationDialog = () => {
    setShowConfirmation(true);
  };

  return (
    <Card className="mt-4">
      <div className="bg-gray-50 px-4 py-2 border-b flex justify-center items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-green-600" />
          JOB COMPLETION
        </h3>
      </div>
      {canCompleteActions && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium mb-2">Before completing this job, please ensure:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              All work activities have been completed according to the permit requirements
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              Work area has been cleaned and restored to a safe condition
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              All tools and equipment have been removed from the work site
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              All workers have safely exited the work area
            </li>
          </ul>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
          {completionError && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="block sm:inline">{completionError}</span>
                </div>
              </div>
            </div>
          )}
          {completionStages.map((stage, index) => (
            <div key={index} className="relative pl-10 pb-6">
              <div 
                className={`absolute left-0 rounded-full border-2 w-6 h-6 transition-all duration-300
                  ${stage.status === 'Completed' ? 'bg-green-500 border-green-500' : 
                    stage.isCurrentCompleter ? 'bg-blue-500 border-blue-500' : 
                    'bg-gray-200 border-gray-300'}`}
              />
              
              <div className="border rounded-md p-4">
                <div className="mb-4">
                  <h4 className="font-medium text-lg mb-2">{stage.title}</h4>
                  {getStatusBadge(stage.status)}
                </div>

                <div className="text-sm">
                  {(stage.title === "QHSSE Final Completion" || stage.status === 'Completed') && (
                    <p className="text-gray-600">
                      Completed By: {stage.completer || 'Not yet completed'}
                    </p>
                  )}
                  {stage.completionDate && (
                    <p className="text-gray-600">
                      Date: {formatDate(stage.completionDate)}
                    </p>
                  )}
                  {stage.comments && (
                    <div className="mt-2">
                      <p className="text-gray-600">Comments:</p>
                      <p className="bg-gray-50 p-2 rounded mt-1">{stage.comments}</p>
                    </div>
                  )}
                </div>

                {stage.isCurrentCompleter && canCompleteActions && (
                  <div className="mt-4">
                    {currentUser?.roleId === 'QA' && (
                      <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-2">
                          Completion Comments
                        </label>
                        <textarea 
                          className="w-full border rounded-md p-2"
                          rows="3"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Enter final completion comments..."
                        />
                        {completionError && (
                          <p className="text-sm text-red-500 mt-2">{completionError}</p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button 
                        onClick={openConfirmationDialog}
                        variant="success"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isSubmitting || (currentUser?.roleId === 'QA' && !remarks)}
                      >
                        Mark as Completed
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-3">Confirm Completion</h3>
              <p className="mb-4 text-gray-700">
                Are you sure you want to mark this permit as completed? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline"
                  className="border-gray-400 text-gray-700 bg-white hover:bg-gray-200"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="success"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={handleMarkAsCompleted}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Completion'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default CompletionWorkflow;