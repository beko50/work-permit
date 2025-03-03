import React, { useState, useEffect,useRef } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { api } from './services/api';
import Checkbox  from './components/ui/checkbox';
import logo from './assets/mps_logo.jpg';
import { Input } from './components/ui/form';
import { Eye,RefreshCw, PlusCircle, XCircle, ChevronDown,Filter,X } from 'lucide-react';


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

// LocalStorage keys for persistent state
const STORAGE_KEYS = {
  TAB: 'jobs-monitoring-current-tab',
  PAGE: 'jobs-monitoring-current-page',
  SEARCH: 'jobs-monitoring-search-value',
  LOCATION_FILTERS: 'jobs-monitoring-location-filters' // Changed to plural
};

const JobsMonitoring = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize states from localStorage
  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = localStorage.getItem(STORAGE_KEYS.TAB);
    return savedTab || 'ongoing';
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPermits, setSelectedPermits] = useState([]);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize pagination state from localStorage
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem(STORAGE_KEYS.PAGE);
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  
  const [totalPages, setTotalPages] = useState(0);
  const [totalPermits, setTotalPermits] = useState(0);
  const itemsPerPage = 10;
  
  // Initialize search from localStorage
  const [searchValue, setSearchValue] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SEARCH) || '';
  });
  
  // Initialize location filters as array from localStorage
  const [locationFilters, setLocationFilters] = useState(() => {
    const savedFilters = localStorage.getItem(STORAGE_KEYS.LOCATION_FILTERS);
    return savedFilters ? JSON.parse(savedFilters) : [];
  });
  
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const locationFilterRef = useRef(null);
  const [searchLocationFilter, setSearchLocationFilter] = useState('');

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TAB, currentTab);
  }, [currentTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAGE, currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH, searchValue);
  }, [searchValue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCATION_FILTERS, JSON.stringify(locationFilters));
  }, [locationFilters]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
      if (savedData) {
        const userData = JSON.parse(savedData)?.user;
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  // Check if we're returning from a permit view
  useEffect(() => {
    // Only run this when the component mounts and we have a state from navigation
    if (location.state?.from === 'permit-view') {
      // Restoring previous state happens automatically because we're using localStorage
      
      // If returning from a specific tab, ensure we stay on that tab
      if (location.state?.returnToTab) {
        setCurrentTab(location.state.returnToTab);
      }
    }
  }, [location.state]);

  // Close location filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (locationFilterRef.current && !locationFilterRef.current.contains(event.target)) {
        setShowLocationFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPermitsToWork();
      if (response.success) {
        // Sort permits by latest Change date
        const sortedPermits = response.data.sort((a, b) => 
          new Date(b.Changed || Date.now()) - new Date(a.Changed || Date.now())
        );
        
        setPermits(sortedPermits);
        
        // Extract unique job locations for filter
        const locations = [...new Set(sortedPermits.map(permit => permit.JobLocation))].filter(Boolean);
        setUniqueLocations(locations);
        
        // Count total permits for the current tab
        updatePaginationInfo(sortedPermits);
      } else {
        setError(response.error || 'Failed to fetch permits');
        setPermits([]);
        setTotalPermits(0);
        setTotalPages(0);
      }
    } catch (err) {
      setError('Error fetching permits. Please try again later.');
      console.error('Error:', err);
      setPermits([]);
      setTotalPermits(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Update pagination info based on filtered permits
  const updatePaginationInfo = (permitList = permits) => {
    const filteredCount = getFilteredPermits(permitList).length;
    setTotalPermits(filteredCount);
    setTotalPages(Math.ceil(filteredCount / itemsPerPage));
  };

  useEffect(() => {
    if (currentUser) {
      fetchPermits();
    }
  }, [currentTab, currentUser]);

  // Refetch when page changes
  useEffect(() => {
    if (currentUser) {
      updatePaginationInfo();
    }
  }, [currentPage]);

  // Update pagination when search or filter changes
  useEffect(() => {
    updatePaginationInfo();
    setCurrentPage(1); // Reset to first page on filter/search changes
  }, [searchValue, locationFilters]);

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const handleView = (permit) => {
    // Determine which tab this permit belongs to
    let tabForPermit = currentTab;
    
    if (permit.CompletionStatus === 'Job Completed') {
      tabForPermit = 'completed';
    } else if (permit.Status === 'Revoked') {
      tabForPermit = 'revoked';
    } else if (permit.Status === 'Approved' || permit.Status.toLowerCase() === 'revocation pending') {
      tabForPermit = 'ongoing';
    }
    
    // Always navigate to the JobReview component with the current state
    navigate(`/dashboard/jobs-monitoring/review/${permit.PermitToWorkID}`, {
      state: { 
        from: 'jobs-monitoring',
        returnToTab: tabForPermit, // Store which tab to return to
        page: currentPage,
        searchValue: searchValue,
        locationFilters: locationFilters
      }
    });
  };

  const handleCheckboxChange = (permitId) => {
    setSelectedPermits(prev => {
      if (prev.includes(permitId)) {
        return prev.filter(id => id !== permitId);
      }
      return [...prev, permitId];
    });
  };

  const getSelectedPermitNumbers = () => {
    return permits
      .filter(permit => selectedPermits.includes(permit.PermitToWorkID))
      .map(permit => `PTW-${String(permit.PermitToWorkID).padStart(4, '0')}`)
      .join(', ');
  };

  const handleModalClose = () => {
    setShowRevokeModal(false);
    setError(null);
    setRevokeReason('');
    fetchPermits(); // Refresh the table data
  };

  const handleRevoke = () => {
    setError(null); // Clear any existing errors
    setShowRevokeModal(true);
  };

  const handleRevokeSubmit = async () => {
    if (revokeReason.trim().length < 10) {
      setError('Reason must be at least 10 characters long');
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmRevoke = async () => {
    try {
      setIsSubmitting(true);
      const permitsToRevoke = selectedPermits.map(permitId => ({
        id: permitId,
        type: 'work' // Indicates Permit to Work
      }));

      const response = await api.revokePermits(permitsToRevoke, revokeReason);
      if (response.success) {
        setShowRevokeModal(false);
        setShowConfirmation(false);
        setSelectedPermits([]);
        setRevokeReason('');
        fetchPermits(); // Refresh the list
      } else {
        setError(response.error || 'Failed to revoke permits');
      }
    } catch (err) {
      setError('Error revoking permits: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInUserDepartment = (permit) => {
    if (!currentUser?.departmentId && !currentUser?.departmentName) return false;
    return (
      permit.Department === currentUser.departmentId ||
      permit.Department === currentUser.departmentName
    );
  };

  const canRevokePermits = () => {
    const currentUserRole = currentUser?.roleId;
    return ['ISS', 'QA'].includes(currentUserRole);
  };

  const hasViewAccess = () => {
    const currentUserRole = currentUser?.roleId;
    return ['ISS', 'QA', 'HOD'].includes(currentUserRole);
  };

  const handleSearch = async (value) => {
    try {
      setLoading(true);
      setError(null);
      
      // If search is empty, update with current filters
      if (!value.trim()) {
        updatePaginationInfo();
        setLoading(false);
        return;
      }

      // Extract numeric part from PTW ID (e.g., "PTW-0004" -> "4")
      const permitId = value.trim().replace(/^PTW-0*/, '');
      
      // Validate permitId is a number
      if (!/^\d+$/.test(permitId)) {
        setError('Please enter a valid PTW ID (e.g., PTW-0001)');
        setLoading(false);
        return;
      }

      // Search permit by ID
      const response = await api.searchPTW({
        permitId: parseInt(permitId)
      }, currentUser);

      if (response.success && response.data.length > 0) {
        // Sort permits by Changed date (most recent first)
        const sortedPermits = response.data.sort((a, b) => 
          new Date(b.Changed || Date.now()) - new Date(a.Changed || Date.now())
        );
        
        // Find the right tab for this permit
        const permit = sortedPermits[0];
        const status = permit.Status.toLowerCase();
        const isCompleted = permit.CompletionStatus === 'Job Completed';
        const isRevoked = status === 'revoked';
        const isRevocationPending = status === 'revocation pending';
        
        // Automatically switch to the appropriate tab
        let newTab = currentTab;
        
        if (isCompleted) {
          newTab = 'completed';
        } else if (isRevoked) {
          newTab = 'revoked';
        } else if (isRevocationPending || status === 'approved' || status === 'pending') {
          // For revocation pending, approved, or pending, show in ongoing tab
          newTab = 'ongoing';
        }
        
        // Set the new tab and update permit list
        if (newTab !== currentTab) {
          setCurrentTab(newTab);
        }
        
        // Replace permits with search results
        setPermits(sortedPermits);
        updatePaginationInfo(sortedPermits);
      } else {
        setError('No permits found matching your search');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error searching permits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce((value) => handleSearch(value), 500);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // If search is cleared, reset everything to initial state
    if (!value.trim()) {
      setError(null);
      fetchPermits(); // Fetch all permits
    } else {
      // Otherwise, debounce the search
      debouncedSearch(value);
    }
  };

  // Handle location filter check/uncheck
  const handleLocationFilterChange = (location) => {
    setLocationFilters(prev => {
      if (prev.includes(location)) {
        return prev.filter(loc => loc !== location);
      } else {
        return [...prev, location];
      }
    });
  };

  // Handle removing a filter tag
  const handleRemoveFilter = (location) => {
    setLocationFilters(prev => prev.filter(loc => loc !== location));
  };

  // Handle search within filters
  const handleFilterSearch = (e) => {
    setSearchLocationFilter(e.target.value);
  };

  // Clear all location filters
  const handleClearAllFilters = () => {
    setLocationFilters([]);
    setShowLocationFilter(false);
  };

  // Select all locations
  const handleSelectAll = () => {
    setLocationFilters([...uniqueLocations]);
  };

  const getFilteredPermits = (permitList = permits) => {
    if (!currentUser) return [];
  
    const currentUserRole = currentUser.roleId;
    const isQHSSE = currentUserRole === 'QA';
    const isIssuer = currentUserRole === 'ISS';
    const isHOD = currentUserRole === 'HOD';
  
    return permitList.filter(permit => {
      if (!hasViewAccess()) return false;
      if (isHOD && !isInUserDepartment(permit)) return false;
      
      // Apply location filters if any are set
      if (locationFilters.length > 0 && !locationFilters.includes(permit.JobLocation)) return false;
  
      switch (currentTab) {
        case 'ongoing':
          return (permit.Status === 'Approved' && 
                (permit.CompletionStatus === 'In Progress' || 
                 permit.CompletionStatus === 'Pending Completion')) ||
                 // Include revocation pending permits in the ongoing tab
                 permit.Status.toLowerCase() === 'revocation pending';
  
        case 'completed':
          return permit.CompletionStatus === 'Job Completed';
  
        case 'revoked':
          return permit.Status === 'Revoked';
  
        default:
          return false;
      }
    });
  };
  
  const getStatusColor = (status, completionStatus, currentTab) => {
    if (status.toLowerCase() === 'revocation pending') {
      return 'text-gray-500';
    }
    
    if (currentTab === 'revoked') {
      return 'text-gray-500';
    }
    
    switch (completionStatus?.toLowerCase()) {
      case 'job completed':
        return 'text-blue-500';
      case 'in progress':
        return 'text-orange-500';
      case 'pending completion':
        return 'text-orange-500'; 
      case 'revoked':
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-orange-500';
    }
  };
  
  const getDisplayStatus = (status, completionStatus, currentTab) => {
    if (status.toLowerCase() === 'revocation pending') {
      return 'REVOCATION PENDING';
    }
    
    if (status === 'Revoked') {
      return 'REVOKED';
    }
  
    // Check IssuerCompletionStatus first
    if (status === 'Approved') {
      switch (completionStatus) {
        case 'Pending Completion':
          return 'ONGOING';
        case 'Job Completed':
          return 'COMPLETED';
        case 'In Progress':
          return 'ONGOING';
        default:
          return status === 'Rejected' ? 'REJECTED' : 'ONGOING';
      }
    }
    return status.toUpperCase();
  };

  // Get all filtered permits first
  const allFilteredPermits = getFilteredPermits();
  
  // Then paginate the filtered permits
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPermits = allFilteredPermits.slice(startIndex, startIndex + itemsPerPage);

  // Don't allow selection of Revocation Pending permits
  const canBeSelected = (permit) => {
    return permit.Status.toLowerCase() !== 'revocation pending';
  };

  // Filter locations based on search
  const filteredLocations = uniqueLocations.filter(location => 
    location.toLowerCase().includes(searchLocationFilter.toLowerCase())
  );

  return (
    <div className="mt-2">
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <div className="w-1/3">
            <Input 
              placeholder="Search PTW ID (e.g., PTW-0001)" 
              value={searchValue}
              onChange={handleSearchInputChange}
              className="w-full"
            />
          </div>
          <Button 
            variant="primary" 
            onClick={() => handleSearch(searchValue)}
            className="w-[150px]"
          >
            Search
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => {
              setSearchValue('');
              setLocationFilters([]);
              setCurrentPage(1);
              fetchPermits();
            }}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <div className="relative" ref={locationFilterRef}>
            <Button 
              variant={locationFilters.length > 0 ? "primary" : "secondary"}
              onClick={() => setShowLocationFilter(!showLocationFilter)}
              className={`flex items-center gap-2 ${locationFilters.length > 0 ? "bg-blue-500" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              <Filter className="w-4 h-4" />
              {locationFilters.length > 0 ? `Locations (${locationFilters.length})` : "Filter by Location"}
              <ChevronDown className="w-4 h-4" />
            </Button>
            {showLocationFilter && (
              <div className="absolute z-10 mt-2 w-72 bg-white rounded-md shadow-lg border overflow-hidden">
                <div className="p-2 border-b">
                  <Input 
                    placeholder="Search locations..." 
                    value={searchLocationFilter}
                    onChange={handleFilterSearch}
                    className="w-full text-sm"
                  />
                </div>
                <div className="p-2 border-b flex justify-between">
                  <Button 
                    variant="ghost" 
                    onClick={handleSelectAll}
                    className="text-blue-500 text-xs hover:bg-blue-50"
                    size="sm"
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleClearAllFilters}
                    className="text-gray-500 text-xs hover:bg-gray-50"
                    size="sm"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map(location => (
                      <div 
                        key={location}
                        className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Checkbox
                          checked={locationFilters.includes(location)}
                          onCheckedChange={() => handleLocationFilterChange(location)}
                          id={`location-${location}`}
                        />
                        <label 
                          htmlFor={`location-${location}`}
                          className="flex-grow cursor-pointer"
                        >
                          {location}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-center">
                      No locations match your search
                    </div>
                  )}
                </div>
                <div className="p-2 border-t flex justify-end">
                  <Button 
                    variant="primary" 
                    onClick={() => setShowLocationFilter(false)}
                    size="sm"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Active filter tags */}
        {locationFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {locationFilters.map(filter => (
              <div 
                key={filter}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
              >
                <span>{filter}</span>
                <button 
                  onClick={() => handleRemoveFilter(filter)}
                  className="text-blue-800 hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {locationFilters.length > 1 && (
              <button
                onClick={handleClearAllFilters}
                className="text-blue-600 text-sm hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Jobs Monitoring</h2>
            </div>
            <div className="flex gap-2 border-b">
              <TabButton
                id="ongoing"
                label="Ongoing Jobs"
                active={currentTab === 'ongoing'}
                onClick={setCurrentTab}
              />
              <TabButton
                id="completed"
                label="Completed"
                active={currentTab === 'completed'}
                onClick={setCurrentTab}
              />
              <TabButton
                id="revoked"
                label="Revoked"
                active={currentTab === 'revoked'}
                onClick={setCurrentTab}
              />
            </div>
            {canRevokePermits() && selectedPermits.length > 0 && (
              <Button 
                variant="danger"
                onClick={handleRevoke}
                className="w-fit flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                REVOKE PERMIT{selectedPermits.length > 1 ? 'S' : ''}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {loading && <div className="text-center py-4">Loading jobs...</div>}
          {error && <div className="text-red-500 text-center py-4">{error}</div>}
          
          {!loading && !error && (
            <Table>
              <TableHead>
                <TableRow>
                  {canRevokePermits() && currentTab === 'ongoing' && (
                    <TableCell className="w-12">
                      <Checkbox disabled />
                    </TableCell>
                  )}
                  <TableCell className="text-base font-medium">Actions</TableCell>
                  <TableCell className="text-base font-medium">Permit ID</TableCell>
                  <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                  <TableCell className="text-base font-medium">Job Location</TableCell>
                  <TableCell className="text-base font-medium">Start Date</TableCell>
                  <TableCell className="text-base font-medium">End Date</TableCell>
                  <TableCell className="text-base font-medium">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPermits.length > 0 ? (
                  paginatedPermits.map((permit) => (
                    <TableRow key={permit.PermitToWorkID}>
                      {canRevokePermits() && currentTab === 'ongoing' && (
                        <TableCell>
                          <Checkbox
                            checked={selectedPermits.includes(permit.PermitToWorkID)}
                            onCheckedChange={() => handleCheckboxChange(permit.PermitToWorkID)}
                            disabled={!canBeSelected(permit)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleView(permit)}
                          className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium w-24"
                        >
                          <Eye size={14} className="mr-1" /> {permit.Status.toLowerCase() === 'revocation pending' && currentUser?.roleId === 'QA' ? 'Review' : 'View'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>PTW-{String(permit.PermitToWorkID).padStart(4, '0')}</span>
                          <span className={getStatusColor(permit.Status, permit.CompletionStatus, currentTab)}>
                          {permit.Status.toLowerCase() === 'revocation pending' 
                            ? 'Revocation Pending' 
                            : currentTab === 'completed' 
                              ? 'Job Completed' 
                              : currentTab === 'revoked'
                                ? 'Revoked'
                                : permit.CompletionStatus === 'Pending Completion'
                                  ? 'Pending Completion'
                                  : permit.CompletionStatus || 'In Progress'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{permit.PermitReceiver}</TableCell>
                      <TableCell>{permit.JobLocation}</TableCell>
                      <TableCell>{formatDate(permit.EntryDate)}</TableCell>
                      <TableCell>{formatDate(permit.ExitDate)}</TableCell>
                      <TableCell>{getDisplayStatus(permit.Status, permit.CompletionStatus, currentTab)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    {canRevokePermits() && currentTab === 'ongoing' && <TableCell />}
                    <TableCell colSpan={7} className="text-center py-4">
                      No jobs found for this tab
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination Controls */}
          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <div>
              {totalPermits > 0 ? 
                `Showing ${Math.min(totalPermits, (currentPage - 1) * itemsPerPage + 1)} to ${Math.min(currentPage * itemsPerPage, totalPermits)} of ${totalPermits} jobs` : 
                'No jobs to display'}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPermits === 0}
                className="font-semibold text-gray-500 hover:text-black"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPermits === 0}
                className="font-semibold text-gray-500 hover:text-black"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-[80px]">
                  <img src={logo} alt="Company Logo" className="h-[80px] w-[80px]" />
                </div>
                <div className="flex-grow ml-40">
                  <h1 className="text-xl font-semibold">REVOKE PERMIT TO WORK</h1>
                </div>
              </div>
            </CardHeader>

            <div className="px-6 py-2 border-b">
              <p className="text-sm text-gray-600">
              Selected Permits: {getSelectedPermitNumbers()}
              </p>
            </div>

            <CardContent>
              <div className="flex flex-col">
                <label className="mb-2">Reason for Revocation</label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => {
                    setRevokeReason(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter detailed reason for revoking the permit(s)..."
                  className="w-full min-h-[150px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && (
                  <p className="text-sm text-red-500 mt-2">{error}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={handleModalClose} 
              className="border-gray-400 text-gray-700 bg-white hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button 
              variant="danger"
              onClick={handleRevokeSubmit}
              disabled={isSubmitting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Revoke Permit{selectedPermits.length > 1 ? 's' : ''}
            </Button>
          </CardFooter>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="text-center">
              <p className="mb-4 text-gray-700">
                Are you sure you want to revoke the following permits: {getSelectedPermitNumbers()}?
              </p>
              <div className="flex justify-center space-x-4">
              <Button 
                variant="outline"
                className="border-gray-400 text-gray-700 bg-white hover:bg-gray-200"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleConfirmRevoke}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Revoking...' : 'Confirm Revoke'}
              </Button>
            </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JobsMonitoring;