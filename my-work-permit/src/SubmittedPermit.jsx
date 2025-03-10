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
  /* Previous print styles remain the same */
  body * {
    visibility: hidden;
  }
  
  .permit-content, .permit-content * {
    visibility: visible;
  }
  
  .permit-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  /* Force grid layout to maintain during print */
  .md\\:grid-cols-2 {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 1rem !important;
  }

  /* Ensure text alignment stays correct */
  .text-gray-600 {
    text-align: right !important;
  }

  /* Comments specific styling */
  /* This is the key fix - it forces comments to appear below by changing the layout structure */
  .mt-2, p:has(span:contains("Comments")) {
    display: block !important;
    grid-column: 1 !important;
    text-align: left !important;
    margin-top: 8px !important;
  }
  
  p:has(span:contains("Comments")) + p {
    grid-column: 1 !important;
    text-align: left !important;
    margin-top: 4px !important;
  }

  /* Hide approval circles and connecting line */
  .absolute.left-3.top-0.bottom-0.w-0\\.5 {
    display: none !important;
  }

  /* Hide the circle indicators */
  .absolute.left-0.rounded-full {
    display: none !important;
  }

  /* Remove the left padding since we're hiding the circles */
  .relative.pl-10 {
    padding-left: 0 !important;
  }

  /* Make approval status bold - targeting the status badge returned by getStatusBadge function */
  .inline-flex.items-center.px-2.py-1.text-xs.rounded {
    font-weight: 900 !important;
    padding: 4px 8px !important;
    border: 1.5px solid currentColor !important;
  }
  
  /* Specifically target the status text inside badges */
  .inline-flex.items-center.px-2.py-1.text-xs.rounded span {
    font-weight: 900 !important;
  }

  /* Other existing print styles remain the same */
  .inline-flex {
    display: inline-flex !important;
  }

  .p-3 {
    padding: 0.75rem !important;
  }

  .mb-2 {
    margin-bottom: 0.5rem !important;
  }

  .no-print {
    display: none !important;
  }

  .border {
    border: 1px solid #ddd !important;
  }

  .rounded-md {
    border-radius: 0.375rem !important;
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
  const [documents, setDocuments] = useState([]);

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

  const PrintButton = () => (
    <div className="flex justify-end gap-2 mb-6 no-print">
      <Button 
        onClick={() => window.print()}
        variant="outline"
        className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-2 transition-all duration-200 hover:shadow-md"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" 
          />
        </svg>
        Print Document
      </Button>
    </div>
  );

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

        if (response?.success) {
          const { permit, documents, groupedCheckboxes } = response.data;
          setPermit(permit);
          setDocuments(documents || []);
          setGroupedCheckboxes(groupedCheckboxes || []);

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
        <div className="permit-content container mx-auto p-4 max-w-6xl">           
        <PrintButton />
            {/* Header */}
            <div className="bg-white border-b pb-2 pt-2 flex items-center mb-4">
            <div className="ml-8">
              <img 
                src={logo}
                alt="Company Logo" 
                className="h-[80px] w-[80px]" 
              />
            </div>
            <h2 className="text-xl font-semibold text-center flex-grow -ml-16">REQUEST FOR JOB PERMIT</h2>
            <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-2 right-2 hover:bg-gray-100 no-print">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Job Details & Location */}
            <Card className="shadow-sm">
              <CardHeader className="font-bold text-lg">Job Details & Location</CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-6 items-start">
                  <div>
                    <h3 className="font-medium text-sm border-b pb-1 mb-3">Job Details</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Job Permit Document ID:</span> JP-{String(permit.JobPermitID).padStart(4, '0')}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Start Date:</span> {formatDate(permit.StartDate)}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">End Date:</span> {formatDate(permit.EndDate)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm border-b pb-1 mb-3">Job Location</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Department:</span> {permit.Department}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Job Location:</span> {permit.JobLocation}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Sub Location:</span> {permit.SubLocation}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Location Detail:</span> {permit.LocationDetail}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

           {/* Job Description */}
            <div className="mb-4">
              <div className="font-bold px-4 py-1 text-sm border-b bg-gray-50">Job Description</div>
              <div className="p-4">
                <p className="text-sm text-gray-700">{permit.JobDescription}</p>
              </div>
            </div>
              
            {/* Workers List */}
            <div className="mb-4">
              <div className="font-bold px-4 py-1 text-sm border-b bg-gray-50">Workers ({permit.NumberOfWorkers})</div>
              <div className="p-4">
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  {permit.WorkersNames?.split(',').map((worker, index) => (
                    <li key={index}>{worker.trim()}</li>
                  )) || <li>No workers assigned</li>}
                </ul>
              </div>
            </div>

            {/* Risk Assessment Document */}
            {documents && documents.length > 0 && (
              <div className="mt-6 ml-4 no-print"> {/* Exclude from printing */}
                <h2 className="text-lg font-medium">Risk Assessment Documents</h2>
                <RiskAssessmentViewer documents={documents} />
              </div>
            )}

            {/* Safety Checklist - Optimized for first page */}
          <Card className="shadow-sm print-card">
            <CardHeader className="font-bold text-lg">Safety Checklist</CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 gap-4">
  {groupedCheckboxes.map((section) => (
    <div key={section.sectionId} className="space-y-1">
      <h3 className="font-medium text-sm border-b pb-1">
        {sectionNameMapping[section.sectionName] || section.sectionName}
      </h3>
      <div className="space-y-1">
        {section.items.map((item) => (
          <div key={item.sectionItemId} className="flex items-start gap-1 text-sm">
            <CheckSquare className="h-3 w-3 text-green-600 mt-1" />
            <span className="text-gray-700">
              {item.itemLabel}
              {/* Add the text input if it exists */}
              {item.textInput && (
                <span className="ml-1 text-gray-600">
                  : {item.textInput}
                </span>
              )}
            </span>
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
                       <div className="relative mb-4">
                         {/* Title and status */}
                         <div className="mb-1">
                           <h4 className="font-medium text-base">{approval.title}</h4>
                           {getStatusBadge(approval.status)}
                         </div>
                        
                         {/* Approver and date positioned absolutely */}
                         <div className="absolute text-sm" style={{ top: 0, right: '27%' }}>
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
                         
                       {/* Comments section after a divider */}
                       {approval.comments && (
                         <div className="border-t pt-2 mt-2">
                           <p className="text-sm mb-1">
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
          </div>  
      </div>    
    </>
  );
};

export default SubmittedPermit;