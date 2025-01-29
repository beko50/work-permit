import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { RefreshCw, PlusCircle, XCircle, ChevronDown } from 'lucide-react';
import SafetyForm from './SafetyForm';
import RequestPTW from './RequestPTW';
import { api } from './services/api'

const RequestJobPermit = () => {
  const navigate = useNavigate();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPermitFormOpen, setIsPermitFormOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showPTWForm, setShowPTWForm] = useState(false);

  const getDepartmentFullName = (departmentCode) => {
    const departmentMap = {
      'OPS': 'Operations',
      'ASM': 'Asset Maintenance',
      // Add other department mappings as needed
    };
    
    return departmentMap[departmentCode] || departmentCode;
  };
  
  // Get user info from localStorage and parse roleId
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const parsedData = JSON.parse(savedData);
    setCurrentUser(parsedData?.user);
  }, []);

  
  const isLimitedUser = currentUser?.roleId?.trim() !== 'HOD' && currentUser?.roleId?.trim() !== 'ISS' && currentUser?.roleId?.trim() !== 'QA';

  const [searchParams, setSearchParams] = useState({
    jobPermitId: '',
    permitReceiver: '',
    contractCompanyName: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Construct full name for receiver
      const receiverFullName = currentUser 
        ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() 
        : '';
  
      // Build search parameters
      const queryParams = {};
      
      if (isLimitedUser) {
        // For limited users (like RCV), always filter by their full name
        if (receiverFullName) {
          queryParams.permitReceiver = receiverFullName;
        }
      } else {
        // For HOD/ISS, apply all search parameters
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value) {
            // Map some keys to match backend expectations
            const backendKey = key === 'jobPermitId' ? 'JobPermitID' : 
                               key === 'contractCompanyName' ? 'ContractCompanyName' : 
                               key;
            queryParams[backendKey] = value;
          }
        });
      }
  
      const response = await api.getPermits(queryParams, currentUser);
  
      if (response.success) {
        // Sort permits by Created date in descending order (most recent first)
        const sortedPermits = response.data.sort((a, b) => {
          return new Date(b.Created) - new Date(a.Created);
        });
        setPermits(sortedPermits);
      } else {
        setError(response.error || 'Failed to fetch permits');
        setPermits([]);
      }
    } catch (error) {
      console.error('Error fetching permits:', error);
      setError('Failed to fetch permits. Please try again later.');
      setPermits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current User:', currentUser);
    console.log('Is Limited User:', isLimitedUser);
    fetchPermits();
  }, [currentUser]); 

  useEffect(() => {
    fetchPermits();
  }, [currentUser]); // Fetch when user data is loaded

  // Search handler
  const handleSearch = () => {
    fetchPermits();
  };

  const handleCreatePermit = () => {
    navigate('/dashboard/permits/job-permits/create');
  };

  const handleViewPTW = () => {
    setIsPermitFormOpen(true);
  };
  
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

  const handleDropdownAction = (action, permit) => {
    switch (action) {
      case 'View':
        navigate(`/dashboard/permits/view/${permit.JobPermitID}`);
        break;
      case 'Review':
        navigate(`/dashboard/permits/review/${permit.JobPermitID}`);
        break;
      case 'Request Permit To Work':
        setSelectedPermit(permit);
        setShowPTWForm(true);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const getDropdownOptions = (permit) => {
    if (!isLimitedUser) {
      return ['Review'];
    }
    
    const options = ['View'];
    if (permit.Status === 'Approved') {
      options.push('Request Permit To Work');
    }
    return options;
  };

  return (
    <div className="w-full p-4">
    {/* Search Section - Only visible for ISS and HOD */}
    {!isLimitedUser && (
      <div className="mb-4 flex justify-between items-start gap-2">
        <Card className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Search Permit ID number" 
                  value={searchParams.jobPermitId} 
                  onChange={(e) => setSearchParams({ ...searchParams, jobPermitId: e.target.value })} 
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Input 
                  placeholder="Search contractor" 
                  value={searchParams.contractCompanyName} 
                  onChange={(e) => setSearchParams({ ...searchParams, contractCompanyName: e.target.value })} 
                  className="w-full"
                />
              </div>
              <Button variant="primary" onClick={handleSearch} className="w-[150px]">
                Search
              </Button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <Select 
                    placeholder="Sort Permit status" 
                    value={searchParams.status} 
                    onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })} 
                    options={['Approved', 'Pending', 'Rejected']} 
                    className="w-full"
                  />
                </div>
                <div className="col-span-3">
                  <Input 
                    placeholder="Search company" 
                    value={searchParams.company} 
                    onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-6 flex items-center gap-2 pl-20">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter date:</span>
                  <div className="flex-1 flex gap-2">
                    <Input 
                      type="date" 
                      value={searchParams.startDate} 
                      onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })} 
                      className="flex-1"
                    />
                    <span className="self-center text-gray-400">→</span>
                    <Input 
                      type="date" 
                      value={searchParams.endDate} 
                      onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })} 
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
        <Button 
          variant="outline" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="border-blue-500 text-blue-500 hover:bg-blue-50"
        >
          {showAdvanced ? 'Hide Advanced Search' : 'Show Advanced Search'}
        </Button>
      </div>
    )}

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Request for Job Permit</h1>
        </CardHeader>
        <CardContent className="p-4">
          {/* Action Buttons - show all for ISS/HOD, limited for RCV */}
          <div className="flex gap-2 mb-4">
            <Button 
              variant="secondary" 
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={fetchPermits}
            >
              <RefreshCw className="w-4 h-4" />
              REFRESH
            </Button>

            <Button
              variant='secondary' 
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleCreatePermit}
              >
              <PlusCircle className="w-4 h-4" />
              CREATE PERMIT
            </Button>
            
            {!isLimitedUser && (
              <>
                <Button 
                  variant="destructive"
                  className="flex items-center gap-2 text-red-600 hover:bg-red-50 border-none"
                  onClick={() => console.log('revoke')}
                >
                  <XCircle className="w-4 h-4" />
                  REVOKE PERMIT
                </Button>
              </>
            )}
            
            <Button onClick={handleViewPTW}>
              View PTW
            </Button>
          </div>

          {/* Show loading state */}
          {loading && (
            <div className="text-center py-4">
              Loading permits...
            </div>
          )}

          {/* Show error state */}
          {error && (
            <div className="text-red-500 text-center py-4">
              {error}
            </div>
          )}

          {/* Only render table if we have permits and not loading */}
          {!loading && !error && (
            <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Button variant="ghost" className="text-sm font-medium">
                    Actions
                  </Button>
                </TableCell>
                <TableCell className="text-base font-medium">Permit ID</TableCell>
                {currentUser?.roleId === 'QA' && (
                    <TableCell className="text-base font-medium">Department</TableCell>
                  )}
                <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                <TableCell className="text-base font-medium">Company</TableCell>
                <TableCell className="text-base font-medium">Submission Date</TableCell>
                <TableCell className="text-base font-medium">Assigned To</TableCell>   
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(permits) && permits.length > 0 ? (
                permits.map((permit) => (
                  <TableRow key={permit.JobPermitID}>
                    <TableCell>
                      <Dropdown
                        options={getDropdownOptions(permit)}
                        onSelect={(action) => handleDropdownAction(action, permit)}
                        className="text-sm font-medium"
                      >
                        Actions
                      </Dropdown>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>JP-{String(permit.JobPermitID).padStart(4, '0')}</span>
                        <span className={getStatusColor(permit.Status)}>{permit.Status}</span>
                      </div>
                    </TableCell>
                    {/* New Department Column for QA role */}
                    {currentUser?.roleId === 'QA' && (
                        <TableCell>{getDepartmentFullName(permit.Department)}</TableCell>
                      )}
                    <TableCell>{permit.PermitReceiver}</TableCell>
                    <TableCell>{permit.ContractCompanyName}</TableCell>
                    <TableCell>
                      {new Date(permit.Created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>{permit.AssignedTo}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No permits found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}

          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Rows per page: 15 | {Array.isArray(permits) ? `1-${permits.length} of ${permits.length}` : '0-0 of 0'}
          </div>
        </CardContent>
      </Card>
      {isPermitFormOpen && (
        <PermitToWorkForm onClose={() => setIsPermitFormOpen(false)} />
      )}
      {showPTWForm && selectedPermit && (
        <RequestPTW
          jobPermit={selectedPermit}
          onClose={() => {
            setShowPTWForm(false);
            setSelectedPermit(null);
          }}
          onSubmitSuccess={() => {
            setShowPTWForm(false);
            setSelectedPermit(null);
            fetchPermits(); // Refresh the permits list after successful submission
          }}
        />
      )}
    </div>
  );
};

export default RequestJobPermit;