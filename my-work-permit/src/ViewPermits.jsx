import React, { useState, useRef, useEffect,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input, Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { RefreshCw, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import PermitToWorkForm from './PTWForm';
import { api } from './services/api';

const shouldShowDepartmentColumn = (user) => {
  return user?.roleId === 'QA' || user?.departmentId === 'QHSSE';
};

const ViewPermit = () => {
  const navigate = useNavigate();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPermitFormOpen, setIsPermitFormOpen] = useState(false);
  const [departments, setDepartments] = useState([]); // State to store departments

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPermits, setTotalPermits] = useState(0);
  const itemsPerPage = 8;

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const parsedData = JSON.parse(savedData);
    setCurrentUser(parsedData?.user);
  }, []);

  const [searchParams, setSearchParams] = useState({
    jobPermitId: '',
    permitReceiver: '',
    contractCompanyName: '',
    status: '',
    startDate: '',
    endDate: '',
    department: '', // Add department to searchParams
    page: 1,
    limit: itemsPerPage
  });

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsData = await api.getDepartments();
        // Transform department data to match the required format
        const formattedDepartments = departmentsData.map(dept => ({
          value: dept.DepartmentID,
          label: getDepartmentFullName(dept.DepartmentID)
        }));
        setDepartments(formattedDepartments || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, []);

  const getDepartmentFullName = (departmentCode) => {
    const departmentMap = {
      'OPS': 'Operations',
      'ASM': 'Asset Maintenance',
      'IT': 'IT',
      'QHSSE': 'QHSSE'
    };
    return departmentMap[departmentCode] || departmentCode;
  };

  // Add role display mapping function
  const getRoleDisplayName = (roleId) => {
    const roleDisplayMap = {
      'ISS': 'PERMIT ISSUER',
      'HOD': 'HOD / MANAGER',
      'QA': 'QHSSE APPROVER',
      'COMPLETED': 'Completed'
    };
    
    return roleDisplayMap[roleId] || roleId;
  };

  const fetchPermits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser) {
        setPermits([]);
        return;
      }

      const queryParams = {
        ...searchParams,
        page: currentPage,
        limit: itemsPerPage,
        department: searchParams.department,
      };

      const response = await api.searchPermits(queryParams, currentUser);

      if (response.success) {
        setPermits(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.totalPages || 0);
        setTotalPermits(response.total || 0);
      } else {
        setPermits([]);
        setTotalPages(0);
        setTotalPermits(0);
        setError(response.message || 'No permits found matching your search criteria');
      }
    } catch (error) {
      console.error('Error fetching permits:', error);
      setError('Failed to fetch permits. Please try again.');
      setPermits([]);
      setTotalPages(0);
      setTotalPermits(0);
    } finally {
      setLoading(false);
    }
  }, [currentUser, searchParams, currentPage, itemsPerPage]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPermits();
    }
  }, [currentUser, currentPage, fetchPermits]);

  const handleSearch = () => {
    setCurrentPage(1); // Reset to the first page when searching
    fetchPermits();
  };

  // Add reset filters function
const resetFilters = () => {
  setSearchParams({
    jobPermitId: '',
    permitReceiver: '',
    status: '',
    department: '',
    contractCompanyName: '',
    startDate: '',
    endDate: ''
  });
  setCurrentPage(1);
  fetchPermits();
};

  // Pagination Controls Component
  const PaginationControls = () => (
    <div className="flex justify-end items-center mt-4 space-x-2 text-sm text-gray-500">
      <span>
        {`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalPermits)} of ${totalPermits}`}
      </span>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePreviousPage} 
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>{`Page ${currentPage} of ${totalPages}`}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNextPage} 
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  useEffect(() => {
    fetchPermits();
  }, [currentUser]);

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
        navigate(`/dashboard/permits/view/${permitId}`);
        break;
      case 'Review':
        navigate(`/dashboard/permits/review/${permitId}`);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const getDropdownOptions = (permit) => {
    return ['View'];
  };

  return (
    <div className="w-full p-4">
      {/* Search Section */}
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
                          placeholder="Search Permit Receiver" 
                          value={searchParams.permitReceiver} 
                          onChange={(e) => setSearchParams({ ...searchParams, permitReceiver: e.target.value })} 
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <Input 
                          placeholder="Search Contract Company" 
                          value={searchParams.contractCompanyName} 
                          onChange={(e) => setSearchParams({ ...searchParams, contractCompanyName: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <Button 
                        variant="secondary" 
                        onClick={resetFilters}
                        className="flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset Filters
                      </Button>
                    </div>
      
                    {showAdvanced && (
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                          <Select 
                            placeholder="Filter by Permit status" 
                            value={searchParams.status} 
                            onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })} 
                            options={['Approved', 'Pending', 'Rejected']} 
                            className="w-full"
                          />
                        </div>
                        {/* Department Filter - Only for QA and QHSSE */}
                        {(currentUser?.roleId === 'QA' || currentUser?.departmentId === 'QHSSE') && (
                          <div className="col-span-3">
                            <Select
                              placeholder="Filter by Department"
                              value={searchParams.department}
                              onChange={(e) => setSearchParams({ ...searchParams, department: e.target.value })}
                              options={departments}
                              className="w-full"
                            />
                          </div>
                        )}
                        <div className="col-span-6 flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter by Submission date:</span>
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

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">
            View {
              currentUser 
                ? (currentUser.roleId === 'QA' || currentUser.departmentId === 'QHSSE'
                    ? 'All Permits' 
                    : `${getDepartmentFullName(currentUser.departmentId)} Department Permits`)
                : 'Department Permits'
            }
          </h1>
        </CardHeader>
        <CardContent className="p-4">
          {loading && (
            <div className="text-center py-4">
              Loading permits...
            </div>
          )}

          {error && (
            <div className="text-gray-500 text-center py-4">
              {error}
            </div>
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
                  <TableCell className="text-base font-medium">Permit ID</TableCell>
                  {shouldShowDepartmentColumn(currentUser) && (
                    <TableCell className="text-base font-medium">Department</TableCell>
                  )}
                  <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                  <TableCell className="text-base font-medium">Company</TableCell>
                  <TableCell className="text-base font-medium">Submission Date</TableCell>
                  <TableCell className="text-base font-medium">Assigned To</TableCell>   
                </TableRow>
              </TableHead>
              <TableBody>
                {permits && permits.length > 0 ? (
                  permits.map((permit) => (
                    <TableRow key={permit.JobPermitID}>
                      <TableCell>
                        <Dropdown
                          options={getDropdownOptions(permit)}
                          onSelect={(action) => handleDropdownAction(action, permit.JobPermitID)}
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
                      {shouldShowDepartmentColumn(currentUser) && (
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
                      <TableCell>{getRoleDisplayName(permit.AssignedTo)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={shouldShowDepartmentColumn(currentUser) ? 7 : 6} className="text-center py-4">
                      {loading ? 'Loading permits...' : 'No permits found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {!loading && !error && permits.length > 0 && <PaginationControls />}
        </CardContent>
      </Card>
      
      {isPermitFormOpen && (
        <PermitToWorkForm onClose={() => setIsPermitFormOpen(false)} />
      )}
    </div>
  );
};

export default ViewPermit;