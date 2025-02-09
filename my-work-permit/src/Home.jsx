import React, {useState, useEffect} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Activity, Clock, AlertTriangle, CheckCircle, XCircle, RotateCcw, Shield } from "lucide-react";
import { api } from './services/api';

const StatusCard = ({ title, data, icon: Icon }) => {
  const totalSummary = data.reduce((total, item) => total + item.summary, 0);
  
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revoked':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return Clock;
      case 'approved':
      case 'active':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'revoked':
        return RotateCcw;
      case 'expired':
        return AlertTriangle;
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
            <p className="text-sm text-gray-500">Last 30 days</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
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
  const [currentUser, setCurrentUser] = useState(null);
  const [jobPermitStats, setJobPermitStats] = useState([
    { status: 'Pending', summary: 0 },
    { status: 'Approved', summary: 0 },
    { status: 'Rejected', summary: 0 },
    { status: 'Revoked', summary: 0 },
  ]);

  const [ptwStats, setPtwStats] = useState([
    { status: 'Pending', summary: 0 },
    { status: 'Approved', summary: 0 },
    { status: 'Rejected', summary: 0 },
    //{ status: 'Revoked', summary: 0 },
    //{ status: 'Expired', summary: 0 },
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

  // Fetch permits to work
  const fetchPermitsToWork = async () => {
    try {
      if (!currentUser) return;
  
      const response = await api.getPermitsToWork();
      
      if (response.success && response.data) { // Changed to match your API response structure
        let filteredPermits = response.data;
        
        // Filter based on role and department
        if (currentUser.roleId !== 'QA' && currentUser.departmentId !== 'QHSSE') {
          if (['ISS', 'HOD'].includes(currentUser.roleId)) {
            // Department heads see permits from their department
            filteredPermits = filteredPermits.filter(permit => 
              permit.Department === currentUser.departmentId ||
              permit.AssignedTo === currentUser.roleId
            );
          }
        }
        
        setPtwPermits(filteredPermits);
      }
    } catch (error) {
      console.error('Error fetching permits to work:', error);
    }
  };

  // Calculate job permit statistics
  useEffect(() => {
    if (!permits || !Array.isArray(permits)) return;

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter permits for last 30 days
    const recentPermits = permits.filter(permit => 
      new Date(permit.Created) >= thirtyDaysAgo
    );

    // Calculate job permit statistics
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

    // Update job permit stats
    setJobPermitStats([
      { status: 'Pending', summary: jobStats.Pending },
      { status: 'Approved', summary: jobStats.Approved },
      { status: 'Rejected', summary: jobStats.Rejected },
      { status: 'Revoked', summary: jobStats.Revoked },
    ]);
  }, [permits]);



  // Calculate PTW statistics
  useEffect(() => {
    if (!ptwPermits || !Array.isArray(ptwPermits)) return;

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter PTW permits for last 30 days
    const recentPTWs = ptwPermits.filter(permit => 
      new Date(permit.Created) >= thirtyDaysAgo
    );

    // Calculate PTW statistics
    const stats = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      //Revoked: 0,
      //Expired: 0
    };

    recentPTWs.forEach(permit => {
      const status = permit.Status;
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });

    // Update PTW stats
    setPtwStats([
      { status: 'Pending', summary: stats.Pending },
      { status: 'Approved', summary: stats.Approved },
      { status: 'Rejected', summary: stats.Rejected },
      //{ status: 'Revoked', summary: stats.Revoked },
      //{ status: 'Expired', summary: stats.Expired },
    ]);
  }, [ptwPermits]);

  // Fetch permits when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchPermits();
      fetchPermitsToWork();
    }
  }, [currentUser]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety Management Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of Job Permits Requests and Permits To Work from the last 30 days
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleString(('en-GB'))}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
        </div>
      </div>
    </div>
  );
};

export default Home;