import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Input } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { Eye, XCircle,RefreshCw } from 'lucide-react';
import { api } from './services/api';
import Checkbox from './components/ui/checkbox';
import logo from './assets/mps_logo.jpg';

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

const ApprovalHistory = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('jobPermits');
  const [searchParams, setSearchParams] = useState({
    permitId: '',
    changedStartDate: '',
    changedEndDate: '',  
  });
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPermits, setSelectedPermits] = useState([]);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPermits, setTotalPermits] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const userData = JSON.parse(savedData)?.user;
    setCurrentUser(userData);
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const validStatuses = ['approved', 'revoked'];
      let searchId = searchParams.permitId.trim();
      
      // Handle prefix for search
      if (searchId) {
        if (currentTab === 'jobPermits') {
          searchId = searchId.replace(/^(jp-|ptw-)/i, '');
          searchId = 'JP-' + searchId;
        } else {
          searchId = searchId.replace(/^(jp-|ptw-)/i, '');
          searchId = 'PTW-' + searchId;
        }
      }
  
      let responses;
      
      if (currentTab === 'jobPermits') {
        // For Job Permits tab
        const promises = validStatuses.map(status => {
          return api.searchPermits({
            ...searchParams,
            permitId: searchId,
            page: currentPage,
            limit: itemsPerPage,
            status
          }, currentUser);
        });
        responses = await Promise.all(promises);
      } else {
        // For Permit to Work tab - use getPermitsToWork instead of searchPTW
        const response = await api.getPermitsToWork();
        // Filter for approved and revoked permits only
        const filteredPermits = response.data.filter(permit => 
          validStatuses.includes(permit.Status.toLowerCase())
        );
        responses = [{ success: true, data: filteredPermits }];
      }
      
      let combinedData = [];
      let totalCount = 0;
  
      responses.forEach(response => {
        if (response.success) {
          const filteredData = response.data.filter(permit => 
            permit.Status.toLowerCase() === 'approved' || 
            permit.Status.toLowerCase() === 'revoked'
          );
          combinedData = [...combinedData, ...filteredData];
          totalCount += filteredData.length;
        }
      });
  
      const formattedData = combinedData.map(permit => {
        const isPTW = currentTab === 'permitToWork';
        const permitIdField = isPTW ? 'PermitToWorkID' : 'JobPermitID';
        const id = isPTW 
          ? `PTW-${String(permit[permitIdField] || '').padStart(4, '0')}`
          : `JP-${String(permit.JobPermitID || '').padStart(4, '0')}`;
        
        return {
          type: isPTW ? 'Permit to Work' : 'Job Permit',
          id: id,
          permitId: isPTW ? (permit[permitIdField] || '') : (permit.JobPermitID || ''),
          status: permit.Status || '',
          permitReceiver: isPTW ? permit.PermitReceiver : permit.PermitReceiver,
          companyName: permit.ContractCompanyName || 'N/A',
          jobDescription: permit.JobDescription || 'N/A',
          lastActionDate: new Date(permit.Changed || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          routePath: isPTW
            ? `/dashboard/permits/permit-to-work/view/${permit[permitIdField] || ''}`
            : `/dashboard/permits/view/${permit.JobPermitID || ''}`
        };
      });
  
      formattedData.sort((a, b) => 
        new Date(b.lastActionDate) - new Date(a.lastActionDate)
      );
  
      setApprovalHistory(formattedData);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
      setTotalPermits(totalCount);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setError('Failed to fetch approvals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchApprovals();
    }
  }, [currentUser, currentTab, currentPage]);

  const resetFilters = () => {
    setSearchParams({
      permitId: '',
      changedStartDate: '', 
      changedEndDate: '',
    });
    fetchApprovals();
  };

  const handleView = (routePath) => {
    navigate(routePath);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'rejected': return 'text-red-500';
      case 'approved': return 'text-green-500';
      case 'revoked': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getSelectedPermitNumbers = () => {
    return approvalHistory
      .filter(permit => selectedPermits.includes(permit.permitId)) 
      .map(permit => permit.id) 
      .join(', ');
  };

  const canRevokePermits = () => {
    const currentUserRole = currentUser?.roleId;
    return ['ISS', 'QA'].includes(currentUserRole) && currentTab === 'jobPermits';
  };

  const handleCheckboxChange = (permitId) => {
    const permit = approvalHistory.find(p => p.permitId === permitId);
    if (permit?.status?.toLowerCase() !== 'approved') return;

    setSelectedPermits(prev => {
      if (prev.includes(permitId)) {
        return prev.filter(id => id !== permitId);
      }
      return [...prev, permitId];
    });
  };

  const handleModalClose = () => {
    setShowRevokeModal(false);
    setError(null);
    setRevokeReason('');
    fetchApprovals();
  };

  const handleRevoke = () => {
    setError(null);
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
      const permitsToRevoke = selectedPermits.map(permitId => ({
        id: permitId,
        type: currentTab === 'jobPermits' ? 'job' : 'work'
      }));

      const response = await api.revokePermits(permitsToRevoke, revokeReason);
      
      if (response.success) {
        setShowRevokeModal(false);
        setShowConfirmation(false);
        setSelectedPermits([]);
        setRevokeReason('');
        
        const message = currentUser?.roleId === 'QA' 
          ? 'Permits have been successfully revoked'
          : 'Revocation request has been submitted for QHSSE approval';
          
        fetchApprovals();
      } else {
        setError(response.error || 'Failed to revoke permits');
      }
    } catch (err) {
      setError('Error revoking permits: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
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
                  placeholder={`Search ${currentTab === 'jobPermits' ? 'JP' : 'PTW'} ID number`}
                  value={searchParams.permitId}
                  onChange={(e) => {
                    setSearchParams({ ...searchParams, permitId: e.target.value });
                    if (!e.target.value.trim()) {
                      fetchApprovals();
                    }
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  Filter by Last Action Date:
                </span>
                <Input 
                  type="date"
                  value={searchParams.changedStartDate}
                  onChange={(e) => setSearchParams({ ...searchParams, changedStartDate: e.target.value })}
                  className="flex-1"
                />
                <span className="self-center text-gray-400">→</span>
                <Input 
                  type="date"
                  value={searchParams.changedEndDate}
                  onChange={(e) => setSearchParams({ ...searchParams, changedEndDate: e.target.value })}
                  className="flex-1"
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
          </div>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">Approval History</h1>
            </div>
            <div className="flex gap-2 border-b">
              <TabButton
                id="jobPermits"
                label="Job Permits"
                active={currentTab === 'jobPermits'}
                onClick={setCurrentTab}
              />
              <TabButton
                id="permitToWork"
                label="Permit to Work"
                active={currentTab === 'permitToWork'}
                onClick={setCurrentTab}
              />
            </div>
            {currentTab === 'jobPermits' && canRevokePermits() && selectedPermits.length > 0 && (
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
        <CardContent className="p-4">
          {loading && (
            <div className="text-center py-4">
              Loading approval history...
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center py-4">
              {error}
            </div>
          )}

          {!loading && !error && (
            <Table>
              <TableHead>
                <TableRow>
                  {currentTab === 'jobPermits' && canRevokePermits() && (
                    <TableCell className="w-12">
                      <Checkbox disabled />
                    </TableCell>
                  )}
                  <TableCell className="text-base font-medium">Actions</TableCell>
                  <TableCell className="text-base font-medium">Permit ID</TableCell>
                  <TableCell className="text-base font-medium">Permit Receiver</TableCell>
                  <TableCell className="text-base font-medium">Company</TableCell>
                  <TableCell className="text-base font-medium">Job Description</TableCell>
                  <TableCell className="text-base font-medium">Last Action Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvalHistory.map((permit, index) => (
                  <TableRow key={index}>
                    {currentTab === 'jobPermits' && canRevokePermits() && (
                      <TableCell>
                        <Checkbox
                          checked={selectedPermits.includes(permit.permitId)}
                          onCheckedChange={() => handleCheckboxChange(permit.permitId)}
                          disabled={permit.status.toLowerCase() !== 'approved'}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleView(permit.routePath)}
                        className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium"
                      >
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{permit.id}</span>
                        <span className={getStatusColor(permit.status)}>{permit.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{permit.permitReceiver}</TableCell>
                    <TableCell>{permit.companyName}</TableCell>
                    <TableCell>{permit.jobDescription}</TableCell>
                    <TableCell>{permit.lastActionDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalPermits)} of {totalPermits} permits
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
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
                  <h1 className="text-xl font-semibold">REVOKE PERMIT DOCUMENTATION</h1>
                </div>
              </div>
            </CardHeader>

            <div className="px-6 py-2 border-b">
              <p className="text-sm text-gray-500">
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
              <Button variant="outline" onClick={handleModalClose} className="border-gray-400 text-gray-700 bg-white hover:bg-gray-200">
                Cancel
              </Button>
              <Button 
                variant="danger"
                onClick={handleRevokeSubmit}
                disabled={isSubmitting}
              >
                Revoke {selectedPermits.length > 1 ? 's' : ''}
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
                Are you sure you want to initiate the revoking process for {getSelectedPermitNumbers()}?
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

export default ApprovalHistory;