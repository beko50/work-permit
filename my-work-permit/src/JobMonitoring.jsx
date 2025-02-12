import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { api } from './services/api';
import Checkbox  from './components/ui/checkbox';
import logo from './assets/mps_logo.jpg';
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
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    navigate(`/dashboard/jobs-monitoring/review/${permit.PermitToWorkID}`);
  };

  const handleCheckboxChange = (permitId) => {
    setSelectedPermits(prev => {
      if (prev.includes(permitId)) {
        return prev.filter(id => id !== permitId);
      }
      return [...prev, permitId];
    });
  };

  const handleRevoke = () => {
    setShowRevokeModal(true);
  };

  const handleRevokeSubmit = () => {
    if (revokeReason.trim().length < 10) {
      setError('Reason must be at least 10 characters long');
      return;
    }
    setError(null);
    setShowConfirmation(true);
  };

  const handleConfirmRevoke = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.revokePermits(selectedPermits, revokeReason);
      if (response.success) {
        setShowRevokeModal(false);
        setShowConfirmation(false);
        setSelectedPermits([]);
        setRevokeReason('');
        fetchPermits();
      } else {
        setError('Failed to revoke permits');
      }
    } catch (err) {
      setError('Error revoking permits');
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

  const getFilteredPermits = () => {
    if (!currentUser) return [];

    const currentUserRole = currentUser.roleId;
    const isQHSSE = currentUserRole === 'QA';
    const isIssuer = currentUserRole === 'ISS';
    const isHOD = currentUserRole === 'HOD';

    return permits.filter(permit => {
      // Check if user has any kind of access
      if (!hasViewAccess()) return false;

      // For HOD, only show permits from their department
      if (isHOD && !isInUserDepartment(permit)) return false;

      switch (currentTab) {
        case 'ongoing':
          return permit.Status === 'Approved' && 
                 (!permit.CompletionStatus || 
                  permit.CompletionStatus === 'In Progress');

        case 'completed':
          return permit.CompletionStatus === 'Job Completed';

        case 'revoked':
          return ['Revoked'].includes(permit.Status);

        default:
          return false;
      }
    });
  };

  const getStatusColor = (status, completionStatus) => {
    switch (completionStatus?.toLowerCase()) {
      case 'job completed':
        return 'text-green-500';
      case 'in progress':
        return 'text-orange-500';
      case 'revoked':
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-orange-500';
    }
  };

  const getDisplayStatus = (status, completionStatus, currentTab) => {
    if (completionStatus === 'In Progress') {
      return 'ONGOING';
    }
    if (completionStatus === 'Job Completed') {
      return 'COMPLETED';
    }
    if (['Revoked', 'Rejected'].includes(status)) {
      return status.toUpperCase();
    }
    return 'ONGOING'; // Default case
  };

  const filteredPermits = getFilteredPermits();

  return (
    <div className="mt-2">
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
          {canRevokePermits() && (
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
        {filteredPermits.length > 0 ? (
          filteredPermits.map((permit) => (
            <TableRow key={permit.PermitToWorkID}>
              {canRevokePermits() && (
                <TableCell>
                  <Checkbox
                    checked={selectedPermits.includes(permit.PermitToWorkID)}
                    onCheckedChange={() => handleCheckboxChange(permit.PermitToWorkID)}
                  />
                </TableCell>
              )}
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
                  <span className={getStatusColor(permit.Status, permit.CompletionStatus)}>
                  {currentTab === 'completed' 
                    ? 'Job Completed' 
                    : currentTab === 'ongoing' 
                      ? 'In Progress'
                      : permit.Status}
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
            {canRevokePermits() && <TableCell />}
            <TableCell colSpan={7} className="text-center py-4">
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
              <p className="text-sm text-gray-500">
                Selected Permits: {selectedPermits.length} {selectedPermits.length === 1 ? 'permit' : 'permits'}
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
              <Button variant="outline" onClick={() => setShowRevokeModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="danger"
                onClick={handleRevokeSubmit}
                disabled={isSubmitting}
              >
                Revoke Permit{selectedPermits.length > 1 ? 's' : ''}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <Dialog
          isOpen={showConfirmation}
          onClose={() => !isSubmitting && setShowConfirmation(false)}
          title="Confirm Permit Revocation"
        >
          <div className="text-center">
            <p className="mb-4 text-gray-700">
              Are you sure you want to initiate the revoking process for {selectedPermits.length} {selectedPermits.length === 1 ? 'permit' : 'permits'}?
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleConfirmRevoke}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Revoking...' : 'Confirm Revoke'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default JobsMonitoring;