import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { X, CheckSquare, Check, Clock, AlertTriangle } from 'lucide-react';
import { api } from './services/api';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
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

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-section, .print-section * {
      visibility: visible;
    }
    .print-section {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
    .page-break {
      page-break-before: always;
    }
  }
`;

const SubmittedPermit = () => {
  const { permitId } = useParams();
  const navigate = useNavigate();
  const [permit, setPermit] = useState(null);
  const [groupedCheckboxes, setGroupedCheckboxes] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revocationData, setRevocationData] = useState(null);

  const handlePrint = () => {
    window.print();
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

  useEffect(() => {
    const fetchPermitDetails = async () => {
      try {
        setLoading(true);
        const response = await api.getPermitById(permitId);

        if (response.success) {
          const { permit, groupedCheckboxes } = response.data;
          setPermit(permit);
          setGroupedCheckboxes(groupedCheckboxes);

          if (permit.RevocationInitiatedBy || permit.Status === 'Revocation Pending' || permit.Status === "Revoked") {
            setRevocationData({
              RevocationInitiatedBy: permit.RevocationInitiatedByName || `User ID: ${permit.RevocationInitiatedBy}`,
              RevocationInitiatedDate: permit.RevocationInitiatedDate,
              RevocationReason: permit.RevocationReason,
              RevocationApprovedBy: permit.RevocationApprovedByName,
              RevocationApprovedDate: permit.RevocationApprovedDate,
              RevocationComments: permit.RevocationComments
            });
          }

          const workflowStages = [
            {
              title: "Permit Issuer",
              status: permit.IssuerStatus || 'Pending',
              approverName: permit.IssuerApproverName,
              approvedDate: permit.IssuerApprovedDate,
              comments: permit.IssuerComments
            },
            {
              title: "Head of Department/Manager",
              status: permit.HODStatus || 'Pending',
              approverName: permit.HODApproverName,
              approvedDate: permit.HODApprovedDate,
              comments: permit.HODComments
            },
            {
              title: "QHSSE Approver",
              status: permit.QHSSEStatus || 'Pending',
              approverName: permit.QHSSEApproverName,
              approvedDate: permit.QHSSEApprovedDate,
              comments: permit.QHSSEComments
            }
          ];

          setApprovals(workflowStages);
        } else {
          setError(response.error || 'Failed to fetch permit details');
        }
      } catch (err) {
        console.error('Error fetching permit details:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPermitDetails();
  }, [permitId]);

  if (loading) return <div className="text-center">Loading permit details...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!permit) return <div className="text-center">No permit details found</div>;

  return (
    <>
      <style>{printStyles}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-10 border-b pb-2 pt-2 flex items-center">
            <div className="ml-8">
              <img 
                src={logo}
                alt="Company Logo" 
                className="h-[80px] w-[80px]" 
              />
            </div>
            <h2 className="text-xl font-semibold text-center flex-grow -ml-16">REQUEST FOR JOB PERMIT</h2>
            <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-2 right-2 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Job Details & Location */}
            <Card className="shadow-sm">
              <CardContent className="p-5">
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
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="shadow-sm">
              <div className="font-bold px-4 py-1 text-sm border-b bg-gray-50">Job Description</div>
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">{permit.JobDescription}</p>
              </CardContent>
            </Card>

            {/* Workers List */}
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

            {/* Revocation Section */}
            {revocationData && (
              <PermitRevocation revocationData={revocationData} />
            )}

            {/* Approvals Section */}
            <Card>
              <CardHeader className="font-bold text-l">Permit Documentation Approvals</CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                  {approvals.map((approval, index) => (
                    <div key={index} className="relative pl-10 pb-4">
                      <div 
                        className={`absolute left-0 rounded-full border-2 w-5 h-5 transition-all duration-300
                          ${approval.status === 'Approved' ? 'bg-green-500 border-green-500' : 
                            approval.status === 'Rejected' ? 'bg-red-500 border-red-500' :
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Print Button */}
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handlePrint}
                variant="secondary"
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubmittedPermit;