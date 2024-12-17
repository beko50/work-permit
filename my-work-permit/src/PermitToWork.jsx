import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { RefreshCw, PlusCircle, XCircle, ChevronDown } from 'lucide-react';
import Tabs from './components/ui/tabs';

const PermitToWork = () => {
  const navigate = useNavigate();
  const [approvedSafetyPermits, setApprovedSafetyPermits] = useState([
    { id: 'C95-1', company: 'MPS Group Ltd', jobDescription: 'Internal job', permitReceiver: 'Bernard Ofori', startDate: '2/20/2024', endDate: '3/20/2024', status: 'Awaiting Work Approval', approver: 'Jane Doe', approvalDate: '2/19/2024' },
    { id: 'C95-2', company: 'ABC Corp', jobDescription: 'Electrical maintenance', permitReceiver: 'Jane Smith', startDate: '3/1/2024', endDate: '3/31/2024', status: 'Awaiting Work Approval', approver: 'John Smith', approvalDate: '2/28/2024' },
    { id: 'C95-3', company: 'XYZ Inc', jobDescription: 'Plumbing repair', permitReceiver: 'John Doe', startDate: '4/10/2024', endDate: '4/30/2024', status: 'Awaiting Work Approval', approver: 'Sarah Lee', approvalDate: '4/9/2024' }
  ]);
  const [activePermits, setActivePermits] = useState([
    { id: 'A12-1', company: 'MPS Group Ltd', jobDescription: 'Internal job', permitReceiver: 'Bernard Ofori', startDate: '3/1/2024', endDate: '3/31/2024', status: 'Active', approver: 'Jane Doe', approvalDate: '2/28/2024' },
    { id: 'A12-2', company: 'ABC Corp', jobDescription: 'Electrical maintenance', permitReceiver: 'Jane Smith', startDate: '4/1/2024', endDate: '4/30/2024', status: 'Active', approver: 'John Smith', approvalDate: '3/31/2024' }
  ]);
  const [expiredPermits, setExpiredPermits] = useState([
    { id: 'E23-1', company: 'XYZ Inc', jobDescription: 'Plumbing repair', permitReceiver: 'John Doe', startDate: '1/1/2024', endDate: '1/31/2024', status: 'Expired', approver: 'Sarah Lee', approvalDate: '12/31/2023' },
    { id: 'E23-2', company: 'MPS Group Ltd', jobDescription: 'Internal job', permitReceiver: 'Bernard Ofori', startDate: '2/1/2024', endDate: '2/28/2024', status: 'Expired', approver: 'Jane Doe', approvalDate: '1/31/2024' }
  ]);
  const [rejectedPermits, setRejectedPermits] = useState([
    { id: 'R34-1', company: 'ABC Corp', jobDescription: 'Electrical maintenance', permitReceiver: 'Jane Smith', startDate: '5/1/2024', endDate: '5/31/2024', status: 'Rejected', approver: 'John Smith', approvalDate: '4/30/2024' },
    { id: 'R34-2', company: 'XYZ Inc', jobDescription: 'Plumbing repair', permitReceiver: 'John Doe', startDate: '6/1/2024', endDate: '6/30/2024', status: 'Revoked', approver: 'Sarah Lee', approvalDate: '5/31/2024' }
  ]);
  const [currentTab, setCurrentTab] = useState('approved-safety-permits');
  const [selectedRows, setSelectedRows] = useState([]);

  const handleRowSelection = (permitId) => {
    if (selectedRows.includes(permitId)) {
      setSelectedRows(selectedRows.filter(id => id !== permitId));
    } else {
      setSelectedRows([...selectedRows, permitId]);
    }
  };

  const handleViewPermit = (permitId) => {
    navigate(`/dashboard/permits/job-permits/${permitId}`);
  };

  const handlePrintPermit = (permitId) => {
    console.log('Printing permit:', permitId);
  };

  const tabs = [
    { value: 'approved-safety-permits', label: 'Approved Safety Permits' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'revoked-rejected', label: 'Revoked/Rejected' }
  ];

  const Dropdown = ({ 
    children, 
    options, 
    onSelect, 
    className = '' 
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (selectedOption) => {
    onSelect(selectedOption);
    setIsOpen(false);
  };
  
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="text-sm font-medium">Actions</span>
        <ChevronDown className="h-5 w-5 text-blue-500" />
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-48 border rounded-md mt-2 bg-gray-50 shadow-lg overflow-auto">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

  const getStatusColor = (status) => {
    switch (status) {
      case 'Rejected': return 'text-red-500';
      case 'Approved': return 'text-green-500';
      case 'Pending': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const handleDropdownAction = (action, permitId) => {
    switch (action) {
      case 'View':
        console.log(`Viewing permit: ${permitId}`);
        break;
      case 'Request PTW':
        console.log(`Requesting permit: ${permitId}`);
        navigate(`/dashboard/permits/job-permits/ptw/${permitId}`);
        break;
      case 'Print':
        console.log(`Printing permit: ${permitId}`);
        // Add your print logic here
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Permit to Work</h2>
        </CardHeader>
        <Tabs tabs={tabs} activeTab={currentTab} onTabChange={setCurrentTab} />
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Button variant="ghost" className="text-sm font-medium">
                    Command
                  </Button>
                </TableCell>
                <TableCell className="text-base font-medium">Permit ID</TableCell>
                <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                <TableCell className="text-base font-medium">Job Description</TableCell>
                <TableCell className="text-base font-medium">Start Date</TableCell>
                <TableCell className="text-base font-medium">End Date</TableCell>
                <TableCell className="text-base font-medium">Approver(s)</TableCell>
                <TableCell className="text-base font-medium">Approval Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentTab === 'approved-safety-permits' &&
                approvedSafetyPermits.map((permit) => (
                  <TableRow key={permit.id}>
                    <TableCell>
                    <Dropdown
                      options={['View','Edit / Permit Extension']}
                      onSelect={(action) => handleDropdownAction(action, permit.id)}
                      className="text-sm font-medium"
                    >
                      Actions
                    </Dropdown>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{permit.id}</span>
                        <span className={permit.status === 'Awaiting Work Approval' ? 'text-yellow-500' : 'text-gray-500'}>{permit.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{permit.permitReceiver}</TableCell>
                    <TableCell>{permit.jobDescription}</TableCell>
                    <TableCell>{permit.startDate}</TableCell>
                    <TableCell>{permit.endDate}</TableCell>
                    <TableCell>{permit.approver}</TableCell>
                    <TableCell>{permit.approvalDate}</TableCell>
                  </TableRow>
                ))}
              {(currentTab === 'active' ||
                currentTab === 'expired' ||
                currentTab === 'revoked-rejected') && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No Permits Available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Rows per page: 15 | 1-3 of 3
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
            onClick={() => navigate('/dashboard/permits/job-permits')}
          >
            Back to Job Permits
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PermitToWork;