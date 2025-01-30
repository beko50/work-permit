import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { RefreshCw, PlusCircle, XCircle, ChevronDown } from 'lucide-react';
import Tabs from './components/ui/tabs';
import { api } from './services/api';
import RequestPTW from './RequestPTW';

const PermitToWork = () => {
  const navigate = useNavigate();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('approved-job-permits');
  const [showPTWForm, setShowPTWForm] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useState({
    jobPermitId: '',
    permitReceiver: '',
    contractCompanyName: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const userData = JSON.parse(savedData)?.user;
    setCurrentUser(userData);
  }, []);

  const getPermitActions = (permit) => {
    const reviewerRoles = ['ISS', 'HOD', 'QA'];
    
    if (
      reviewerRoles.includes(currentUser?.roleId) && 
      permit.AssignedTo === currentUser?.roleId
    ) {
      return ['Review Permit To Work'];
    }
    
    return ['View Permit To Work'];
  };

  const getStatusColor = (status) => {
    status = status.toLowerCase();
    if (status === 'pending') return 'text-yellow-500';
    if (status === 'approved') return 'text-green-500';
    if (status === 'rejected' || status === 'revoked') return 'text-red-500';
    return 'text-gray-500';
  };

  const tabs = [
    { value: 'approved-job-permits', label: 'Approved Job Permits' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'revoked-rejected', label: 'Revoked/Rejected' }
  ];

  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getPermitsToWork();
      
      if (response.success) {
        setPermits(response.data);
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
    fetchPermits();
  }, []);

  const handleSearch = () => {
    fetchPermits();
  };

  const Dropdown = ({ children, options, onSelect, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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

  const handleDropdownAction = (action, permitId) => {
    switch (action) {
      case 'View Permit To Work':
        navigate(`/dashboard/permits/permit-to-work/job-permit/${permitId}`);
        break;
      case 'Review Permit To Work':
        navigate(`/dashboard/permits/permit-to-work/review/${permitId}`);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const getFilteredPermits = () => {
    switch (currentTab) {
      case 'active':
        return permits.filter(permit => permit.AssignedTo === 'ACTIVE');
      case 'approved-job-permits':
        return permits.filter(permit => permit.AssignedTo !== 'ACTIVE');
      case 'expired':
        // Add expired filtering logic when needed
        return [];
      case 'revoked-rejected':
        return permits.filter(permit => 
          permit.Status.toLowerCase() === 'revoked' || 
          permit.Status.toLowerCase() === 'rejected'
        );
      default:
        return [];
    }
  };

  const filteredPermits = getFilteredPermits();

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Permit to Work</h2>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex gap-2 mb-4">
              <Button 
                variant="secondary" 
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={fetchPermits}
              >
                <RefreshCw className="w-4 h-4" />
                REFRESH
              </Button>
            </div>
          </div>

          <Tabs tabs={tabs} activeTab={currentTab} onTabChange={setCurrentTab} />

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
                  <TableCell className="text-base font-medium">Assigned To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPermits.length > 0 ? (
                  filteredPermits.map((permit) => (
                    <TableRow key={permit.JobPermitID}>
                      <TableCell>
                        <Dropdown
                          options={getPermitActions(permit)}
                          onSelect={(action) => handleDropdownAction(action, permit.JobPermitID)}
                          className="text-sm font-medium"
                        >
                          Actions
                        </Dropdown>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>JP-{String(permit.JobPermitID).padStart(4, '0')}</span>
                          <span className={getStatusColor(permit.Status)}>
                            {permit.Status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{permit.PermitReceiver}</TableCell>
                      <TableCell>{permit.ContractCompanyName}</TableCell>
                      <TableCell>{permit.AssignedTo}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No permits found for this tab
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Rows per page: 15 | {filteredPermits.length > 0 ? `1-${filteredPermits.length} of ${filteredPermits.length}` : '0-0 of 0'}
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
          onClose={() => {
            setShowPTWForm(false);
            setSelectedPermit(null);
          }}
          onSubmitSuccess={() => {
            setShowPTWForm(false);
            setSelectedPermit(null);
            fetchPermits();
          }}
        />
      )}
    </div>
  );
};

export default PermitToWork;