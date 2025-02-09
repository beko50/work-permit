import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { api } from './services/api';
import Checkbox  from './components/ui/checkbox';
import { Eye,RefreshCw, PlusCircle, XCircle, ChevronDown } from 'lucide-react';

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

const JobsMonitoring = () => {
  const navigate = useNavigate();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('ongoing');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPermits, setSelectedPermits] = useState([]);

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

  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPermitsToWork();
      if (response.success) {
        setPermits(response.data);
      } else {
        setError(response.error || 'Failed to fetch permits');
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
  }, [currentTab]);

  const handleView = (permit) => {
    console.log('Permit object:', permit);
    navigate(`/dashboard/permits/permit-to-work/view/${permit.PermitToWorkID}`);
  };

  const handleCheckboxChange = (permitId) => {
    setSelectedPermits(prev => {
      if (prev.includes(permitId)) {
        return prev.filter(id => id !== permitId);
      }
      return [...prev, permitId];
    });
  };

  const isInUserDepartment = (permit) => {
    if (!currentUser?.departmentId && !currentUser?.departmentName) return false;
    return (
      permit.Department === currentUser.departmentId ||
      permit.Department === currentUser.departmentName
    );
  };

  const getFilteredPermits = () => {
    if (!currentUser) return [];

    const currentUserRole = currentUser.roleId;
    const isQHSSE = currentUserRole === 'QA';

    return permits.filter(permit => {
      if (currentTab === 'ongoing') {
        return permit.Status === 'Approved' && permit.AssignedTo === 'ONGOING';
      }

      switch (currentTab) {
        case 'ongoing':
          if (isQHSSE) return status === 'approved';
          
          if (['ISS', 'HOD'].includes(currentUserRole)) {
            return status === 'approved' && 
                   isInUserDepartment(permit) && 
                   permit.AssignedTo === currentUserRole;
          }
          
          return status === 'approved' && permit.AssignedTo === currentUserRole;

        case 'completed':
          if (isQHSSE) return status === 'completed';
          return status === 'completed' && 
                 (isInUserDepartment(permit) || permit.AssignedTo === currentUserRole);

        case 'revoked-rejected':
          if (isQHSSE) return ['revoked', 'rejected'].includes(status);
          return ['revoked', 'rejected'].includes(status) && 
                 (isInUserDepartment(permit) || permit.AssignedTo === currentUserRole);

        default:
          return false;
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'text-green-500';
      case 'completed': return 'text-blue-500';
      case 'revoked':
      case 'rejected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const filteredPermits = getFilteredPermits();

  return (
    <div className="mt-2">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Jobs Monitoring</h2>
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
                id="revoked-rejected"
                label="Revoked/Rejected"
                active={currentTab === 'revoked-rejected'}
                onClick={setCurrentTab}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading && <div className="text-center py-4">Loading jobs...</div>}
          {error && <div className="text-red-500 text-center py-4">{error}</div>}
          
          {!loading && !error && (
            <Table>
              <TableHead>
                <TableRow>
                <TableCell className="w-12">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => {}}
                  disabled={true}
                />
                  </TableCell>
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
                    {filteredPermits.length > 0 ? (
                      filteredPermits.map((permit) => (
                        <TableRow key={permit.PermitToWorkID}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedPermits.includes(permit.PermitToWorkID)}
                              onChange={() => handleCheckboxChange(permit.PermitToWorkID)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleView(permit)}
                              className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium"
                            >
                              <Eye size={14} className="mr-1" /> View
                            </Button>
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
                          <TableCell>{permit.JobLocation}</TableCell>
                          <TableCell>{formatDate(permit.EntryDate)}</TableCell>
                          <TableCell>{formatDate(permit.ExitDate)}</TableCell>
                          <TableCell>{permit.AssignedTo}</TableCell>
                       </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell>
                          <input type="checkbox" disabled className="cursor-not-allowed rounded border-gray-300" />
                        </TableCell>
                        <TableCell colSpan={5} className="text-center py-4">
                          No jobs found for this tab
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
            </Table>
          )}
          
          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Showing {filteredPermits.length} Job(s)
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsMonitoring;