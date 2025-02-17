import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { X, ArrowLeft, Check, Clock, AlertTriangle, CheckSquare } from 'lucide-react';
import { api } from './services/api';
import { toast } from 'sonner';
import logo from './assets/mps_logo.jpg';
import RiskAssessmentViewer from './components/ui/RiskAssessmentDocumentViewer';
import PermitRevocation from './components/ui/Revocation';

const sectionNameMapping = {
  'Permit Required': 'Permit Required',
  'Hazard Identification': 'Hazard Identification',
  'Job Requirements': 'Job Requirements',
  'PPE Requirements': 'PPE Requirements',
  'Precautionary Measures': 'Precautionary Measures',
  'Precautions': 'Precautions',
  'Hazardous Energies': 'Hazardous Energies',
  'AC Voltage': 'AC Voltage',
  'DC Voltage': 'DC Voltage',
  'Break Preparation': 'Break Preparation'
};

const PermitReview = () => {
  const { permitId } = useParams();
  const navigate = useNavigate();
  const [permit, setPermit] = useState(null);
  const [groupedCheckboxes, setGroupedCheckboxes] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState('');
  const [revocationData, setRevocationData] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const handleRevocationProcessed = () => {
    // Refresh permit data or navigate away
    navigate('/dashboard/permits/job-permits');
  };

  // Fetch current user role from local storage
  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const userData = JSON.parse(savedData)?.user;
    if (userData) {
      // Compare directly with 'QA' instead of checking roleId
      setCurrentUserRole(userData.roleId === 'QA' ? 'QA' : userData.roleId);
    }
  }, []);

  useEffect(() => {
    const fetchPermitDetails = async () => {
      try {
        setLoading(true);
        
        const permitResponse = await api.getPermitById(permitId);
        if (permitResponse?.success) {
          const { permit, groupedCheckboxes } = permitResponse.data;
          setPermit(permit);
          setGroupedCheckboxes(groupedCheckboxes);

          if (permit.RevocationInitiatedBy || permit.Status === 'Revocation Pending' || permit.Status === "Revoked") {
            setRevocationData({
              RevocationInitiatedBy: permit.RevocationInitiatedByName || `User ID: ${permit.RevocationInitiatedBy}`,
              RevocationInitiatedDate: permit.RevocationInitiatedDate,
              RevocationReason: permit.RevocationReason,
              RevocationApprovedBy: permit.RevocationApprovedByName,
              RevocationApprovedDate: permit.RevocationApprovedDate,
              RevocationComments: permit.RevocationComments,
              Status: permit.Status,
              QHSSERevocationStatus: permit.QHSSERevocationStatus // Add this field
            });
          }

          // Updated workflow stages with approver details
          const workflowStages = [
            {
              title: "Permit Issuer",
              status: permit.IssuerStatus || 'Pending',
              isCurrentApprover: permit.AssignedTo === 'ISS',
              approverName: permit.IssuerApproverName,
              approvedDate: permit.IssuerApprovedDate,
              comments: permit.IssuerComments
            },
            {
              title: "Head of Department / Manager",
              status: permit.HODStatus || 'Pending',
              isCurrentApprover: permit.AssignedTo === 'HOD',
              approverName: permit.HODApproverName,
              approvedDate: permit.HODApprovedDate,
              comments: permit.HODComments
            },
            {
              title: "QHSSE Approver",
              status: permit.QHSSEStatus || 'Pending',
              isCurrentApprover: permit.AssignedTo === 'QA',
              approverName: permit.QHSSEApproverName,
              approvedDate: permit.QHSSEApprovedDate,
              comments: permit.QHSSEComments
            }
          ];

          setApprovals(workflowStages);
        } else {
          setError(permitResponse?.error || 'Failed to fetch permit details');
        }
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPermitDetails();
  }, [permitId]);

  const handleApproval = async (status) => {
    try {
      const currentApproverStage = approvals.find(approval => approval.isCurrentApprover);
      
      if (!currentApproverStage) {
        toast.error('No approval stage is currently active');
        return;
      }

      const response = await api.approvePermit({
        jobPermitId: parseInt(permitId),
        status,
        comments
      });

      toast.success(`Permit ${status.toLowerCase()}d successfully`);
      navigate('/dashboard/permits/job-permits');
    } catch (error) {
      toast.error(error.message || 'Failed to process approval');
    }
  };

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

  if (loading) return <div className="text-center">Loading permit details...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!permit) return <div className="text-center">No permit details found</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader className="flex justify-between items-center border-b p-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/permits/job-permits')} 
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Back
          </Button>
          <h2 className="text-xl font-semibold text-center flex-grow">JOB PERMIT REVIEW</h2>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/permits/job-permits')} 
            className="hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Permit Overview Section */}
          <div className="grid grid-cols-2 gap-6 items-start">
                  <div>
                    <h2 className="font-bold text-l border-b pb-2 mb-3">Job Details</h2>
                    <p className="text-base text-gray-700"><span className="font-bold">Job Permit Document ID:</span> JP-{String(permit.JobPermitID).padStart(4, '0')}</p>
                    <p className="text-base text-gray-700"><span className="font-bold">Start Date:</span> {formatDate(permit.StartDate)}</p>
                    <p className="text-base text-gray-700"><span className="font-bold">End Date:</span> {formatDate(permit.EndDate)}</p>
                  </div>
                  <div>
                    <h2 className="font-bold text-l border-b pb-2 mb-3">Job Location</h2>
                    <p className="text-base text-gray-700"><span className="font-bold">Department:</span> {permit.Department}</p>
                    <p className="text-base text-gray-700"><span className="font-bold">Job Location:</span> {permit.JobLocation}</p>
                    <p className="text-base text-gray-700"><span className="font-bold">Sub Location:</span> {permit.SubLocation}</p>
                    <p className="text-base text-gray-700"><span className="font-bold">Location Detail:</span> {permit.LocationDetail}</p>
                  </div>
                </div>

          {/* Job Description */}
         <Card className="shadow-sm">
              <div className="font-bold px-4 py-1 text-sm border-b bg-gray-50 mt-1">Job Description</div>
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">{permit.JobDescription}</p>
              </CardContent>
            </Card>

          {/* Workers List Card */}
          <Card className="shadow-sm">
              <div className="font-bold px-4 py-1 text-sm border-b bg-gray-50">Workers ({permit.NumberOfWorkers})</div>
              <CardContent className="p-4">
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  {permit.WorkersNames?.split(',').map((worker, index) => (
                    <li key={index}>{worker.trim()}</li>
                  )) || <li>No workers assigned</li>}
                </ul>
              </CardContent>
            </Card>

          {/* Risk Assessment Document */}
          {permit.RiskAssessmentDocument && (
            <div className="mt-6">
              <h2 className="text-lg font-medium">Risk Assessment Documents</h2>
              <RiskAssessmentViewer 
                documentData={permit.RiskAssessmentDocument} 
              />
            </div>
          )}

          {/* Safety Checklist */}
          {/* Safety Checklist Card */}
                    <Card>
                      <CardHeader className="font-bold text-lg">Safety Checklist</CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {groupedCheckboxes.map((section) => (
                            <div key={section.sectionId} className="space-y-2">
                              <h3 className="font-medium text-base border-b pb-2">
                                {sectionNameMapping[section.sectionName] || section.sectionName}
                              </h3>
                              <div className="space-y-2 pl-4">
                                {section.items.map((item) => (
                                  <div key={item.sectionItemId} className="flex items-start gap-2">
                                    <div className="mt-1">
                                      <CheckSquare className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p>{item.itemLabel}</p>
                                      {item.textInput && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          Additional Info: {item.textInput}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="mt-4"> {/* Adjust margin-top as needed */}
                    <PermitRevocation
                      permitId={permitId}
                      revocationData={revocationData}
                      onRevocationProcessed={() => navigate('/dashboard/permits/job-permits')}
                      isQHSSEUser={currentUserRole === 'QA'}
                    />
                  </div>

          {/* Approval Workflow */}
          <div className="mt-6">
  <h3 className="text-lg font-semibold mb-4">Permit Documentation Approvals</h3>
  <div className="relative">
    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
    {approvals.map((approval, index) => (
      <div key={index} className="relative pl-10 pb-6">
        <div 
          className={`absolute left-0 rounded-full border-2 w-5 h-5 transition-all duration-300
            ${approval.status === 'Approved' ? 'bg-green-500 border-green-500' : 
              approval.status === 'Rejected' ? 'bg-red-500 border-red-500' :
              approval.isCurrentApprover ? 'bg-blue-500 border-blue-500' : 
              'bg-gray-200 border-gray-300'}`}
        />
        <div className="border rounded-md p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            {/* Left column: Title and Status */}
            <div>
              <h4 className="font-medium text-base mb-1">{approval.title}</h4>
              {getStatusBadge(approval.status)}
            </div>
            
            {/* Right column: Approver and Date */}
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-medium">Approver:</span> {approval.approverName || 'Not yet approved'}
              </p>
              {approval.approvedDate && (
                <p>
                  <span className="font-medium">Date:</span> {formatDate(approval.approvedDate)}
                </p>
              )}
            </div>
          </div>
          
          {/* Comments section below both columns */}
          {approval.comments && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Comments:</span>
              </p>
              <p className="bg-gray-50 p-2 rounded text-sm">{approval.comments}</p>
            </div>
          )}

          {/* Approval actions for current approver */}
          {approval.isCurrentApprover && (
            <>
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-2">
                  Approval Comments
                </label>
                <textarea 
                  className="w-full border rounded-md p-2"
                  rows="3"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter your comments here..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button 
                  variant="danger" 
                  onClick={() => handleApproval('Rejected')}
                >
                  Reject
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => handleApproval('Approved')}
                >
                  Approve
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermitReview;