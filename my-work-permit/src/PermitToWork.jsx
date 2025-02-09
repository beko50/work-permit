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

const TabButton = ({ id, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors
      ${active 
        ? 'bg-white border-t-2 border-blue-500 text-blue-600' 
        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
  >
    {label}
  </button>
);

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

  // Add role display mapping function
  const getRoleDisplayName = (roleId) => {
    const roleDisplayMap = {
      'ISS': 'PERMIT ISSUER',
      'HOD': 'HOD / MANAGER',
      'QA': 'QHSSE APPROVER'
    };
    
    return roleDisplayMap[roleId] || roleId;
  };

  useEffect(() => {
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
  
    fetchPermits();
  }, [currentTab]);

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
          <span className="text-sm font-medium">Select</span>
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

  const handleDropdownAction = (action, permitToWorkId) => {
    switch (action) {
      case 'View Permit To Work':
        navigate(`/dashboard/permits/permit-to-work/view/${permitToWorkId}`);
        break;
      case 'Review Permit To Work':
        navigate(`/dashboard/permits/permit-to-work/review/${permitToWorkId}`); // Use permitToWorkId directly
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const getFilteredPermits = () => {
    switch (currentTab) {
      case 'approved-job-permits':
        return permits.filter(permit => {
          const status = permit.Status.toLowerCase();
          return status === 'pending';
        });
        case 'approved':
          return permits.filter(permit => {
            const status = permit.Status.toLowerCase();
            return status === 'approved';
          });
      case 'ongoing':
        return permits.filter(permit => 
          permit.Status.toLowerCase() === 'approved' && 
          permit.AssignedTo === 'ONGOING'
        );
      case 'expired':
        return permits.filter(permit => 
          permit.Status.toLowerCase() === 'expired'
        );
      case 'revoked-rejected':
        return permits.filter(permit => {
          const status = permit.Status.toLowerCase();
          return status === 'revoked' || status === 'rejected';
        });
      default:
        return [];
    }
  };

  const filteredPermits = getFilteredPermits();

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Permit to Work</h2>
            <div className="flex gap-2 border-b">
              <TabButton
                id="approved-job-permits"
                label="Pending"
                active={currentTab === 'approved-job-permits'}
                onClick={setCurrentTab}
              />
              <TabButton
                id="approved"
                label="Approved"
                active={currentTab === 'approved'}
                onClick={setCurrentTab}
              />
              <TabButton
                id="expired"
                label="Expired"
                active={currentTab === 'expired'}
                onClick={setCurrentTab}
              />
              <TabButton
                id="revoked-rejected"
                label="Revoked/Rejected"
                active={currentTab === 'revoked-rejected'}
                onClick={setCurrentTab}
              />
            </div>
          </div>
        </CardHeader>
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
                      Actions
                    </Button>
                  </TableCell>
                  <TableCell className="text-base font-medium">Permit to Work ID</TableCell>
                  <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                  <TableCell className="text-base font-medium">Company</TableCell>
                  <TableCell className="text-base font-medium">Job Description</TableCell>
                  <TableCell className="text-base font-medium">Assigned To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPermits.length > 0 ? (
                  filteredPermits.map((permit) => (
                    <TableRow key={permit.PermitToWorkID}>
                      <TableCell>
                        <Dropdown
                          options={getPermitActions(permit)}
                          onSelect={(action) => handleDropdownAction(action, permit.PermitToWorkID)}
                          className="text-sm font-medium"
                        >
                          Actions
                        </Dropdown>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>PTW-{String(permit.PermitToWorkID).padStart(4, '0')}</span>
                          <span className={getStatusColor(permit.Status)}>
                            {permit.Status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{permit.PermitReceiver}</TableCell>
                      <TableCell>{permit.ContractCompanyName}</TableCell>
                      <TableCell>{permit.JobDescription}</TableCell>
                      <TableCell>{getRoleDisplayName(permit.AssignedTo)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
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