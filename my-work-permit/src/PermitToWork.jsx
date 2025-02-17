import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/form';
import { Select } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { RefreshCw, ChevronDown } from 'lucide-react';
import RequestPTW from './RequestPTW';
import { api } from './services/api';

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
  const [searchValue, setSearchValue] = useState('');

  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 15
  });

  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const userData = JSON.parse(savedData)?.user;
    setCurrentUser(userData);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setCurrentTab('approved-job-permits'); // Ensure it starts on Pending tab
      fetchPermits();
    }
  }, [currentUser]);

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

  const getPermitActions = (permit) => {
    const reviewerRoles = ['ISS', 'HOD', 'QA'];
    
    // If permit is revoked, only allow viewing regardless of role
    if (permit.Status.toLowerCase() === 'revoked') {
      return ['View Permit To Work'];
    }
    
    // If status is Revocation Pending and current user is QA, allow review
    if (permit.Status.toLowerCase() === 'revocation pending' && currentUser?.roleId === 'QA') {
      return ['Review Permit To Work'];
    }
    
    // Otherwise, use existing logic for other statuses
    return (reviewerRoles.includes(currentUser?.roleId) && 
            permit.AssignedTo === currentUser?.roleId)
      ? ['Review Permit To Work']
      : ['View Permit To Work'];
  };

  const getStatusColor = (status) => {
    status = status.toLowerCase();
    if (status === 'pending') return 'text-yellow-500';
    if (status === 'approved') return 'text-green-500';
    if (status === 'rejected') return 'text-red-500';
    if (status === 'revoked') return 'text-gray-700';
    return 'text-gray-500';
  };

  const getRoleDisplayName = (roleId, status) => {
    // If status is Revocation Pending, assign to QHSSE APPROVER
    if (status.toLowerCase() === 'revocation pending') {
      return 'QHSSE APPROVER';
    }
  
    // If status is Rejected or Revoked, return null
    if (status.toLowerCase() === 'rejected' || status.toLowerCase() === 'revoked') {
      return null;
    }
  
    const roleDisplayMap = {
      'ISS': 'PERMIT ISSUER',
      'HOD': 'HOD / MANAGER',
      'QA': 'QHSSE APPROVER'
    };
    return roleDisplayMap[roleId] || roleId;
  };
  

  const handleSearch = async (searchValue) => {
    try {
      setLoading(true);
      setError(null);

      // If search is empty, fetch all permits
      if (!searchValue.trim()) {
        await fetchPermits();
        return;
      }

      // Extract numeric part from PTW ID (e.g., "PTW-0004" -> "4")
      const permitId = searchValue.trim().replace(/^PTW-0*/, '');
      
      // Validate permitId is a number
      if (!/^\d+$/.test(permitId)) {
        setError('Please enter a valid PTW ID (e.g., PTW-0001)');
        setPermits([]);
        return;
      }

      const response = await api.searchPTW({
        ...searchParams,
        permitId: parseInt(permitId)
      }, currentUser);

      if (response.success && response.data.length > 0) {
        setPermits(response.data);
        
        // Automatically switch to the appropriate tab based on the permit status
        const permit = response.data[0];
        const status = permit.Status.toLowerCase();
        const newTab = 
          status === 'pending' ? 'approved-job-permits' :
          status === 'approved' ? 'approved' :
          status === 'completed' ? 'completed' :
          status === 'rejected' ? 'rejected' :
          status === 'revoked' ? 'revoked' :
          currentTab;
        
        setCurrentTab(newTab);
      } else {
        setError('No permits found matching your search');
        setPermits([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error searching permits. Please try again.');
      setPermits([]);
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
      setCurrentTab('approved-job-permits'); // Reset to default tab
      fetchPermits(); // Fetch all permits
    } else {
      // Otherwise, debounce the search
      debouncedSearch(value);
    }
  };

  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getPermitsToWork();
      
      if (response.success) {
        setPermits(response.data);
      } else {
        setError(response.message || 'Error fetching permits');
        setPermits([]);
      }
    } catch (err) {
      setError('Error fetching permits. Please try again.');
      console.error('Error:', err);
      setPermits([]);
    } finally {
      setLoading(false);
    }
  };

  const Dropdown = ({ options, onSelect, className = '' }) => {
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
          <ul className="absolute z-10 w-48 border rounded-md mt-2 bg-gray-50 shadow-lg">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
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
        // For both normal review and revocation review, go to review page
        navigate(`/dashboard/permits/permit-to-work/review/${permitToWorkId}`);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const getFilteredPermits = () => {
    return permits.filter(permit => {
      const status = permit.Status.toLowerCase();
      switch (currentTab) {
        case 'approved-job-permits':
          return status === 'pending' || status === 'revocation pending'; // Include Revocation Pending
        case 'approved':
          return status === 'approved';
        case 'rejected':
          return status === 'rejected';
        case 'completed':
          return status === 'completed';
        case 'revoked':
          return status === 'revoked';
        default:
          return true;
      }
    });
  };

  const filteredPermits = getFilteredPermits();

  return (
    <div className="mt-0">
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
          </div>
      </div>

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
                id="rejected"
                label="Rejected"
                active={currentTab === 'rejected'}
                onClick={setCurrentTab}
              />
              <TabButton
                id="completed"
                label="Completed Job"
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
                  <TableCell>Actions</TableCell>
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
                        />
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
                      <TableCell>
                        {getRoleDisplayName(permit.AssignedTo, permit.Status) || '—'} {/* Display "—" if null */}
                      </TableCell>
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