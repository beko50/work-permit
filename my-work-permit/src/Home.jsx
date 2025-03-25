import React, {useState, useEffect} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Activity, Clock, AlertTriangle, CheckCircle, XCircle, RotateCcw, Shield, Briefcase} from "lucide-react";
import { api } from './services/api';

const StatusCard = ({ title, data, icon: Icon }) => {
  const totalSummary = data.reduce((total, item) => total + item.summary, 0);
  
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revoked':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
      case 'ongoing':
        return Clock;
      case 'approved':
      case 'active':
      case 'completed':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'revoked':
        return RotateCcw;
      default:
        return Activity;
    }
  };

  return (
    <Card className="relative hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="relative">
        <div className="absolute top-0 right-0 p-4 text-right">
          <span className="text-2xl font-bold text-blue-600">{totalSummary}</span>
          <span className="text-sm text-gray-500 block">Total</span>
        </div>

        <div className="flex items-start space-x-2">
          <div className="p-2 rounded-lg bg-blue-50">
            <Icon className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title}
            </CardTitle>
            <p className="text-sm text-gray-500">Last 90 days</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {data.map(({ status, summary }) => {
            const StatusIcon = getStatusIcon(status);
            return (
              <div 
                key={status} 
                className="flex items-center justify-between p-3 rounded-lg bg-white border hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${getStatusColor(status)}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{summary}</span>
              </div>
            )}
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Home = () => {
  const [permits, setPermits] = useState([]);
  const [ptwPermits, setPtwPermits] = useState([]);
  const [jobsData, setJobsData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [jobPermitStats, setJobPermitStats] = useState([
    { status: 'Pending', summary: 0 },
    { status: 'Approved', summary: 0 },
    { status: 'Rejected', summary: 0 },
    { status: 'Revoked', summary: 0 }
  ]);

  const [ptwStats, setPtwStats] = useState([
    { status: 'Pending', summary: 0 },
    { status: 'Approved', summary: 0 },
    { status: 'Rejected', summary: 0 },
    { status: 'Revoked', summary: 0 }
  ]);

  const [jobsStats, setJobsStats] = useState([
    { status: 'Ongoing', summary: 0 },
    { status: 'Completed', summary: 0 },
    { status: 'Revoked', summary: 0 },
  ]);

  // Get user info from localStorage
  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const parsedData = JSON.parse(savedData);
    setCurrentUser(parsedData?.user);
  }, []);

  // Fetch job permits
  const fetchPermits = async () => {
    try {
      if (!currentUser) return;

      let response;
      if (currentUser.roleId === 'QA' || currentUser.departmentId === 'QHSSE') {
        response = await api.searchPermits({
          page: 1,
          limit: 1000
        }, currentUser);
      } else if (currentUser.roleId === 'HOD' || currentUser.roleId === 'ISS') {
        response = await api.getPermitsByDepartment(currentUser.departmentId);
      } else {
        response = await api.getPermits({}, currentUser);
      }

      if (response.success) {
        const permitData = response.data || response.permits || [];
        setPermits(permitData);
      }
    } catch (error) {
      console.error('Error fetching permits:', error);
    }
  };

  // Fetch permits to work and jobs data
  const fetchPermitsAndJobs = async () => {
    try {
      if (!currentUser) return;
  
      const response = await api.getPermitsToWork();
      
      if (response.success && response.data) {
        let filteredPermits = response.data;
        
        // Define department mappings
        const departmentMappings = {
          'ASM': ['Asset Maintenance', 'ASM'],
          'OPS': ['Operations', 'OPS'],
          'IT': ['IT'],
          'QHSSE': ['QHSSE']
        };
  
        // QA and QHSSE users see all permits
        if (currentUser.roleId !== 'QA' && currentUser.departmentId !== 'QHSSE') {
          if (['ISS', 'HOD'].includes(currentUser.roleId)) {
            // ISS and HOD users see permits from their department
            filteredPermits = filteredPermits.filter(permit => {
              const validDepartments = departmentMappings[currentUser.departmentId] || [];
              return validDepartments.includes(permit.Department) ||
                     permit.AssignedTo === currentUser.roleId;
            });
          } else {
            // Regular users (including ASM and OPS) see permits from their department
            filteredPermits = filteredPermits.filter(permit => {
              const validDepartments = departmentMappings[currentUser.departmentId] || [];
              return validDepartments.includes(permit.Department);
            });
          }
        }
        
        setPtwPermits(filteredPermits);
        setJobsData(filteredPermits);
      }
    } catch (error) {
      console.error('Error fetching permits and jobs:', error);
    }
  };

  // Calculate job permit statistics
  useEffect(() => {
    if (!permits || !Array.isArray(permits)) return;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentPermits = permits.filter(permit => 
      new Date(permit.Created) >= ninetyDaysAgo
    );

    const jobStats = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      Revoked: 0
    };

    recentPermits.forEach(permit => {
      if (jobStats.hasOwnProperty(permit.Status)) {
        jobStats[permit.Status]++;
      }
    });

    setJobPermitStats([
      { status: 'Pending', summary: jobStats.Pending },
      { status: 'Approved', summary: jobStats.Approved },
      { status: 'Rejected', summary: jobStats.Rejected },
      { status: 'Revoked', summary: jobStats.Revoked }
    ]);
  }, [permits]);

  // Calculate PTW statistics
  useEffect(() => {
    if (!ptwPermits || !Array.isArray(ptwPermits)) return;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentPTWs = ptwPermits.filter(permit => 
      new Date(permit.Created) >= ninetyDaysAgo
    );

    const stats = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      Revoked: 0
    };

    recentPTWs.forEach(permit => {
      if (stats.hasOwnProperty(permit.Status)) {
        stats[permit.Status]++;
      }
    });

    setPtwStats([
      { status: 'Pending', summary: stats.Pending },
      { status: 'Approved', summary: stats.Approved },
      { status: 'Rejected', summary: stats.Rejected },
      { status: 'Revoked', summary: stats.Revoked }
    ]);
  }, [ptwPermits]);

  // Calculate Jobs statistics
  // Calculate Jobs statistics
useEffect(() => {
  if (!jobsData || !Array.isArray(jobsData)) return;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentJobs = jobsData.filter(job => 
    new Date(job.Created) >= ninetyDaysAgo
  );

  const stats = {
    Ongoing: 0,
    Completed: 0,
    Revoked: 0,
  };

  recentJobs.forEach(job => {
    // Check the job's department matches the user's department
    const departmentMappings = {
      'ASM': ['Asset Maintenance', 'ASM'],
      'OPS': ['Operations', 'OPS'],
      'IT': ['IT'],
      'QHSSE': ['QHSSE']
    };

    const userDepartments = departmentMappings[currentUser?.departmentId] || [];
    const isUserDepartment = userDepartments.includes(job.Department);

    // Only count if it's in the user's department or user is QA/QHSSE
    if (isUserDepartment || currentUser?.roleId === 'QA' || currentUser?.departmentId === 'QHSSE') {
      if (job.Status === 'Approved' && 
          ['In Progress', 'Pending Completion'].includes(job.CompletionStatus) &&
          job.Status !== 'Revoked' &&
          job.Status.toLowerCase() !== 'revocation pending' &&
          job.CompletionStatus !== 'Job Completed') {
        stats.Ongoing++;
      }
      else if (job.CompletionStatus === 'Job Completed') {
        stats.Completed++;
      }
      else if (job.Status === 'Revoked') {
        stats.Revoked++;
      }
    }
  });

  setJobsStats([
    { status: 'Ongoing', summary: stats.Ongoing },
    { status: 'Completed', summary: stats.Completed },
    { status: 'Revoked', summary: stats.Revoked },
  ]);
}, [jobsData, currentUser]); // Added currentUser to dependencies

  // Fetch data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchPermits();
      fetchPermitsAndJobs();
    }
  }, [currentUser]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety Management Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of Job Permits, Permits To Work, and Jobs from the last 90 days
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleString(('en-GB'))}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StatusCard 
            title="Request for Job Permits" 
            data={jobPermitStats} 
            icon={Shield}
          />
          <StatusCard 
            title="Permit To Work" 
            data={ptwStats} 
            icon={Activity}
          />
          <StatusCard 
            title="Jobs Monitoring" 
            data={jobsStats} 
            icon={Briefcase}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;