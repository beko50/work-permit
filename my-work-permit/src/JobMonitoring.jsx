import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { RefreshCw, PlusCircle, XCircle, ChevronDown } from 'lucide-react';
import Tabs from './components/ui/tabs';
import { api } from './services/api';
import RequestPTW from './RequestPTW';

const PermitToWork = () => {
  const navigate = useNavigate();
  const [approvedJobPermits, setApprovedJobPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('approved-job-permits');
  const [showPTWForm, setShowPTWForm] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);

  const tabs = [
    { value: 'approved-job-permits', label: 'Approved Job Permits' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'revoked-rejected', label: 'Revoked/Rejected' }
  ];

  const handlePTWSubmitSuccess = () => {
    // Refresh the permits list
    fetchApprovedPermits();
  };

  // Fetch approved permits
  const fetchApprovedPermits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
      const currentUser = JSON.parse(savedData)?.user;
  
      const response = await api.getPermitsToWork();
      
      if (response.success) {
        // Log raw data to see what we're getting
        console.log('Raw permits data:', response.data);
        
        // For now, let's show all permits until we determine the correct filter
        setApprovedJobPermits(response.data);
  
        // Commented out the filter until we determine the correct conditions
        /*
        const onlyApproved = response.data.filter(permit => 
          permit.Status === 'Approved' || 
          (permit.HODStatus === 'Approved' && 
           permit.IssuerStatus === 'Approved' && 
           permit.QHSSEStatus === 'Approved')
        );
        console.log('Filtered permits:', onlyApproved);
        setApprovedJobPermits(onlyApproved);
        */
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Error fetching permits. Please try again later.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    fetchApprovedPermits();
  }, []);

  const Dropdown = ({ children, options, onSelect, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
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

  const handleDropdownAction = (action, permitId) => {
    switch (action) {
      case 'Request Permit To Work':
        const permit = approvedJobPermits.find(p => p.JobPermitID === permitId);
        setSelectedPermit(permit);
        setShowPTWForm(true);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const handleClosePTWForm = () => {
    setShowPTWForm(false);
    setSelectedPermit(null);
  };

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Permit to Work</h2>
        </CardHeader>
        <Tabs tabs={tabs} activeTab={currentTab} onTabChange={setCurrentTab} />
        <CardContent>
          {loading && (
            <div className="text-center py-4">Loading permits...</div>
          )}

          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}

          {!loading && !error && (
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
                  <TableCell className="text-base font-medium">Company</TableCell>
                  <TableCell className="text-base font-medium">Approval Date</TableCell>
                  <TableCell className="text-base font-medium">Assigned To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentTab === 'approved-job-permits' && approvedJobPermits.length > 0 ? (
                  approvedJobPermits.map((permit) => (
                    <TableRow key={permit.JobPermitID}>
                      <TableCell>
                        <Dropdown
                          options={['Request Permit To Work']}
                          onSelect={(action) => handleDropdownAction(action, permit.JobPermitID)}
                          className="text-sm font-medium"
                        >
                          Actions
                        </Dropdown>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>JP-{String(permit.JobPermitID).padStart(4, '0')}</span>
                          <span className="text-green-500">{permit.Status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{permit.PermitReceiver}</TableCell>
                      <TableCell>{permit.ContractCompanyName}</TableCell>
                      <TableCell>
                      {new Date(permit.Changed).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      </TableCell>
                      <TableCell>{permit.AssignedTo}</TableCell>
                    </TableRow>
                  ))
                ) : currentTab === 'approved-job-permits' ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No approved job permits found
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No permits available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Rows per page: 15 | {approvedJobPermits.length > 0 ? `1-${approvedJobPermits.length} of ${approvedJobPermits.length}` : '0-0 of 0'}
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

      {showPTWForm && (
      <RequestPTW
        jobPermit={selectedPermit}
        onClose={handleClosePTWForm}
        onSubmitSuccess={handlePTWSubmitSuccess}
      />
    )}
    </div>
  );
};

export default PermitToWork;