import React, { useState, useEffect } from 'react';
import { useParams, useNavigate,useLocation } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { X, ArrowLeft, Check, Clock, AlertTriangle } from 'lucide-react';
import { api } from './services/api';
import { toast } from 'sonner';
import logo from './assets/mps_logo.jpg';
import PermitRevocation from './components/ui/Revocation';

const ReviewPTW = () => {
  const { permitToWorkId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [ptw, setPtw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [comments, setComments] = useState('');
  const [revocationData, setRevocationData] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  // Determine the return path - if coming from jobs monitoring, return there
  const returnPath = location.state?.from === 'jobs-monitoring' 
    ? '/dashboard/jobs-monitoring' 
    : '/dashboard/permits/permit-to-work';

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
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const userData = JSON.parse(savedData)?.user;
    if (userData) {
      setCurrentUserRole(userData.roleId === 'QA' ? 'QA' : userData.roleId);
    }
  }, []);

  const handleApproval = async (status) => {
    try {
      setIsApproving(true);
      const currentApproverStage = approvals.find(approval => approval.isCurrentApprover);
      
      if (!currentApproverStage) {
        toast.error('No approval stage is currently active');
        return;
      }
  
      const approvalData = {
        permitToWorkId: ptw.PermitToWorkID,
        status,
        comments,
        assignedTo: ptw.AssignedTo
      };
  
      await api.approvePermitToWork(ptw.PermitToWorkID, approvalData);
      
      toast.success(`Permit to Work ${status.toLowerCase()}d successfully`);
      navigate(returnPath);
      
    } catch (error) {
      console.error('Error in handleApproval:', error);
      toast.error(error.message || 'Failed to process approval');
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    const fetchPTWDetails = async () => {
      try {
        setLoading(true);
        // Change this to use getPermitToWorkById instead
        const response = await api.getPermitToWorkById(permitToWorkId);
        
        if (response.success && response.data?.permit) {
          setPtw({
            ...response.data.permit,
            jobPermit: response.data.jobPermit
          });
          
          // Set revocation data if available
          const permit = response.data.permit;
        if (permit.RevocationInitiatedBy || permit.Status === 'Revocation Pending' || permit.Status === 'Revoked') {
          setRevocationData({
            RevocationInitiatedBy: permit.RevocationInitiatedByName || `User ID: ${permit.RevocationInitiatedBy}`,
            RevocationInitiatedDate: permit.RevocationInitiatedDate,
            RevocationReason: permit.RevocationReason,
            RevocationApprovedBy: permit.RevocationApprovedByName,
            RevocationApprovedDate: permit.RevocationApprovedDate,
            RevocationComments: permit.RevocationComments,
            Status: permit.Status,
            InitiatorRole: permit.RevocationInitiatorRole,
            QHSSERevocationStatus: permit.QHSSERevocationStatus
          });
        }

          // Update workflow stages with proper isCurrentApprover logic
          const workflowStages = [
            {
              title: "Permit Issuer",
              status: response.data.permit.IssuerStatus || 'Pending',
              isCurrentApprover: response.data.permit.AssignedTo === 'ISS',
              approverName: response.data.permit.IssuerApproverName,
              approvedDate: response.data.permit.IssuerApprovedDate,
              comments: response.data.permit.IssuerComments,
              role: 'ISS'
            },
            {
              title: "Head of Department/Manager",
              status: response.data.permit.HODStatus || 'Pending',
              isCurrentApprover: response.data.permit.AssignedTo === 'HOD',
              approverName: response.data.permit.HODApproverName,
              approvedDate: response.data.permit.HODApprovedDate,
              comments: response.data.permit.HODComments,
              role: 'HOD'
            },
            {
              title: "QHSSE Approver",
              status: response.data.permit.QHSSEStatus || 'Pending',
              isCurrentApprover: response.data.permit.AssignedTo === 'QA',
              approverName: response.data.permit.QHSSEApproverName,
              approvedDate: response.data.permit.QHSSEApprovedDate,
              comments: response.data.permit.QHSSEComments,
              role: 'QA'
            }
          ];
          setApprovals(workflowStages);
        } else {
          setError('Failed to fetch PTW details');
        }
      } catch (err) {
        console.error('Error fetching PTW details:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (permitToWorkId) {
      fetchPTWDetails();
    }
  }, [permitToWorkId]);

  if (loading) return <div className="text-center">Loading PTW details...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!ptw) return <div className="text-center">No PTW details found</div>;

  const workersList = ptw.jobPermit.WorkersNames?.split(',').map(name => name.trim()) || [];

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
            <h2 className="text-xl font-semibold text-center flex-grow -ml-16">REVIEW PERMIT TO WORK</h2>
            <Button 
              variant="ghost" 
              onClick={() => navigate(returnPath)} 
              className="absolute top-2 right-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Job Permit Reference */}
          <Card className="shadow-sm">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        <span className="font-bold">PTW ID:</span> PTW-{String(ptw.PermitToWorkID).padStart(4, '0')}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-bold">Job Permit Document ID:</span> 
                        <Button 
                          variant="link" 
                          className="pl-1 text-blue-600 hover:underline"
                          onClick={() => navigate(`/dashboard/permits/view/${ptw.JobPermitID}`)}
                        >
                          JP-{String(ptw.JobPermitID).padStart(4, '0')}
                        </Button>
                      </p>
                    </div>
                    <div>
                    <p className="text-sm text-gray-500">
                        <span className="font-bold">Status:</span> {getStatusBadge(ptw.Status)}
                      </p>
                    </div>
                  </div>
                </CardContent>
          </Card>

          {/* Job Details */}
          <Card className="shadow-sm">
            <div className="font-bold px-4 py-1 text-sm border-b bg-gray-50">Job Details</div>
  
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="font-semibold text-sm">Permit Receiver:</p>
                    <p className="text-gray-700 text-sm">{ptw.jobPermit.PermitReceiver}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Contract Company:</p>
                    <p className="text-gray-700 text-sm">{ptw.jobPermit.ContractCompanyName}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Job Description:</p>
                    <p className="text-gray-700 text-sm">{ptw.jobPermit.JobDescription}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Location:</p>
                    <p className="text-gray-700 text-sm">{ptw.jobPermit.JobLocation}</p>
                    <p className="text-gray-700 text-sm">{ptw.jobPermit.SubLocation}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-sm">Workers:</p>
                    <div className="bg-gray-50 p-2 rounded-md">
                      {workersList.map((worker, index) => (
                        <p key={index} className="text-gray-700 text-sm py-0.5">{worker}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
          </Card>

          {/* Work Duration Details */}
          <Card className="shadow-sm">
            <div className="font-bold px-4 py-1 text-sm border-b bg-gray-50">Work Duration</div>
          
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-semibold">Entry Date:</p>
                    <p className="text-sm">{formatDate(ptw.EntryDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Exit Date:</p>
                    <p className="text-sm">{formatDate(ptw.ExitDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Work Duration:</p>
                    <p className="text-sm">{ptw.WorkDuration} days</p>
                  </div>
                </div>
              </CardContent>
          </Card>

          {revocationData && (
            <div className="mt-4">
              <PermitRevocation
                permitId={permitToWorkId}
                revocationData={revocationData}
                onRevocationProcessed={() => navigate(returnPath)}
                isQHSSEUser={currentUserRole === 'QA'}
                permitType="work"
              />
            </div>
          )}

          {/* Approval Workflow */}
          <Card>
          <CardHeader className="font-bold text-lg">Final Stage Approval</CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
              {approvals.map((approval, index) => (
                <div key={index} className="relative pl-10 pb-6">
                  <div 
                    className={`absolute left-0 rounded-full border-2 w-6 h-6 transition-all duration-300
                      ${approval.status === 'Approved' ? 'bg-green-500 border-green-500' : 
                        approval.status === 'Rejected' ? 'bg-red-500 border-red-500' :
                        approval.isCurrentApprover ? 'bg-blue-500 border-blue-500' : 
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

                    {/* Only show approval actions for current approver */}
                    {approval.isCurrentApprover && (
                      <div className="mt-4">
                        <div className="mb-4">
                          <label className="block text-sm text-gray-600 mb-2">
                            Approval Comments
                          </label>
                          <textarea 
                            className="w-full border rounded-md p-2"
                            rows="3"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Enter your comments here..."
                            disabled={isApproving}
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button 
                            variant="danger"
                            onClick={() => handleApproval('Rejected')}
                            disabled={isApproving}
                          >
                            {isApproving ? 'Rejecting...' : 'Reject'}
                          </Button>
                          <Button 
                            variant="success"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproval('Approved')}
                            disabled={isApproving}
                          >
                            {isApproving ? 'Approving...' : 'Approve'}
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
        </div>
      </div>
    </div>
  );
};

export default ReviewPTW;