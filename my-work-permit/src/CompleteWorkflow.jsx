import React, { useState } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Check, Clock, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { api } from './services/api';

const CompletionWorkflow = ({ 
    ptw, 
    currentUser, 
    onSubmitCompletion, 
    remarks, 
    setRemarks, 
    completionError,
  }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
  
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
        title: "Issuer Completion",
        status: ptw.IssuerCompletionStatus || 'Pending Completion',
        completer: ptw.IssuerCompleterName,
        completionDate: ptw.IssuerCompletionDate,
        isCurrentCompleter: currentUser?.roleId === 'ISS' && 
          (ptw.IssuerCompletionStatus === 'Pending Completion' || !ptw.IssuerCompletionStatus) &&
          ptw.Status === 'Approved'
      },
      {
        title: "QHSSE Final Completion",
        status: ptw.QHSSECompletionStatus || 'Pending Completion',
        completer: ptw.QHSSECompleterName,
        completionDate: ptw.QHSSECompletionDate,
        comments: ptw.QHSSECompletionComments,
        isCurrentCompleter: currentUser?.roleId === 'QA' && 
          ptw.IssuerCompletionStatus === 'Completed' &&
          (ptw.QHSSECompletionStatus === 'Pending Completion' || !ptw.QHSSECompletionStatus)
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
            await onSubmitCompletion(completionData);
          } else {
            console.error('Failed to complete permit:', response.message);
          }
        } catch (error) {
          console.error('Error completing permit:', error);
        } finally {
          setIsSubmitting(false);
        }
      };

    const canCompleteActions = ['ISS', 'QA'].includes(currentUser?.roleId);
  
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
                          onClick={handleMarkAsCompleted}
                          variant='success'
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={isSubmitting || (currentUser?.roleId === 'QA' && !remarks)}
                        >
                          {isSubmitting ? 'Submitting...' : 'Mark as Completed'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  export default CompletionWorkflow;