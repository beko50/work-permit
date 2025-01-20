import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { RefreshCw, PlusCircle, XCircle, ChevronDown } from 'lucide-react';
import SafetyForm from './SafetyForm';
import PermitToWorkForm from './PTWForm';
import { api } from './services/api'

const JobSafetyPermit = () => {
  const navigate = useNavigate();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPermitFormOpen, setIsPermitFormOpen] = useState(false);
  
  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = userInfo.role;
  const userName = `${userInfo.firstName} ${userInfo.lastName}`;

  const [searchParams, setSearchParams] = useState({
    jobPermitId: '',
    permitReceiver: '',
    contractCompanyName: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  // Fetch permits based on user role
  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Build search parameters
      const queryParams = new URLSearchParams();
    
    // Only add parameters that have values
    if (searchParams.permitReceiver) {
      queryParams.append('PermitReceiver', searchParams.permitReceiver);
    }
    if (searchParams.status) {
      queryParams.append('Status', searchParams.status);
    }
    if (searchParams.contractCompanyName) {
      queryParams.append('ContractCompanyName', searchParams.contractCompanyName);
    }
    if (searchParams.startDate) {
      queryParams.append('StartDate', searchParams.startDate);
    }
    if (searchParams.endDate) {
      queryParams.append('EndDate', searchParams.endDate);
    }

    const response = await api.getPermits(Object.fromEntries(queryParams));

    if (response.success) {
      setPermits(response.data);
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
    fetchPermits();
  }, []); // Initial fetch

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
        <ul className="absolute z-10 w-28 border rounded-md mt-2 bg-gray-50 shadow-lg overflow-auto">
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
      case 'Edit':
        console.log(`Editing permit: ${permitId}`);
        navigate(`/dashboard/permits/job-permits/edit/${permitId}`);
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
    <div className="w-full p-4">
      {/* Search Section */}
      <div className="mb-4 flex justify-between items-start gap-2">
        <Card className="flex-1 p-4">
          <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
              {/* Your existing search inputs */}
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
          className="border-blue-500 text-blue-500 hover:bg-blue-50">
          {showAdvanced ? 'Hide Advanced Search' : 'Show Advanced Search'}
        </Button>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">Job Safety Permits</h1>
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
            
            {userRole !== 'RCV' && (
              <>
                <Button
                  variant='secondary' 
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleCreatePermit}
                >
                  <PlusCircle className="w-4 h-4" />
                  CREATE PERMIT
                </Button>
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
                <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                <TableCell className="text-base font-medium">Company</TableCell>
                <TableCell className="text-base font-medium">Status</TableCell>
                <TableCell className="text-base font-medium">Submission Date</TableCell>   
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(permits) && permits.length > 0 ? (
                permits.map((permit) => (
                  <TableRow key={permit.JobPermitID}>
                    <TableCell>
                      <Dropdown
                        options={['View', 'Edit', 'Print']}
                        onSelect={(action) => handleDropdownAction(action, permit.JobPermitID)}
                        className="text-sm font-medium"
                      >
                        Actions
                      </Dropdown>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>JSP-{String(permit.JobPermitID).padStart(4, '0')}</span>
                        <span className={getStatusColor(permit.Status)}>{permit.Status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{permit.PermitReceiver}</TableCell>
                    <TableCell>{permit.ContractCompanyName || 'N/A'}</TableCell>
                    <TableCell>{permit.Status}</TableCell>
                    <TableCell>
                      {new Date(permit.Created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
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
    </div>
  );
};

export default JobSafetyPermit;