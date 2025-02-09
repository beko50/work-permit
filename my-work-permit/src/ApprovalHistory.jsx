import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Input } from './components/ui/form';
import { Table, TableHead, TableBody, TableRow, TableCell } from './components/ui/table';
import { Eye, RefreshCw } from 'lucide-react';
import { api } from './services/api';

const ApprovalHistory = () => {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useState({
    permitId: '',
    permitType: '',
    startDate: '',
    endDate: ''
  });
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const userData = JSON.parse(savedData)?.user;
    setCurrentUser(userData);
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch job permits
      let jobPermitsResponse;
      if (currentUser?.roleId === 'QA') {
        jobPermitsResponse = await api.getPermits({}, currentUser);
      } else if (currentUser?.roleId === 'HOD' || currentUser?.roleId === 'ISS') {
        jobPermitsResponse = await api.getPermitsByDepartment(currentUser.departmentId);
      } else {
        jobPermitsResponse = await api.getPermits(searchParams, currentUser);
      }

      // Fetch permit to works
      const ptwResponse = await api.getPermitsToWork();

      if (jobPermitsResponse.success && ptwResponse.success) {
        // Format job permits
        const jobPermits = jobPermitsResponse.data
          .filter(permit => 
            permit.Status?.toLowerCase() === 'approved' || 
            permit.Status?.toLowerCase() === 'rejected'
          )
          .map(permit => ({
            type: 'Job Permit',
            id: `JP-${String(permit.JobPermitID).padStart(4, '0')}`,
            status: permit.Status,
            jobDescription: permit.JobDescription,
            lastApprovedDate: new Date(permit.LastApproved || permit.Created).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            routePath: `/dashboard/permits/view/${permit.JobPermitID}`
          }));

        // Format permit to works
        const ptwPermits = ptwResponse.data
          .filter(permit => 
            permit.Status?.toLowerCase() === 'approved' || 
            permit.Status?.toLowerCase() === 'rejected'
          )
          .map(permit => ({
            type: 'Permit to Work',
            id: `PTW-${String(permit.JobPermitID).padStart(4, '0')}`,
            status: permit.Status,
            jobDescription: permit.WorkDescription,
            lastApprovedDate: new Date(permit.LastApproved || permit.Created).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            routePath: `/dashboard/permits/permit-to-work/job-permit/${permit.JobPermitID}`
          }));

        setApprovalHistory([...jobPermits, ...ptwPermits]);
      } else {
        setError('Failed to fetch permits');
      }
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
  }, [currentUser]);

  const handleView = (routePath) => {
    navigate(routePath);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'rejected': return 'text-red-500';
      case 'approved': return 'text-green-500';
      default: return 'text-gray-500';
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
                  placeholder="Search Permit ID number" 
                  value={searchParams.permitId}
                  onChange={(e) => setSearchParams({ ...searchParams, permitId: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <select
                  value={searchParams.permitType}
                  onChange={(e) => setSearchParams({ ...searchParams, permitType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">All Permit Types</option>
                  <option value="Job Permit">Job Permit</option>
                  <option value="Permit to Work">Permit to Work</option>
                </select>
              </div>
              <Button 
                variant="primary" 
                onClick={fetchApprovals}
                className="w-[150px]"
              >
                Search
              </Button>
            </div>

            {showAdvanced && (
              <div className="col-span-6 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  Last approved date:
                </span>
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
          <h1 className="text-2xl font-semibold">Approval History</h1>
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
                  <TableCell className="text-base font-medium">Actions</TableCell>
                  <TableCell className="text-base font-medium">Permit ID</TableCell>
                  <TableCell className="text-base font-medium">Permit Type</TableCell>
                  <TableCell className="text-base font-medium">Job Description</TableCell>
                  <TableCell className="text-base font-medium">Last Approved Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvalHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleView(item.routePath)}
                        className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium"
                      >
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{item.id}</span>
                        <span className={getStatusColor(item.status)}>{item.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.jobDescription}</TableCell>
                    <TableCell>{item.lastApprovedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end mt-4 text-sm text-gray-500">
            Rows per page: 15 | {`1-${approvalHistory.length} of ${approvalHistory.length}`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalHistory