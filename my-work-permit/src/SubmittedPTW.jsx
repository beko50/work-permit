import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { X, Check, Clock, AlertTriangle } from 'lucide-react';
import { api } from './services/api';
import logo from './assets/mps_logo.jpg';

const SubmittedPTW = () => {
  const { ptwId } = useParams();
  const navigate = useNavigate();
  const [ptw, setPtw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvals, setApprovals] = useState([]);

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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-full text-sm">
            <Check size={16} className="mr-1" />
            Approved
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <Clock size={16} className="mr-1" />
            Pending
          </div>
        );
      case 'rejected':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-full text-sm">
            <AlertTriangle size={16} className="mr-1" />
            Rejected
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchPTWDetails = async () => {
      try {
        setLoading(true);
        const response = await api.getPermitToWorkById(ptwId);

        if (response.success) {
          setPtw(response.data.permit);
          
          // Set up approval workflow stages
          const workflowStages = [
            {
              title: "Permit Issuer",
              status: response.data.permit.IssuerStatus || 'Pending',
              approverName: response.data.permit.IssuerApproverName,
              approvedDate: response.data.permit.IssuerApprovedDate,
              comments: response.data.permit.IssuerComments
            },
            {
              title: "Head of Department",
              status: response.data.permit.HODStatus || 'Pending',
              approverName: response.data.permit.HODApproverName,
              approvedDate: response.data.permit.HODApprovedDate,
              comments: response.data.permit.HODComments
            },
            {
              title: "QHSSE",
              status: response.data.permit.QHSSEStatus || 'Pending',
              approverName: response.data.permit.QHSSEApproverName,
              approvedDate: response.data.permit.QHSSEApprovedDate,
              comments: response.data.permit.QHSSEComments
            }
          ];
          setApprovals(workflowStages);
        } else {
          setError(response.error || 'Failed to fetch PTW details');
        }
      } catch (err) {
        console.error('Error fetching PTW details:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPTWDetails();
  }, [ptwId]);

  if (loading) return <div className="text-center">Loading PTW details...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!ptw) return <div className="text-center">No PTW details found</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 border-b pb-2 pt-2">
          <div className="flex items-center">
            <div className="ml-8">
              <img 
                src={logo}
                alt="Company Logo" 
                className="h-[80px] w-[80px]" 
              />
            </div>
            <h2 className="text-xl font-semibold text-center flex-grow">PERMIT TO WORK DETAILS</h2>
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="absolute top-2 right-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Job Permit Reference */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">PTW ID: PTW-{String(ptw.PermitToWorkID).padStart(4, '0')}</p>
                  <p className="text-sm text-gray-500">Job Permit ID: JP-{String(ptw.JobPermitID).padStart(4, '0')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status: {getStatusBadge(ptw.Status)}</p>
                  <p className="text-sm text-gray-500">Created: {formatDate(ptw.CreatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Duration Details */}
          <Card>
            <CardHeader className="font-bold text-lg">Work Duration</CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Entry Date:</p>
                  <p>{new Date(ptw.EntryDate).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="font-semibold">Exit Date:</p>
                  <p>{new Date(ptw.ExitDate).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="font-semibold">Work Duration:</p>
                  <p>{ptw.WorkDuration} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Workflow */}
          <Card>
            <CardHeader className="font-bold text-lg">Approval Workflow</CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                {approvals.map((approval, index) => (
                  <div key={index} className="relative pl-10 pb-6">
                    <div 
                      className={`absolute left-0 rounded-full border-2 w-6 h-6 transition-all duration-300
                        ${approval.status === 'Approved' ? 'bg-green-500 border-green-500' : 
                          approval.status === 'Rejected' ? 'bg-red-500 border-red-500' :
                          'bg-gray-200 border-gray-300'}`}
                    />
                    <div className="border rounded-md p-4">
                      <div className="mb-4">
                        <h4 className="font-medium text-lg mb-2">{approval.title}</h4>
                        {getStatusBadge(approval.status)}
                      </div>

                      <div className="text-sm">
                        <p className="text-gray-600">
                          Approver: {approval.approverName || 'Not yet approved'}
                        </p>
                        {approval.approvedDate && (
                          <p className="text-gray-600">
                            Date: {formatDate(approval.approvedDate)}
                          </p>
                        )}
                        {approval.comments && (
                          <div className="mt-2">
                            <p className="text-gray-600">Comments:</p>
                            <p className="bg-gray-50 p-2 rounded mt-1">{approval.comments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Print Button */}
          <div className="flex justify-end mt-6 pb-4">
            <Button 
              onClick={() => window.print()}
              variant="secondary"
              className="bg-gray-600 text-white hover:bg-gray-700"
            >
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmittedPTW;