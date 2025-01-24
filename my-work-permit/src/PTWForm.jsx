import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import logo from './assets/mps_logo.jpg';
import { X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const PermitToWorkForm = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const componentRef = React.useRef(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // Filled data for the Permit to Work Form
  const permitData = {
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    jobLocation: 'MPS Power Plant, Maintenance Area',
    jobDescription: 'Electrical System Preventive Maintenance and Inspection',
    permitRecipient: {
      name: 'Michael Osei',
      company: 'Power Solutions Ghana Ltd'
    },
    workers: [
      'Emmanuel Mensah',
      'Daniel Kwarteng',
      'Samuel Addo',
      'Peter Nkrumah'
    ],
    approvals: [
      {
        approver: 'Permit Issuer',
        approved: true,
        approvedBy: 'Richard Mensah',
        approvedDate: '2024-03-10'
      },
      {
        approver: 'HOD',
        approved: true,
        approvedBy: 'John Boateng',
        approvedDate: '2024-03-11'
      },
      {
        approver: 'QHSSE',
        approved: true,
        approvedBy: 'Elizabeth Owusu',
        approvedDate: '2024-03-12'
      }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Card className="w-full max-w-4xl bg-white relative">
      <CardHeader className="sticky top-0 z-50 border-b pb-2 pt-2 flex items-center bg-white">
          <img 
            src={logo}
            alt="Company Logo" 
            className="h-[80px] w-[80px]" 
          />
          <h1 className="text-xl font-semibold flex-grow text-center">
            PERMIT TO WORK
          </h1>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-2 right-2 z-60 transition-transform duration-300 hover:scale-110 group"
          >
            <X className="h-5 w-5 group-hover:h-6 group-hover:w-6 transition-all duration-300" />
          </Button>
        </CardHeader>
        
        <CardContent ref={componentRef} className="overflow-y-auto flex-grow">
          {/* Job Details Section */}
          <div className="job-details mt-6">
            <h2 className="text-lg font-medium">Job Details</h2>
            <p>Start Date: {permitData.startDate}</p>
            <p>End Date: {permitData.endDate}</p>
            <p>Job Location: {permitData.jobLocation}</p>
            <p>Job Description: {permitData.jobDescription}</p>
          </div>

          {/* Permit Recipient Section */}
          <div className="permit-recipient mt-6">
            <h2 className="text-lg font-medium">Permit Recipient</h2>
            <p>Name: {permitData.permitRecipient.name}</p>
            <p>Company: {permitData.permitRecipient.company}</p>
          </div>

          {/* Workers Section */}
          <div className="workers mt-6">
            <h2 className="text-lg font-medium">Workers</h2>
            <ul>
              {permitData.workers.map((worker, index) => (
                <li key={index}>{worker}</li>
              ))}
            </ul>
          </div>

          {/* Approvals Section */}
          <div className="approvals mt-6">
            <h2 className="text-lg font-medium">Approvals</h2>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Approver</TableCell>
                  <TableCell>Approved</TableCell>
                  <TableCell>Approved By</TableCell>
                  <TableCell>Approved Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permitData.approvals.map((approval, index) => (
                  <TableRow key={index}>
                    <TableCell>{approval.approver}</TableCell>
                    <TableCell>{approval.approved ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{approval.approvedBy}</TableCell>
                    <TableCell>{approval.approvedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Approval Summary Section */}
          <div className="approval-summary mt-6">
            <p>
              This permit has been reviewed and approved by the necessary parties 
              to proceed with the electrical system preventive maintenance and 
              inspection at the MPS Power Plant. All safety protocols and 
              precautions must be strictly followed throughout the duration 
              of this project.
            </p>
          </div>

          {/* Print Button */}
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handlePrint}
              variant="secondary"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermitToWorkForm;