import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { X, CheckSquare, Check, Clock, AlertTriangle } from 'lucide-react';
import { api } from './services/api';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import logo from './assets/mps_logo.jpg';

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

          const workflowStages = [
            {
              title: "Permit Issuer",
              status: permit.IssuerStatus || 'Pending',
              approverName: permit.IssuerApproverName,
              approvedDate: permit.IssuerApprovedDate,
              comments: permit.IssuerComments
            },
            {
              title: "Head of Department",
              status: permit.HODStatus || 'Pending',
              approverName: permit.HODApproverName,
              approvedDate: permit.HODApprovedDate,
              comments: permit.HODComments
            },
            {
              title: "QHSSE ",
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
          <h2 className="text-xl font-semibold text-center flex-grow">REQUEST FOR JOB PERMIT</h2>
          <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-2 right-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Job Details Section */}
          <div className="job-details mt-6">
            <h2 className="text-lg font-medium">Job Details</h2>
            <p><span className="font-semibold">Permit ID:</span> JP-{String(permit.JobPermitID).padStart(4, '0')}</p>
            <p><span className="font-semibold">Start Date:</span> {formatDate(permit.StartDate)}</p>
            <p><span className="font-semibold">End Date:</span> {formatDate(permit.EndDate)}</p>
          </div>

          {/* Job Location Section */}
          <div className="job-details mt-6">
            <h2 className="text-lg font-medium">Job Location</h2>
            <p><span className="font-semibold">Department:</span> {permit.Department}</p>
            <p><span className="font-semibold">Job Location:</span> {permit.JobLocation}</p>
            <p><span className="font-semibold">Sub Location:</span> {permit.SubLocation}</p>
            <p><span className="font-semibold">Location Detail:</span> {permit.LocationDetail}</p>
          </div>

          {/* Job Description Section */}
          <div className="job-description mt-6">
            <h2 className="text-lg font-medium">Job Description</h2>
            <p>{permit.JobDescription}</p>
          </div>

          {/* Workers Section */}
          <div className="workers mt-6">
            <h2 className="text-lg font-medium">Workers ({permit.NumberOfWorkers})</h2>
            <ul className="list-disc pl-6">
              {permit.WorkersNames?.split(',').map((worker, index) => (
                <li key={index}>{worker.trim()}</li>
              )) || <li>No workers assigned</li>}
            </ul>
          </div>

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

          {/* Approvals Section */}
          {/* Approval Workflow */}
          <Card>
            <CardHeader>Approval Workflow</CardHeader>
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