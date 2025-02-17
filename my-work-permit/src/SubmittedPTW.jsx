import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { X, Check, Clock, AlertTriangle,Eye } from 'lucide-react';
import { api } from './services/api';
import logo from './assets/mps_logo.jpg';
import PermitRevocation from './components/ui/Revocation';

const SubmittedPTW = () => {
  const { permitToWorkId } = useParams();
  const navigate = useNavigate();
  const [ptw, setPtw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [revocationData, setRevocationData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

  const formatDate = (dateString, dateOnly = false) => {
    if (!dateString) return '';
    return dateOnly 
      ? new Date(dateString).toLocaleDateString('en-GB')
      : new Date(dateString).toLocaleString('en-GB', {
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
      case 'revoked':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-gray-700 text-white rounded-full text-sm">
            <X size={16} className="mr-1" />
            Revoked
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
        const response = await api.getPermitToWorkById(permitToWorkId);

        if (response.success && response.data?.permit) {
          setPtw({
            ...response.data.permit,
            jobPermit: response.data.jobPermit
          });

          // Check if revocation data exists
          if (response.data.permit.RevocationInitiatedBy || 
            response.data.permit.Status === 'Revocation Pending' || 
            response.data.permit.Status === 'Revoked') {
          setRevocationData({
            RevocationInitiatedBy: response.data.permit.RevocationInitiatedByName || 
                                  `User ID: ${response.data.permit.RevocationInitiatedBy}`,
            RevocationInitiatedDate: response.data.permit.RevocationInitiatedDate,
            RevocationReason: response.data.permit.RevocationReason,
            RevocationApprovedBy: response.data.permit.RevocationApprovedByName,
            RevocationApprovedDate: response.data.permit.RevocationApprovedDate,
            RevocationComments: response.data.permit.RevocationComments,
            Status: response.data.permit.Status
          });
        }

          const workflowStages = [
            {
              title: "Permit Issuer",
              status: response.data.permit.IssuerStatus || 'Pending',
              approverName: response.data.permit.IssuerApproverName,
              approvedDate: response.data.permit.IssuerApprovedDate,
              comments: response.data.permit.IssuerComments
            },
            {
              title: "Head of Department / Manager",
              status: response.data.permit.HODStatus || 'Pending',
              approverName: response.data.permit.HODApproverName,
              approvedDate: response.data.permit.HODApprovedDate,
              comments: response.data.permit.HODComments
            },
            {
              title: "QHSSE Approver",
              status: response.data.permit.QHSSEStatus || 'Pending',
              approverName: response.data.permit.QHSSEApproverName,
              approvedDate: response.data.permit.QHSSEApprovedDate,
              comments: response.data.permit.QHSSEComments
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

  const isFullyApproved = approvals.every(approval => approval.status === 'Approved');
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
            <h2 className="text-xl font-semibold text-center flex-grow -ml-16">ISSUANCE OF PERMIT TO WORK</h2>
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="absolute top-2 right-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
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
            <PermitRevocation 
              permitId={permitToWorkId}
              revocationData={revocationData}
              onRevocationProcessed={() => {
                // Refresh the PTW details after revocation is processed
                fetchPTWDetails();
              }}
              isQHSSEUser={currentUser?.roleId === 'QA'} // Pass the current user's role
            />
          )}

          <Card className="shadow-sm">
            <div className="font-bold px-4 py-1 text-sm border-b bg-gray-50">Approval Status</div>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2">Approver</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Approved By</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map((approval, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{approval.title}</td>
                        <td className="p-2">{approval.status}</td>
                        <td className="p-2">{approval.approverName || '-'}</td>
                        <td className="p-2">{approval.approvedDate ? formatDate(approval.approvedDate, true) : '-'}</td>
                        <td className="p-2">{approval.comments || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {isFullyApproved && (
            <div className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
              This permit has been reviewed and approved by the necessary parties to proceed with the job described at 
              <span className="font-bold"> {ptw.jobPermit.JobLocation}</span>,  
              <span className="font-bold"> {ptw.jobPermit.SubLocation}</span> from 
              <span className="font-bold"> {formatDate(ptw.EntryDate)}</span> to 
              <span className="font-bold"> {formatDate(ptw.ExitDate)}</span>. 
              All appropriate safety measures and precautions must be followed throughout the duration of work.
            </div>
          )}

          <div className="flex justify-end mt-4 gap-4">
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